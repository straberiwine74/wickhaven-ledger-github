import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { TestLedger } from '../src/store.js';
import { QuestStore, validateSnapshot, verifyExport, transition, parseVerificationResponse } from '../src/quest.js';
import { questView, departureFailure } from '../src/quest-discord.js';

test('departure diagnostics explain known errors and hide unexpected private details',()=>{
  const f=departureFailure('Ledger approval and expedition save',new Error('This imported sheet needs Ledger TEST approval first.'));assert.match(f.embeds[0].description,/TEST approval first/);assert.equal(f.embeds[0].title,'⛔ Departure stopped');
  assert.doesNotMatch(JSON.stringify(departureFailure('signature',new Error('postgres://secret-token@example'))),/secret-token/);
  assert.match(JSON.stringify(departureFailure('export format',new Error('parse failure'))),/Export format/);
});

const guild='111111111111111111',player='222222222222222222',channel='333333333333333333',invocation='444444444444444444',avrae='555555555555555555';
const snapshot=()=>({v:1,quest:'drowned-watch',guild,player,channel,invocation,character:'beyond-123',name:'Mara',hp:23,maxHp:25,tempHp:2,skills:Object.fromEntries(['athletics','stealth','investigation','perception'].map(k=>[k,{mod:3,adv:null}])),passive:15,loadout:{source:'declared-manifest',items:[{name:'Rope',qty:1}]},coins:{pp:0,gp:10,ep:0,sp:0,cp:0},signature:'test'});
test('snapshot rejects malformed identity, resources, passives and duplicate inventory',()=>{
  assert.equal(validateSnapshot(snapshot()).hp,23);
  for(const change of [{v:2},{player:'x'},{hp:0},{passive:undefined},{coins:{gp:-1}},{skills:{}},{loadout:{source:'ddb',items:[]}}]) assert.throws(()=>validateSnapshot({...snapshot(),...change}));
  const s=snapshot();s.loadout.items.push({name:'rope',qty:2});assert.throws(()=>validateSnapshot(s),/duplicate/);
});
test('export requires authentic fresh server-alias context, not user JSON or personal alias',async()=>{
  const s=snapshot(),m={author:{id:avrae,bot:true},guildId:guild,channelId:channel,createdTimestamp:Date.now()};
  const config={guild,channel,avrae},proof={scope:'SERVER_ALIAS',user_data:7,author_id:player,channel_id:channel,guild_id:guild,message_id:invocation,timestamp:Date.now()/1000};
  await verifyExport(s,m,config,async()=>proof);
  await verifyExport(s,m,config,async()=>({...proof,guild_id:null}));
  const withoutGuild={...proof};delete withoutGuild.guild_id;
  await verifyExport(s,m,config,async()=>withoutGuild);
  await assert.rejects(verifyExport(s,m,config,async()=>({...proof,guild_id:avrae})),/Verification server/);
  for(const change of [{scope:'PERSONAL_ALIAS'},{author_id:avrae},{message_id:'wrong'},{user_data:0},{timestamp:0}]) await assert.rejects(verifyExport(s,m,config,async()=>({...proof,...change})));
  await assert.rejects(verifyExport(s,{...m,webhookId:'x'},config,async()=>proof));
  await assert.rejects(verifyExport(s,{...m,author:{id:player,bot:false}},config,async()=>proof));
});
test('approaches use exported modifiers and advantage, show passives, and fail forward',()=>{
  const run={snapshot:snapshot(),state:{scene:'review'}};
  run.state=transition(run,'confirm');assert.match(run.state.text,/Passive Perception 15 applied/);assert.match(run.state.text,/chain pulls/);
  const facts=[];
  for(const action of ['climb','sneak','study']) {
    const success=transition(run,action,()=>20),fail=transition(run,action,()=>1);
    assert.equal(success.roll.total,23); assert.equal(fail.scene,'landing'); assert.equal(fail.roll.success,false);facts.push(success.facts.find(f=>['culvert-submerges','moon-marked-door','culvert-low-tide'].includes(f)));
  }
  assert.equal(new Set(facts).size,3);
  run.snapshot.skills.athletics.adv=true;let dice=[2,17];assert.equal(transition(run,'climb',()=>dice.shift()).roll.total,20);
  run.snapshot.skills.athletics.adv=false;dice=[2,17];assert.equal(transition(run,'climb',()=>dice.shift()).roll.total,5);
  run.snapshot.passive=10;const low=transition({...run,state:{scene:'review'}},'confirm');assert.doesNotMatch(low.text,/chain pulls away/);
});
test('database commits choices, resumes after restart, protects ownership and limits repeat rewards',async()=>{
  const db=new PGlite();const pool={query:db.query.bind(db),connect:async()=>({query:db.query.bind(db),release(){}})};
  try {
    await new TestLedger(pool).init();
    const s=snapshot(),store=new QuestStore(pool,()=>17);await store.init();
    await assert.rejects(store.open(s),/approval/);
    await db.query(`INSERT INTO ledger_test_characters(guild_id,player_id,name_key,name,sheet_id,sheet_url,stats_url,sample_url,stat_set,resources,status) VALUES($1,$2,'mara','Mara','123','url','url','',1,'equipment','approved')`,[guild,player]);
    let run=await store.open(s);
    const different=snapshot();different.hp=5;assert.equal((await store.open(different)).snapshot.hp,23);
    await assert.rejects(store.act(run.id,guild,avrae,0,'confirm'),/another player/);
    run=await store.act(run.id,guild,player,0,'confirm');
    run=await store.act(run.id,guild,player,1,'climb');assert.equal(run.state.roll.total,20);
    const stale=await store.act(run.id,guild,player,1,'study');assert.deepEqual(stale.state,run.state);
    run=await store.act(run.id,guild,player,2,'retreat');assert.equal(run.state.scene,'town');
    const restart=new QuestStore(pool,()=>{throw new Error('must not reroll');});
    assert.equal((await restart.open(s)).id,run.id);
    run=await restart.act(run.id,guild,player,3,'resume');assert.equal(run.state.scene,'landing');assert.equal(run.state.roll.total,20);
    run=await restart.act(run.id,guild,player,4,'finish');assert.equal(run.finished,true);
    assert.equal((await restart.act(run.id,guild,player,4,'finish')).revision,5);
    let fresh=await store.open(s);assert.notEqual(fresh.id,run.id);
    assert.ok((await store.knowledge(fresh)).includes('culvert-submerges'));
    fresh=await store.act(fresh.id,guild,player,0,'confirm');fresh=await store.act(fresh.id,guild,player,1,'study');fresh=await store.act(fresh.id,guild,player,2,'finish');
    assert.match(fresh.state.text,/No additional reward/);
    assert.equal((await db.query('SELECT * FROM ledger_quest_test_rewards')).rows.length,1);
    assert.equal((await db.query('SELECT * FROM ledger_quest_test_events WHERE run_id=$1',[run.id])).rows.length,5);
    // Any AP comes only from quest milestone awards (none if the quest is in test).
    const apDays=(await db.query('SELECT COALESCE(sum(ap),0)::integer AS n FROM ledger_test_days')).rows[0].n,awards=(await db.query('SELECT COALESCE(sum(awarded),0)::integer AS n FROM ledger_ap_awards')).rows[0].n;
    assert.equal(apDays,awards);assert.ok(awards<=1);
  } finally {await db.close();}
});
test('review and play controls fit Discord and bind to run revision',()=>{
  const run={id:'test',revision:0,snapshot:snapshot(),state:{scene:'review',text:'Review'}};
  const view=questView(run);assert.ok(!view.content&&view.embeds[0].footer.text.startsWith('The Wickhaven Ledger • TEST'));assert.equal(view.components[0].components[0].data.custom_id,'quest:test:0:confirm');
  run.snapshot.loadout.items=Array.from({length:20},(_,i)=>({name:'Equipment '+i+'x'.repeat(40),qty:1}));
  const e=questView(run).embeds[0];assert.ok(e.description.length<4096&&e.fields.every(f=>f.value.length<=1024));assert.match(e.fields.find(f=>f.name==='🎒 Declared inventory').value,/more in the attached receipt/);
});
test('unconfirmed departures can be discarded; confirmed expeditions cannot',()=>{
  const run={snapshot:snapshot(),state:{scene:'review'}};
  assert.equal(transition(run,'cancel').scene,'cancelled');
  run.state=transition(run,'confirm');assert.throws(()=>transition(run,'cancel'),/no longer/);
});
test('verification preserves numeric snowflake IDs returned by the Avrae API',async()=>{
  const prior=globalThis.fetch;
  globalThis.fetch=async()=>({ok:true,text:async()=>`{"scope":"SERVER_ALIAS","user_data":7,"author_id":${player},"channel_id":${channel},"guild_id":${guild},"message_id":${invocation},"timestamp":${Date.now()/1000}}`});
  try {
    await verifyExport(snapshot(),{author:{id:avrae,bot:true},guildId:guild,channelId:channel,createdTimestamp:Date.now()},{guild,channel,avrae});
  } finally {globalThis.fetch=prior;}
});
test('actual Avrae success envelope is unwrapped without losing snowflake precision',()=>{
  const body='{"success":true,"data":{"message_id":1566626688601956415,"channel_id":1566206434562154666,"author_id":1171291353142018068,"timestamp":1793583309.079,"scope":"SERVER_ALIAS","user_data":7,"workshop_collection_id":"6ae7d8170f892417d817540d"}}';
  const proof=parseVerificationResponse(body);
  assert.equal(proof.scope,'SERVER_ALIAS');assert.equal(proof.message_id,'1566626688601956415');assert.equal(proof.channel_id,'1566206434562154666');assert.equal(proof.author_id,'1171291353142018068');
  assert.throws(()=>parseVerificationResponse('{"success":false,"data":{"scope":"SERVER_ALIAS"}}'),/unavailable/);
  assert.throws(()=>parseVerificationResponse('{"success":true,"data":null}'),/unavailable/);
});
test('default verification accepts a fresh wrapped service response and rejects failed service responses',async()=>{
  const prior=globalThis.fetch;
  const body=()=>`{"success":true,"data":{"scope":"SERVER_ALIAS","user_data":7,"author_id":${player},"channel_id":${channel},"message_id":${invocation},"timestamp":${Date.now()/1000}}}`;
  globalThis.fetch=async()=>({ok:true,text:async()=>body()});
  const m={author:{id:avrae,bot:true},guildId:guild,channelId:channel,createdTimestamp:Date.now()},config={guild,channel,avrae};
  try {
    await verifyExport(snapshot(),m,config);
    globalThis.fetch=async()=>({ok:true,text:async()=>'{"success":false,"data":null}'});
    await assert.rejects(verifyExport(snapshot(),m,config),/unavailable/);
  } finally {globalThis.fetch=prior;}
});
