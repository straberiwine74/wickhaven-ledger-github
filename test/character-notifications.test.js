import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { TestLedger } from '../src/store.js';
import { CharacterNotifications } from '../src/character-notifications.js';
const g='1566203164464513104';
const link=`https://discord.com/channels/${g}/1566206538563981483/1566255808382238942`;
async function fixture(){
  const db=new PGlite();const pool={query:db.query.bind(db),connect:async()=>({query:db.query.bind(db),release(){}})};
  const ledger=new TestLedger(pool);await ledger.init();
  await ledger.characters.submit(g,'player',{name:'Tannia',sheet:'https://www.dndbeyond.com/characters/173040985/hE5rqg',stats:link,set:3,resources:'equipment'});
  await ledger.characters.decide({guildId:g,playerId:'player',name:'Tannia',moderatorId:'mod',requestId:'rejection',decision:'rejected',note:'Please correct the selected stat set.'});
  return{db,pool,ledger};
}
test('change request sends one DM with the reason and review link',async()=>{
  const{db,pool}=await fixture();let calls=0,payload;
  const client={users:{fetch:async id=>{assert.equal(id,'player');return{send:async message=>{calls++;payload=message;}};}}};
  const notifier=new CharacterNotifications(pool,client,g);
  try{
    await db.query('INSERT INTO ledger_test_review_posts (guild_id,player_id,name_key,thread_id,message_id) VALUES ($1,$2,$3,$4,$5)',[g,'player','tannia','thread','message']);
    assert.equal(await notifier.deliver('rejection'),'sent');
    const e=payload.embeds[0];assert.match(e.title,/Tannia/);assert.match(JSON.stringify(e),/correct the selected stat set/);assert.match(JSON.stringify(e),/channels\/1566203164464513104\/thread/);assert.match(e.footer.text,/^The Wickhaven Ledger/);
    assert.deepEqual(payload.allowedMentions,{parse:[]});assert.equal(payload.enforceNonce,true);
    assert.equal(await notifier.deliver('rejection'),'not-pending');assert.equal(calls,1);
    assert.equal((await notifier.latest('player','Tannia')).status,'sent');
    await new TestLedger(pool).init();assert.equal(await notifier.deliver('rejection'),'not-pending');
  }finally{await db.close();}
});
test('blocked DMs preserve the rejection and are not repeatedly retried',async()=>{
  const{db,pool,ledger}=await fixture();let calls=0;
  const notifier=new CharacterNotifications(pool,{users:{fetch:async()=>({send:async()=>{calls++;throw Object.assign(new Error('Cannot send messages to user'),{code:50007});}})}},g);
  try{
    assert.equal(await notifier.deliver('rejection'),'blocked');await notifier.retryPending();assert.equal(calls,1);
    assert.equal((await ledger.characters.review(g,'player','Tannia')).status,'rejected');
    assert.equal((await notifier.latest('player','Tannia')).last_error,'50007');
  }finally{await db.close();}
});
test('resubmission prevents outdated change-request DM delivery',async()=>{
  const{db,pool,ledger}=await fixture();let calls=0;
  const notifier=new CharacterNotifications(pool,{users:{fetch:async()=>({send:async()=>{calls++;}})}},g);
  try{
    await ledger.characters.submit(g,'player',{name:'Tannia',sheet:'https://www.dndbeyond.com/characters/173040985/hE5rqg',stats:link,set:2,resources:'equipment'});
    assert.equal(await notifier.deliver('rejection'),'obsolete');assert.equal(calls,0);
  }finally{await db.close();}
});
test('transient DM failures remain queued with a retry delay',async()=>{
  const{db,pool}=await fixture();
  const notifier=new CharacterNotifications(pool,{users:{fetch:async()=>{throw Object.assign(new Error('Temporary failure'),{code:503});}}},g);
  try{
    assert.equal(await notifier.deliver('rejection'),'pending');assert.equal(await notifier.deliver('rejection'),'not-pending');
    assert.equal((await notifier.latest('player','Tannia')).status,'pending');
  }finally{await db.close();}
});
