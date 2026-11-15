import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { TestLedger } from '../src/store.js';
import { QuestStore } from '../src/quest.js';
import { quests } from '../src/quests/index.js';
import { questFacts } from '../src/quest-schema.js';
import { handleJournal, journalLine } from '../src/journal.js';
import { BAG_COLLECTION } from '../src/quest-resources.js';
// Drowned Watch is retired (hidden) but still the engine's test fixture.
quests['drowned-watch']=Object.freeze({...quests['drowned-watch'],status:'test'});

test('every discovery in every launch quest has a readable journal line',()=>{
  for(const id of Object.keys(quests)) {
    const q=quests[id];const missing=[...questFacts(q)].filter(f=>!q.journal?.[f]);
    assert.deepEqual(missing,[],`${id} is missing journal lines`);
    assert.deepEqual(Object.keys(q.journal).filter(f=>!questFacts(q).has(f)),[],`${id} has journal lines for discoveries it never grants`);
  }
  assert.equal(journalLine(quests['drowned-watch'],'not-written-yet'),'Not written yet.');
});

const g='111111111111111111',p='222222222222222222',other='999999999999999999';
const sheet={v:2,quest:'drowned-watch',guild:g,player:p,channel:'333333333333333333',invocation:'444444444444444444',character:'beyond-456',name:'Tannia',hp:12,maxHp:23,tempHp:0,passive:13,
  skills:Object.fromEntries(['athletics','stealth','investigation','perception'].map(k=>[k,{mod:2,adv:null}])),loadout:{source:'bags-rewritten',collection:BAG_COLLECTION,bags:[['Pack',{}]],coinsSource:'avrae-coinpurse'},coins:{pp:0,gp:5,ep:0,sp:0,cp:0},signature:'x'};
const interaction=(user,opts={},staff=false)=>({user:{id:user},options:{getUser:()=>opts.player?{id:opts.player}:null,getString:k=>opts[k]??null},
  guild:{members:{fetch:async()=>({permissions:{has:()=>staff},roles:{cache:{has:()=>false}}})}}});
test('journal shows a character’s own visits and discoveries; only staff can read someone else’s',async()=>{
  const db=new PGlite();const pool={query:db.query.bind(db),connect:async()=>({query:db.query.bind(db),release(){}})};
  try {
    const ledger=new TestLedger(pool);await ledger.init();
    await db.query(`INSERT INTO ledger_test_characters(guild_id,player_id,name_key,name,sheet_id,sheet_url,stats_url,sample_url,stat_set,resources,status) VALUES($1,$2,'tannia','Tannia','456','url','url','',1,'equipment','approved')`,[g,p]);
    const empty=await handleJournal(interaction(p),ledger,g);assert.match(empty.embeds[0].description,/No expeditions yet/);
    const store=new QuestStore(pool,()=>20);await store.init();
    let run=await store.open(sheet);run=await store.act(run.id,g,p,0,'confirm');run=await store.act(run.id,g,p,1,'study');run=await store.act(run.id,g,p,2,'finish');
    const summary=(await handleJournal(interaction(p),ledger,g)).embeds[0];
    assert.equal(summary.title,'📖 Tannia’s Journal');
    const dw=summary.fields.find(f=>f.name==='🗼 Drowned Watch');assert.match(dw.value,/\*\*1\*\* completed/);assert.match(dw.value,/First completion: ✅/);
    assert.match(summary.fields.find(f=>f.name==='🗺️ Not yet explored').value,/Northern Shallows/);
    assert.doesNotMatch(summary.fields.find(f=>f.name==='🗺️ Not yet explored').value,/Ash-Sealed Ledger/);
    await assert.rejects(handleJournal(interaction(p,{quest:'ash-sealed-ledger'}),ledger,g),/isn’t open yet/);
    const detail=(await handleJournal(interaction(p,{quest:'drowned-watch'}),ledger,g)).embeds[0];
    const found=detail.fields.find(f=>f.name==='🔎 Discoveries').value;
    assert.match(found,/lower passage is usable only at low tide/);assert.doesNotMatch(found,/Culvert low tide\./);
    assert.match(detail.fields.find(f=>/Last visit/.test(f.name)).value,/Completed[\s\S]*Investigation \*\*22\*\* ✅/);
    await assert.rejects(handleJournal(interaction(other,{player:p}),ledger,g),/only read your own/);
    const staff=(await handleJournal(interaction(other,{player:p},true),ledger,g)).embeds[0];assert.equal(staff.title,'📖 Tannia’s Journal');
    await assert.rejects(handleJournal(interaction(p,{character:'Nobody'}),ledger,g),/No character named/);
  } finally {await db.close();}
});
