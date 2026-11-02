import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { TestLedger } from '../src/store.js';
import { QuestStore, validateSnapshot, transition, tideBoxOffered } from '../src/quest.js';
import { BAG_COLLECTION, importBags, resources, resourceReceipt, spendResources, matchesEnding } from '../src/quest-resources.js';
import { suppliesView, installQuests, questView, lowHp } from '../src/quest-discord.js';
import { runClickDiagnostic } from '../src/quest-race.js';

const g='111111111111111111',p='222222222222222222';
const input=()=>({v:2,quest:'drowned-watch',guild:g,player:p,channel:'333333333333333333',invocation:'444444444444444444',character:'beyond-456',name:'Bag test',hp:20,maxHp:20,tempHp:3,passive:13,skills:Object.fromEntries(['athletics','stealth','investigation','perception'].map(k=>[k,{mod:2,adv:null}])),loadout:{source:'bags-rewritten',collection:BAG_COLLECTION,bags:[['Backpack',{'Rations':3,"Jeweler's Tools":1}],['Satchel',{'Rations':2}]],coinsSource:'avrae-coinpurse'},coins:{pp:0,gp:4,ep:0,sp:0,cp:0},signature:'test'});
function localPool(db) {
  // PGlite has one connection. Serialize transactions; this does not test
  // PostgreSQL's multi-session row locks. The hosted staff diagnostic does.
  let tail=Promise.resolve();
  return {query:db.query.bind(db),async connect() {
    let release;const wait=tail;tail=new Promise(r=>{release=r;});await wait;
    return {query:db.query.bind(db),release};
  }};
}
async function fixture(fn) {
  const db=new PGlite(),pool=localPool(db);
  try {
    await new TestLedger(pool).init();const store=new QuestStore(pool,()=>12);await store.init();
    await db.query(`INSERT INTO ledger_test_characters(guild_id,player_id,name_key,name,sheet_id,sheet_url,stats_url,sample_url,stat_set,resources,status) VALUES($1,$2,'bag test','Bag test','456','url','url','',1,'equipment','approved')`,[g,p]);
    await fn({db,pool,store});
  } finally {await db.close();}
}
test('Bags Rewritten import preserves bag identity and rejects malformed or ambiguous data',()=>{
  const s=validateSnapshot(input());assert.equal(s.loadout.items.length,3);assert.equal(s.loadout.items[2].bag,'Satchel');
  const x=input();x.loadout.bags.push(['backpack',{}]);assert.throws(()=>validateSnapshot(x),/carried bags/);
  x.loadout.bags=[['Backpack',{'Rations':-1}]];assert.throws(()=>validateSnapshot(x),/bag item/);
  x.loadout.bags=[['Backpack',{'Rations':1.5}]];assert.throws(()=>validateSnapshot(x),/bag item/);
  x.loadout.collection='other';assert.throws(()=>importBags(x.loadout),/carried bags/);
});
test('scene resource costs are atomic, bag-specific and cannot import missing equipment',()=>{
  const s=validateSnapshot(input()),state={hp:s.hp,tempHp:s.tempHp,items:s.loadout.items,coins:s.coins},before=structuredClone(state);
  const next=spendResources(state,{hp:5,coins:{gp:1},items:[{bag:'Backpack',name:'Rations',qty:1}]});
  assert.deepEqual(state,before);assert.equal(next.hp,18);assert.equal(next.tempHp,0);assert.equal(next.items[0].qty,2);assert.equal(next.items[2].qty,2);assert.equal(next.coins.gp,3);
  assert.throws(()=>spendResources(state,{coins:{gp:1},items:[{bag:'Backpack',name:'New Tool',qty:1}]}),/Insufficient/);assert.deepEqual(state,before);
  assert.throws(()=>spendResources(state,{coins:{gp:-1}}),/Insufficient/);
});
test('receipts contain exact starting/current values and match equivalent coin change',()=>{
  const snapshot=validateSnapshot(input()),state={hp:20,tempHp:3,items:snapshot.loadout.items,coins:snapshot.coins};
  const run={id:'r',revision:4,character_id:snapshot.character,finished:true,snapshot,state:spendResources(state,{hp:4,coins:{gp:1},items:[{bag:'Backpack',name:'Rations',qty:1}]})};
  const receipt=resourceReceipt(run);assert.equal(receipt.changes.hp,-1);assert.equal(receipt.changes.tempHp,-3);assert.equal(receipt.changes.items[0].delta,-1);assert.equal(receipt.changes.coins.gp,-1);
  const actual=validateSnapshot(input());actual.hp=19;actual.tempHp=0;actual.coins={pp:0,gp:2,ep:0,sp:10,cp:0};actual.loadout.items[0].qty=2;
  assert.equal(matchesEnding(run,actual),true);actual.loadout.items[2].qty=1;assert.equal(matchesEnding(run,actual),false);
  const view=suppliesView(run);assert.match(view.embeds[0].description,/19/);assert.ok(view.files[0].attachment.length>0);
});
test('pending receipts block refreshed departures, survive store restart and require exact owner ending export',async()=>fixture(async({db,pool,store})=>{
  let run=await store.open(input());run=await store.act(run.id,g,p,0,'confirm');run=await store.act(run.id,g,p,1,'study');
  // Model a future scene-owned cost without adding any cost to the live Watch.
  run.state=spendResources(run.state,{hp:4,items:[{bag:'Backpack',name:'Rations',qty:1}],coins:{gp:1}});
  await db.query('UPDATE ledger_quest_test_runs SET state=$2 WHERE id=$1',[run.id,JSON.stringify(run.state)]);
  run=await store.act(run.id,g,p,2,'finish');
  assert.equal((await db.query('SELECT status FROM ledger_quest_test_receipts WHERE run_id=$1',[run.id])).rows[0].status,'pending');
  const restarted=new QuestStore(pool);await assert.rejects(restarted.open(input()),/Reconcile/);
  const bad=input();bad.reconcile=run.id;await assert.rejects(restarted.reconcile(bad),/do not match/);
  const correct=input();correct.reconcile=run.id;correct.hp=19;correct.tempHp=0;correct.coins.gp=3;correct.loadout.bags[0][1].Rations=2;
  const foreign={...correct,player:'555555555555555555'};await assert.rejects(restarted.reconcile(foreign),/No matching/);
  await restarted.reconcile(correct);await restarted.reconcile(correct);
  assert.equal((await db.query('SELECT status FROM ledger_quest_test_receipts WHERE run_id=$1',[run.id])).rows[0].status,'verified');
  const fresh=await restarted.open(correct);assert.notEqual(fresh.id,run.id);assert.equal(fresh.snapshot.hp,19);
}));
test('supplies inspection changes no revision, and concurrent submissions on local serialized adapter save one result',async()=>fixture(async({db,pool,store})=>{
  const opened=await Promise.all(Array.from({length:3},()=>store.open(input())));assert.equal(new Set(opened.map(r=>r.id)).size,1);
  let run=await store.act(opened[0].id,g,p,0,'confirm');let rolls=0;
  const racers=new QuestStore(pool,()=>{rolls++;return 11;});
  const results=await Promise.all(['climb','sneak','study'].map(a=>racers.act(run.id,g,p,1,a)));assert.equal(rolls,1);assert.ok(results.every(r=>r.revision===2));
  run=await store.inspect(run.id,g,p);const before=resources(run);suppliesView(run);assert.equal((await store.inspect(run.id,g,p)).revision,2);assert.deepEqual(resources(run),before);
  await assert.rejects(store.inspect(run.id,g,'other'),/another player/);
  const ended=await Promise.all(Array.from({length:3},()=>store.act(run.id,g,p,2,'finish')));assert.ok(ended.every(r=>r.revision===3));
  assert.equal((await db.query('SELECT count(*)::integer AS n FROM ledger_quest_test_receipts')).rows[0].n,1);
  assert.equal((await db.query('SELECT status FROM ledger_quest_test_receipts')).rows[0].status,'no-change');
}));
test('players cannot run the hosted synthetic diagnostic',async()=>{
  const handlers=new Map();let queries=0,reply;
  const pool={query:async()=>{queries++;return {rows:[]};}},client={on:(event,handler)=>handlers.set(event,handler)};
  await installQuests(client,pool,{guild:g,channel:'channel',avrae:'avrae'});const initialized=queries;
  const i={isButton:()=>true,customId:'quest:unused:0:race',guildId:g,channelId:'channel',memberPermissions:{has:()=>false},member:{roles:[]},deferReply:async()=>{},editReply:async text=>{reply=text;}};
  await handlers.get('interactionCreate')(i);assert.match(reply,/Only staff/);assert.equal(queries,initialized);
});
test('failed synthetic diagnostics clean up only their own UUID-scoped records',async()=>{
  const calls=[];
  const query=async(sql,args)=>{calls.push({sql,args});return {rows:[]};};
  const pool={query,connect:async()=>({query,release(){}})};
  await assert.rejects(runClickDiagnostic(pool),/another player/);
  const deletes=calls.filter(c=>c.sql.startsWith('DELETE'));
  assert.equal(deletes.length,5);
  const id=calls[0].args[0],scope='diagnostic:'+id;
  assert.ok(deletes.every(c=>c.args[0]===id||c.args[0]===scope));
  await assert.rejects(runClickDiagnostic(pool),/another player/); // running guard released
});
test('tide-box offering is explicit, bag-runs only, spends exactly 1 gp once and leaves free paths unchanged',()=>{
  const snapshot=validateSnapshot(input());
  const run={id:'r',revision:2,snapshot,state:{scene:'landing',hp:20,tempHp:3,items:snapshot.loadout.items,coins:snapshot.coins}};
  assert.equal(tideBoxOffered(run),true);
  assert.ok(questView(run).components[0].components.some(b=>b.data.custom_id.endsWith(':tidebox')));
  const paid=transition(run,'tidebox');assert.equal(paid.coins.gp,3);assert.equal(paid.scene,'landing');assert.ok(paid.facts.includes('tide-rota'));assert.equal(run.state.coins.gp,4);
  const after={...run,state:paid};assert.equal(tideBoxOffered(after),false);assert.throws(()=>transition(after,'tidebox'),/not available/);
  assert.ok(!questView(after).components[0].components.some(b=>b.data.custom_id.endsWith(':tidebox')));
  const broke={...run,state:{...run.state,coins:{...run.state.coins,gp:0,sp:50}}};assert.equal(tideBoxOffered(broke),false);assert.throws(()=>transition(broke,'tidebox'),/not available/);
  const v1={...run,snapshot:{...snapshot,v:1}};assert.equal(tideBoxOffered(v1),false);assert.throws(()=>transition(v1,'tidebox'),/not available/);
  assert.throws(()=>transition({...run,state:{...run.state,scene:'shore'}},'tidebox'),/no longer available/);
  const free=transition(run,'finish');assert.equal(free.coins.gp,4);
});
test('tide-box cost: simultaneous clicks spend once, receipt is pending, wrong export rejected, corrected export clears the gate',async()=>fixture(async({db,store})=>{
  let run=await store.open(input());run=await store.act(run.id,g,p,0,'confirm');run=await store.act(run.id,g,p,1,'study');
  const clicks=await Promise.all(Array.from({length:3},()=>store.act(run.id,g,p,2,'tidebox')));
  assert.ok(clicks.every(r=>r.revision===3&&r.state.coins.gp===3));
  assert.equal((await db.query(`SELECT count(*)::integer AS n FROM ledger_quest_test_events WHERE run_id=$1 AND action='tidebox'`,[run.id])).rows[0].n,1);
  const stale=await store.act(run.id,g,p,2,'tidebox');assert.equal(stale.state.coins.gp,3);
  await assert.rejects(store.act(run.id,g,p,3,'tidebox'),/not available/);
  run=await store.act(run.id,g,p,3,'finish');assert.equal(run.state.scene,'complete');
  const receipt=(await db.query('SELECT status,receipt FROM ledger_quest_test_receipts WHERE run_id=$1',[run.id])).rows[0];
  assert.equal(receipt.status,'pending');assert.equal(receipt.receipt.changes.coins.gp,-1);assert.equal(receipt.receipt.starting.coins.gp,4);assert.equal(receipt.receipt.current.coins.gp,3);
  const view=questView(run);assert.match(view.embeds[1].description,/-1 gp/);assert.match(view.embeds[1].description,new RegExp(`!depart reconcile ${run.id}`));
  await assert.rejects(store.open(input()),/Reconcile/);
  const unchanged=input();unchanged.reconcile=run.id;await assert.rejects(store.reconcile(unchanged),/do not match/);
  const overpaid=input();overpaid.reconcile=run.id;overpaid.coins.gp=2;await assert.rejects(store.reconcile(overpaid),/do not match/);
  await assert.rejects(store.open(input()),/Reconcile/);
  const changed=input();changed.reconcile=run.id;changed.coins={pp:0,gp:2,ep:0,sp:10,cp:0};await store.reconcile(changed);
  assert.equal((await db.query('SELECT status FROM ledger_quest_test_receipts WHERE run_id=$1',[run.id])).rows[0].status,'verified');
  const next=input();next.coins.gp=3;const fresh=await store.open(next);assert.notEqual(fresh.id,run.id);assert.equal(fresh.snapshot.coins.gp,3);
}));
test('departure review warns at or below half HP and new departures are blocked at 0 HP',async()=>fixture(async({store})=>{
  const at=(hp,maxHp=20)=>({...input(),hp,maxHp});
  assert.equal(lowHp(at(11)),false);assert.equal(lowHp(at(10)),true);assert.equal(lowHp(at(1,23)),true);assert.equal(lowHp(at(0)),false);
  const low=await store.open(at(1,23));assert.match(questView(low).embeds[0].description,/Low HP warning:\*\* 1\/23 HP \(\+3 temporary\)/);
  await store.act(low.id,g,p,0,'cancel');
  const healthy=await store.open(at(20));assert.doesNotMatch(questView(healthy).embeds[0].description,/Low HP/);
  await store.act(healthy.id,g,p,0,'cancel');
  await assert.rejects(store.open(at(0)),/Recover HP before starting a new expedition/);
}));
