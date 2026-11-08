import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { TestLedger } from '../src/store.js';
import { characterInput,slotState } from '../src/characters.js';
import { handleCharacterCommand } from '../src/character-commands.js';
import { characterCommands } from '../src/character-commands.js';
const guild='1566203164464513104';
const link=`https://discord.com/channels/${guild}/1566206538563981483/1566255808382238942`;
const input=(name,id)=>({name,sheet:`https://www.dndbeyond.com/characters/${id}`,stats:link,set:1,resources:'equipment'});

test('submission needs no RP sample and the slash command no longer requests one',()=>{
  assert.equal(characterInput(input('Lyra',123),guild).sample,'');
  const submit=characterCommands.find(c=>c.name==='ledger-character').options.find(c=>c.name==='submit');
  assert.equal(submit.options.some(o=>o.name==='sample'),false);
});

test('character submission validates sources, message guild, selected set and resources',()=>{
  assert.equal(characterInput(input('Lyra',123),guild).sheetId,'123');
  for(const patch of [{sheet:'https://dndbeyond.com.evil.test/characters/123'},{sheet:'https://x:dndbeyond.com@evil.test/characters/123'},{stats:link.replace(guild,'999999999999999999')},{set:4},{resources:'mixed'}])assert.throws(()=>characterInput({...input('Lyra',123),...patch},guild));
});
test('D&D Beyond share links retain their complete URL and stable character identity',()=>{
  const sheet='https://www.dndbeyond.com/characters/173040985/hE5rqg';
  const shared=characterInput({...input('Lyra',173040985),sheet},guild);
  assert.equal(shared.sheet,sheet);
  assert.equal(shared.sheetId,characterInput(input('Lyra',173040985),guild).sheetId);
  assert.equal(characterInput({...input('Lyra',173040985),sheet:sheet+'/?view=share'},guild).sheet,sheet+'/?view=share');
  for(const bad of [sheet+'/extra',sheet.replace('www.dndbeyond.com','dndbeyond.com.evil.test')])assert.throws(()=>characterInput({...input('Lyra',173040985),sheet:bad},guild));
});
test('database retains the share link and prevents a second claim via the plain URL',async()=>{
  const db=new PGlite();const pool={query:db.query.bind(db),connect:async()=>({query:db.query.bind(db),release(){}})};
  const ledger=new TestLedger(pool);const sheet='https://www.dndbeyond.com/characters/173040985/hE5rqg';
  try{
    await ledger.init();
    await ledger.characters.submit(guild,'p',{...input('Lyra',173040985),sheet});
    assert.equal((await ledger.characters.review(guild,'p','Lyra')).sheet_url,sheet);
    await assert.rejects(ledger.characters.submit(guild,'other',input('Same sheet',173040985)),/already submitted/);
  }finally{await db.close();}
});
test('slot calculation requires time AND AP AND active days',()=>{
  const first='2026-01-01T12:00:00Z';
  assert.equal(slotState(null,2,120,40,new Date('2026-03-03')).unlocked,2);
  assert.equal(slotState(first,2,60,20,new Date('2026-01-31T11:59:59Z')).unlocked,2);
  assert.equal(slotState(first,2,60,20,new Date('2026-01-31T12:00:00Z')).unlocked,3);
  assert.equal(slotState(first,4,0,0,new Date('2026-03-03')).unlocked,4);
});
test('players cannot use staff character approval even with forged options',async()=>{
  const interaction={commandName:'ledger-approve',user:{id:'p'},guild:{members:{fetch:async()=>({permissions:{has:()=>false},roles:{cache:new Map()}})}}};
  await assert.rejects(handleCharacterCommand(interaction,{characters:{}},guild),/Only administrators/);
});
test('database enforces pending review, two initial slots, timed unlocks, and retained earned slots',async()=>{
  const db=new PGlite();
  const pool={query:db.query.bind(db),connect:async()=>({query:db.query.bind(db),release(){}})};
  const ledger=new TestLedger(pool);
  let request=0;
  const decide=(name,now,decision='approved',extra={})=>ledger.characters.decide({guildId:guild,playerId:'p',name,moderatorId:'mod',requestId:String(++request),decision,note:'Reviewed creation requirements',now:new Date(now),...extra});
  try{
    await ledger.init();
    assert.equal((await ledger.characters.slots(guild,'p')).unlocked,2);
    await ledger.characters.submit(guild,'p',input('Lyra',123));
    assert.equal((await ledger.characters.list(guild,'p'))[0].status,'pending');
    await assert.rejects(ledger.characters.submit(guild,'other',input('Stolen sheet',123)),/already submitted/);
    await decide('Lyra','2026-01-01T12:00:00Z','approved',{requestId:'first'});
    assert.equal((await decide('Lyra','2026-01-01T12:00:00Z','approved',{requestId:'first'})).duplicate,true);
    await assert.rejects(ledger.characters.submit(guild,'p',input('Lyra',123)),/already approved/);
    await ledger.characters.submit(guild,'p',input('Ryder',124));
    await decide('Ryder','2026-01-02T12:00:00Z');
    assert.equal(new Date((await ledger.characters.slots(guild,'p',new Date('2026-01-03'))).firstApproval).toISOString(),'2026-01-01T12:00:00.000Z');
    await ledger.characters.submit(guild,'p',input('Third',125));
    await assert.rejects(decide('Third','2026-01-31T12:00:00Z'),/No available/);
    for(let i=0;i<20;i++)await db.query('INSERT INTO ledger_test_days (guild_id,player_id,day,ap) VALUES ($1,$2,$3,3)',[guild,'p',new Date(Date.UTC(2026,0,2+i)).toISOString().slice(0,10)]);
    await decide('Third','2026-01-31T12:00:00Z');
    assert.equal((await ledger.characters.slots(guild,'p',new Date('2026-01-31T12:00:00Z'))).approved,3);
    await ledger.characters.submit(guild,'p',input('Fourth',126));
    for(let i=0;i<20;i++)await db.query('INSERT INTO ledger_test_days (guild_id,player_id,day,ap) VALUES ($1,$2,$3,3)',[guild,'p',new Date(Date.UTC(2026,0,22+i)).toISOString().slice(0,10)]);
    await assert.rejects(decide('Fourth','2026-03-02T11:59:59Z'),/No available/);
    await decide('Fourth','2026-03-02T12:00:00Z');
    await db.query('UPDATE ledger_test_days SET ap=0');
    const state=await ledger.characters.slots(guild,'p',new Date('2026-03-03'));
    assert.equal(state.approved,4);assert.equal(state.unlocked,4);assert.equal(state.totalAP,0);
    await ledger.characters.submit(guild,'p',input('Fifth',127));
    await assert.rejects(decide('Fifth','2026-05-01T12:00:00Z'),/No available/);
    await decide('Fifth','2026-05-01T12:00:00Z','rejected');
    await ledger.characters.submit(guild,'p',input('Fifth',127));
    assert.equal((await ledger.characters.review(guild,'p','Fifth')).status,'pending');
    const count=(await db.query('SELECT count(*)::integer AS n FROM ledger_test_character_reviews')).rows[0].n;
    assert.equal(count,5);
  }finally{await db.close();}
});

test('players retire their own approved characters: two weeks for Retired, any time for Deceased, slot freed',async()=>{
  const db=new PGlite();
  const pool={query:db.query.bind(db),connect:async()=>({query:db.query.bind(db),release(){}})};
  const ledger=new TestLedger(pool);
  const day=n=>new Date(Date.UTC(2026,10,1+n,12));
  try{
    await ledger.init();
    await ledger.characters.submit(guild,'p',input('Lyra',501));
    await ledger.characters.submit(guild,'p',input('Bram',502));
    await ledger.characters.submit(guild,'p',input('Cass',503));
    for(const [i,n] of ['Lyra','Bram'].entries())await ledger.characters.decide({guildId:guild,playerId:'p',name:n,moderatorId:'mod',requestId:'r'+i,decision:'approved',note:'Reviewed creation requirements',now:day(0)});
    await assert.rejects(ledger.characters.retire(guild,'p','Lyra',{now:day(13)}),/two weeks.*in 1 day/);
    await assert.rejects(ledger.characters.retire(guild,'p','Cass',{now:day(20)}),/Only approved/);
    await assert.rejects(ledger.characters.retire(guild,'other','Lyra',{now:day(20)}),/No character/);
    const r=await ledger.characters.retire(guild,'p','Bram',{fate:'deceased',reason:'Fell at the Blood Pit',now:day(3)});
    assert.equal(r.fate,'deceased');assert.equal(r.days,3);
    assert.equal((await ledger.characters.slots(guild,'p',day(3))).approved,1);
    await ledger.characters.retire(guild,'p','Lyra',{now:day(14)});
    assert.equal((await ledger.characters.slots(guild,'p',day(14))).approved,0);
    await assert.rejects(ledger.characters.retire(guild,'p','Lyra',{now:day(15)}),/already retired/);
    await assert.rejects(ledger.characters.submit(guild,'p',input('Lyra',501)),/retired/);
    await assert.rejects(ledger.characters.decide({guildId:guild,playerId:'p',name:'Lyra',moderatorId:'mod',requestId:'r9',decision:'rejected',note:'Reviewed creation requirements'}),/already retired/);
    assert.equal((await ledger.characters.list(guild,'p')).find(c=>c.name==='Lyra').status,'retired');
  }finally{await db.close();}
});

test('retire command requires confirmation and posts a staff notice with the directory to-do',async()=>{
  const { retireNotice } = await import('../src/character-commands.js');
  const retire=characterCommands.find(c=>c.name==='ledger-character').options.find(o=>o.name==='retire');
  assert.deepEqual(retire.options.map(o=>o.name),['name','fate','confirm','note']);
  const opts={getSubcommand:()=>'retire',getBoolean:()=>false,getString:()=> 'Lyra'};
  await assert.rejects(handleCharacterCommand({commandName:'ledger-character',user:{id:'p'},options:opts},{characters:{}},guild),/Set confirm to True/);
  const text=JSON.stringify(retireNotice({name:'Lyra',fate:'retired',reason:'Sailed north',sheet:'https://www.dndbeyond.com/characters/501',days:20},'p'));
  for(const s of ['Lyra','Retired','Sailed north','<@p>','directory'])assert.ok(text.includes(s),s);
});
