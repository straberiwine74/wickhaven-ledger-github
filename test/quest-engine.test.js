import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { TestLedger } from '../src/store.js';
import { QuestStore, validateSnapshot } from '../src/quest.js';
import { transition, choicesFor } from '../src/quest-engine.js';
import { validateQuest, SKILLS, ABILITIES, checksUsed } from '../src/quest-schema.js';
import { quests, registerQuest } from '../src/quests/index.js';
import { BAG_COLLECTION } from '../src/quest-resources.js';
import { questView } from '../src/quest-discord.js';
// Drowned Watch is retired (hidden) but still the engine's test fixture.
quests['drowned-watch']=Object.freeze({...quests['drowned-watch'],status:'test'});

const g='111111111111111111',p='222222222222222222';
const trial={id:'engine-trial',name:'Engine Trial',emoji:'🧪',status:'test',start:'gate',
  completion:{milestone:'trial-done',first:' First trial recorded.',repeat:' Repeat trial.'},downedText:'Downed in the trial.',
  scenes:{
    gate:{title:'Gate',text:'A gate.',passive:{skill:'insight',dc:12,success:{text:'You sense a lie.',facts:['gate-lie']}},choices:[
      {id:'force',label:'Force it',check:{ability:'str',dc:15},success:{text:'It opens.',goto:'hall',milestone:'gate-opened'},failure:{text:'It bites back.',damage:'1d6+1',goto:'hall'}},
      {id:'dodge',label:'Dodge the dart',check:{save:'dex',dc:12},success:{text:'Missed you.',goto:'hall'},failure:{text:'Ouch.',damage:50}},
      {id:'secret',label:'Use the hidden latch',requires:{facts:['hidden-latch']},outcome:{text:'Click.',goto:'hall'}},
      {id:'leave',label:'Leave',outcome:{text:'You go home.',goto:'@retreat'}}]},
    hall:{title:'Hall',choices:[{id:'search',label:'Search',check:{skill:'sleightOfHand',dc:10},success:{text:'A latch!',facts:['hidden-latch']},failure:{text:'Nothing.'}},{id:'done',label:'Done',outcome:{text:'Finished.',goto:'@complete'}}]}
  }};
registerQuest(trial);
const sheet=(over={})=>({v:3,quest:'engine-trial',guild:g,player:p,channel:'333333333333333333',invocation:'444444444444444444',character:'beyond-789',name:'Full Sheet',hp:10,maxHp:20,tempHp:2,passive:12,passiveSource:'computed',level:3,
  sk:Object.fromEntries(Object.keys(SKILLS).map(k=>[k,1])),sv:Object.fromEntries(Object.keys(ABILITIES).map(k=>[k,2])),ck:Object.fromEntries(Object.keys(ABILITIES).map(k=>[k,0])),ab:Object.fromEntries(Object.keys(ABILITIES).map(k=>[k,12])),adv:{'save.dex':true,insight:true},
  loadout:{source:'bags-rewritten',collection:BAG_COLLECTION,bags:[['Pack',{'Rope':1}]],coinsSource:'avrae-coinpurse'},coins:{pp:0,gp:5,ep:0,sp:0,cp:0},signature:'test',...over});

test('every registered quest passes validation and bad quest data is rejected with a useful message',()=>{
  for(const q of Object.values(quests)) assert.equal(validateQuest(q),q);
  assert.throws(()=>validateQuest({...trial,id:'x2',start:'nowhere'}),/start must name a scene/);
  assert.throws(()=>validateQuest({...trial,id:'x3',scenes:{gate:{...trial.scenes.gate,choices:[{id:'aa',label:'A',check:{skill:'flying',dc:10},success:{text:'x'},failure:{text:'y'}}]}}}),/gate > aa: check needs/);
  assert.throws(()=>validateQuest({...trial,id:'x4',scenes:{...trial.scenes,town:trial.scenes.hall}}),/reserved/);
  assert.deepEqual(checksUsed(trial),['Passive Insight','Strength check','Dexterity save','Sleight of Hand']);
});
test('full-sheet v3 export expands every skill, save and check and rejects incomplete sheets',()=>{
  const s=validateSnapshot(sheet());
  assert.equal(Object.keys(s.skills).length,18);assert.deepEqual(s.saves.dex,{mod:2,adv:true});assert.deepEqual(s.skills.insight,{mod:1,adv:true});assert.equal(s.abilities.wis,12);assert.ok(!('sk' in s));
  const missing=sheet();delete missing.sk.survival;assert.throws(()=>validateSnapshot(missing),/Invalid Survival/);
  assert.throws(()=>validateSnapshot(sheet({quest:'nowhere'})),/Unsupported/);
  assert.throws(()=>validateSnapshot(sheet({level:0})),/level/);
  assert.throws(()=>validateSnapshot({...sheet(),v:2}),/Unsupported|Invalid/);
});
test('engine resolves ability checks, saves with advantage, passives, damage, milestones and knowledge-gated choices',()=>{
  const snapshot=validateSnapshot(sheet()),run={id:'r',revision:0,snapshot,state:{scene:'review',hp:10,tempHp:2,items:snapshot.loadout.items,coins:snapshot.coins}};
  run.state=transition(run,'confirm');assert.match(run.state.text,/Passive Insight 16 applied/);assert.ok(run.state.facts.includes('gate-lie'));
  assert.ok(!choicesFor(run).some(c=>c.id==='secret'));assert.ok(choicesFor(run,['hidden-latch']).some(c=>c.id==='secret'));
  const opened=transition(run,'force',()=>15);assert.equal(opened.roll.label,'Strength check');assert.equal(opened.scene,'hall');assert.deepEqual(opened.milestones,['gate-opened']);
  const hurt=transition(run,'force',sides=>sides===20?2:3);assert.equal(hurt.lastDamage,4);assert.equal(hurt.tempHp,0);assert.equal(hurt.hp,8);assert.equal(hurt.scene,'hall');
  let dice=[3,11];const saved=transition(run,'dodge',()=>dice.shift());assert.equal(saved.roll.total,13);assert.equal(saved.roll.success,true);
  const downed=transition(run,'dodge',()=>1);assert.equal(downed.scene,'downed');assert.equal(downed.hp,0);assert.match(downed.text,/Downed in the trial/);
  const view=questView({...run,state:downed}).embeds[0];assert.match(view.title,/Carried Home/);assert.ok(view.fields.some(f=>f.name==='🧾 Settle your expedition'));
  assert.throws(()=>transition(run,'secret'),/no longer available/);assert.equal(transition(run,'secret',undefined,['hidden-latch']).scene,'hall');
  const review=questView({...run,state:{...run.state,scene:'review'}}).embeds[0];assert.match(review.fields.find(f=>f.name==='🧭 This expedition may test').value,/Dexterity save/);assert.ok(review.fields.some(f=>f.name==='🛡️ Saving throws'));
});
test('stored runs: discoveries from one visit unlock choices on the next, and downed runs end with a pending receipt',async()=>{
  const db=new PGlite();const pool={query:db.query.bind(db),connect:async()=>({query:db.query.bind(db),release(){}})};
  try {
    await new TestLedger(pool).init();
    await db.query(`INSERT INTO ledger_test_characters(guild_id,player_id,name_key,name,sheet_id,sheet_url,stats_url,sample_url,stat_set,resources,status) VALUES($1,$2,'full sheet','Full Sheet','789','url','url','',1,'equipment','approved')`,[g,p]);
    const store=new QuestStore(pool,()=>15);await store.init();
    let run=await store.open(sheet());run=await store.act(run.id,g,p,0,'confirm');
    assert.ok(!questView(run,await store.knowledge(run)).components[0].components.some(b=>b.data.custom_id.endsWith(':secret')));
    run=await store.act(run.id,g,p,1,'force');run=await store.act(run.id,g,p,2,'search');run=await store.act(run.id,g,p,3,'done');
    assert.match(run.state.text,/First trial recorded/);
    assert.deepEqual((await db.query('SELECT reward FROM ledger_quest_test_rewards ORDER BY reward')).rows.map(r=>r.reward),['gate-opened','trial-done']);
    let next=await store.open(sheet());next=await store.act(next.id,g,p,0,'confirm');
    assert.ok(questView(next,await store.knowledge(next)).components[0].components.some(b=>b.data.custom_id.endsWith(':secret')));
    const unlucky=new QuestStore(pool,()=>1);next=await unlucky.act(next.id,g,p,1,'dodge');
    assert.equal(next.state.scene,'downed');assert.equal(next.finished,true);
    assert.equal((await db.query('SELECT status FROM ledger_quest_test_receipts WHERE run_id=$1',[next.id])).rows[0].status,'pending');
    await assert.rejects(store.open(sheet()),/Reconcile/);
  } finally {await db.close();}
});
test('runs saved by the old hardcoded Drowned Watch continue unchanged',()=>{
  const snapshot=validateSnapshot({v:2,quest:'drowned-watch',guild:g,player:p,channel:'333333333333333333',invocation:'444444444444444444',character:'beyond-456',name:'Old',hp:12,maxHp:23,tempHp:0,passive:13,
    skills:Object.fromEntries(['athletics','stealth','investigation','perception'].map(k=>[k,{mod:2,adv:null}])),loadout:{source:'bags-rewritten',collection:BAG_COLLECTION,bags:[['Pack',{}]],coinsSource:'avrae-coinpurse'},coins:{pp:0,gp:5,ep:0,sp:0,cp:0},signature:'x'});
  const old={id:'old',revision:4,snapshot,state:{scene:'landing',hp:12,tempHp:0,items:[],coins:{pp:0,gp:4,ep:0,sp:0,cp:0},tidebox:true,alert:true,facts:['maintenance-route','tide-rota'],roll:{skill:'athletics',dice:[6],modifier:-1,total:5,success:false},text:'athletics: 6 - 1 = 5.\nThe chain tears free.'}};
  assert.ok(!choicesFor(old).some(c=>c.id==='tidebox'));assert.ok(choicesFor(old).some(c=>c.id==='finish'));
  const e=questView(old).embeds[0];assert.doesNotMatch(e.description,/athletics: 6/);assert.match(e.fields[0].value,/^Athletics: d20 \*\*6\*\*/);
  const town=transition(old,'retreat');assert.equal(town.scene,'town');assert.equal(transition({...old,state:town},'resume').scene,'landing');
});
test('the exact JSON produced by the v3 Avrae alias is accepted and shown in full',async()=>{
  const {readFile}=await import('node:fs/promises');
  const raw=JSON.parse(await readFile(new URL('./fixtures/alias-v3-export.json',import.meta.url),'utf8'));
  const s=validateSnapshot(raw);assert.equal(s.passive,16);assert.equal(s.passiveSource,'computed');assert.deepEqual(s.skills.stealth,{mod:1,adv:false});assert.equal(s.loadout.items.length,2);
  const e=questView({id:'r',revision:0,snapshot:s,state:{scene:'review',hp:s.hp,tempHp:0,items:s.loadout.items,coins:s.coins}}).embeds[0];
  assert.match(e.fields.find(f=>f.name==='💰 Coins').value,/from Avrae coin purse/);assert.equal(e.fields.find(f=>f.name==='🎒 Belt').value,'*empty*');
  assert.match(e.fields.find(f=>f.name==='🎲 Skills').value,/Sleight of Hand \*\*\+0\*\*/);
});
test('arriving in a scene shows the outcome, then the scene description; old 4-skill runs hide checks they cannot roll',()=>{
  const snapshot=validateSnapshot(sheet()),run={id:'r',revision:0,snapshot,state:{scene:'review',hp:10,tempHp:2,items:snapshot.loadout.items,coins:snapshot.coins}};
  run.state=transition(run,'confirm');
  const hall=transition(run,'force',()=>20);assert.equal(hall.text,'It opens.');
  const v1={...run,snapshot:{...snapshot,v:1,skills:{athletics:{mod:1,adv:null},stealth:{mod:1,adv:null},investigation:{mod:1,adv:null},perception:{mod:1,adv:null}},saves:undefined,checks:undefined}};
  assert.deepEqual(choicesFor(v1).map(c=>c.id),['leave']);
  const withText={...trial,id:'text-trial',scenes:{...trial.scenes,hall:{...trial.scenes.hall,text:'Dust everywhere.'}}};
  registerQuest(withText);
  const r2={...run,snapshot:{...snapshot,quest:'text-trial'}};assert.equal(transition(r2,'force',()=>20).text,'It opens.\n\nDust everywhere.');
});
test('a quest can stay locked until a discovery is made, by the same character or anyone on the server',async()=>{
  const base={...trial,completion:{...trial.completion}};
  registerQuest({...base,id:'locked-server',requires:{facts:['secret-path'],scope:'server',hint:'Find the secret path first.'}});
  registerQuest({...base,id:'locked-mine',requires:{facts:['secret-path']}});
  assert.throws(()=>validateQuest({...base,id:'bad-lock',requires:{facts:['x y']}}),/requires needs/);
  const db=new PGlite();const pool={query:db.query.bind(db),connect:async()=>({query:db.query.bind(db),release(){}})};
  try {
    await new TestLedger(pool).init();
    for(const [n,sheetId] of [['full sheet','789'],['other','790']]) await db.query(`INSERT INTO ledger_test_characters(guild_id,player_id,name_key,name,sheet_id,sheet_url,stats_url,sample_url,stat_set,resources,status) VALUES($1,$2,$3,$3,$4,'url','url','',1,'equipment','approved')`,[g,p,n,sheetId]);
    const store=new QuestStore(pool,()=>15);await store.init();
    await assert.rejects(store.open(sheet({quest:'locked-server'})),e=>e.hint==='Find the secret path first.');
    await db.query(`INSERT INTO ledger_quest_test_knowledge VALUES($1,'beyond-790','secret-path')`,[g]);
    const opened=await store.open(sheet({quest:'locked-server'}));
    await assert.rejects(store.open(sheet({quest:'locked-mine'})),e=>/unfinished Engine Trial expedition/.test(e.hint)&&/!depart locked-server/.test(e.hint));
    await store.act(opened.id,g,p,0,'cancel');
    await assert.rejects(store.open(sheet({quest:'locked-mine'})),/isn’t open yet/);
  } finally {await db.close();}
});
test('every registered quest can be finished from every reachable point, with no dead ends or broken checks',async()=>{
  const {readFile}=await import('node:fs/promises');
  const raw=JSON.parse(await readFile(new URL('./fixtures/alias-v3-export.json',import.meta.url),'utf8'));
  for(const q of Object.values(quests).filter(q=>!['engine-trial','text-trial','locked-server','locked-mine','live-trial','test-trial'].includes(q.id))) {
    const reached=new Set();
    for(const passive of [8,25]) {
      // Every check is explored both ways: natural 20 (+10) succeeds, natural 1 (-10) fails.
      const s=validateSnapshot({...raw,quest:q.id});for(const k of Object.keys(s.skills)) s.skills[k].mod=passive>10?10:-10;s.passive=passive;
      const seen=new Set(),stack=[{scene:'review',hp:12,tempHp:0,items:s.loadout.items,coins:s.coins}];
      while(stack.length) {
        const st=stack.pop(),key=JSON.stringify([st.scene,st.used,(st.facts??[]).slice().sort(),st.flags,st.returnTo]);
        if(seen.has(key)) continue;seen.add(key);reached.add(st.scene);
        if(['complete','cancelled','downed'].includes(st.scene)) continue;
        const choices=choicesFor({snapshot:s,state:st},[]);assert.ok(choices.length,`${q.id}: dead end at ${st.scene}`);
        for(const c of choices) for(const die of c.check?[()=>20,()=>1]:[()=>1]) stack.push(transition({snapshot:s,state:st},c.id,die));
        assert.ok(seen.size<400000,`${q.id}: too many states`);
      }
    }
    for(const sc of Object.keys(q.scenes)) assert.ok(reached.has(sc),`${q.id}: scene ${sc} can never be reached`);
    assert.ok(reached.has('complete'),`${q.id}: cannot be completed`);
  }
});
