import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { TestLedger } from '../src/store.js';
import { QuestStore } from '../src/quest.js';
import { registerQuest } from '../src/quests/index.js';
import { BAG_COLLECTION } from '../src/quest-resources.js';
import { SKILLS, ABILITIES, apMilestones, validateQuest } from '../src/quest-schema.js';
import { liveConfig, earnsWritingAP, gatheringCommand, avraeError, DEFAULT_EXCLUDED } from '../src/live.js';
import { card } from '../src/ui.js';

const G='1566203164464513104';
const msg=(channelId,parentId,grand)=>({guildId:G,channelId,channel:{parentId,parent:grand?{parentId:grand}:null}});
test('live AP counts every in-character channel and forum thread, never OOC, setup or staff spaces',()=>{
  const cfg=liveConfig({LEDGER_LIVE:'true'});assert.equal(cfg.live,true);
  assert.equal(earnsWritingAP(msg('1566205495742570686','1566205219333869679'),cfg,G),true); // lantern-and-line
  assert.equal(earnsWritingAP(msg('9999999999999999999','1566205535521480784','1566205219333869679'),cfg,G),true); // around-wickhaven thread
  assert.equal(earnsWritingAP(msg('8888888888888888888','1566217673057108048','1566217443041353890'),cfg,G),true); // behind-closed-doors thread
  assert.equal(earnsWritingAP(msg('1566205089633534093','1566205061304942714'),cfg,G),false); // general
  assert.equal(earnsWritingAP(msg('1566206538563981483','1566204441198203080'),cfg,G),false); // bot-testing (START HERE)
  assert.equal(earnsWritingAP(msg('7777777777777777777','1566463751274758184','1566205061304942714'),cfg,G),false); // help forum thread
  assert.equal(earnsWritingAP(msg('1566206402245042188','1566206327448010752'),cfg,G),false); // staff
  assert.equal(earnsWritingAP({...msg('1566205495742570686'),guildId:'other'},cfg,G),false);
  assert.deepEqual([...liveConfig({AP_EXCLUDED_IDS:'1566205495742570686'}).excluded],['1566205495742570686']);
  assert.equal(liveConfig({}).excluded.size,DEFAULT_EXCLUDED.length);
});
test('gathering commands and Avrae errors are recognised',()=>{
  assert.ok(gatheringCommand('!mine','mining'));assert.ok(gatheringCommand(' !MINE  ','mining'));assert.ok(!gatheringCommand('!mines','mining'));
  assert.ok(gatheringCommand('!hunt  end','hunting'));assert.ok(!gatheringCommand('!hunt Forest Easy','hunting'));assert.ok(!gatheringCommand('!mine','hunting'));
  assert.ok(avraeError({content:'Error evaluating expression: nope'}));assert.ok(!avraeError({content:'',embeds:[{}]}));
});
test('live footers drop the TEST label',()=>{
  const prior=process.env.LEDGER_LIVE;
  try {process.env.LEDGER_LIVE='true';assert.equal(card({title:'x'}).footer.text,'The Wickhaven Ledger');process.env.LEDGER_LIVE='false';assert.equal(card({title:'x'}).footer.text,'The Wickhaven Ledger • TEST');}
  finally {if(prior===undefined) delete process.env.LEDGER_LIVE; else process.env.LEDGER_LIVE=prior;}
});
async function db() {
  const d=new PGlite();const pool={query:d.query.bind(d),connect:async()=>({query:d.query.bind(d),release(){}})};
  const ledger=new TestLedger(pool,{requireApproval:true});await ledger.init();
  const approve=(player,name='Hero',sheet='1')=>d.query(`INSERT INTO ledger_test_characters(guild_id,player_id,name_key,name,sheet_id,sheet_url,stats_url,sample_url,stat_set,resources,status) VALUES('g',$1,$2,$3,$4,'url','url','',1,'equipment','approved')`,[player,name.toLowerCase(),name,sheet]);
  return {d,pool,ledger,approve};
}
test('live writing AP and bracket registration need an approved character; existing TEST AP is kept',async()=>{
  const {d,pool,ledger,approve}=await db();
  try {
    await new TestLedger(pool).record({guildId:'g',playerId:'p',originalId:'old1',proxyId:'oldx',words:1200,time:'2026-11-01T18:00:00Z'});
    await assert.rejects(ledger.register('g','p','Hero','H:'),/after your first character is approved/);
    const r=await ledger.record({guildId:'g',playerId:'p',originalId:'o1',proxyId:'x1',words:600,time:'2026-11-02T18:00:00Z'});
    assert.equal(r.ineligible,true);assert.equal(r.awarded,0);
    await approve('p');await ledger.register('g','p','Hero','H:');
    assert.equal((await ledger.record({guildId:'g',playerId:'p',originalId:'o2',proxyId:'x2',words:600,time:'2026-11-02T18:00:00Z'})).awarded,2);
    assert.equal((await ledger.status('g','p',Date.parse('2026-11-02T19:00:00Z'))).total,6);
  } finally {await d.close();}
});
test('gathering and quest AP are once-only and share the 4 AP daily cap with writing',async()=>{
  const {d,ledger,approve}=await db();
  try {
    await approve('p');const t=Date.parse('2026-11-02T18:00:00Z');
    const a=await ledger.awardGameplay({guildId:'g',playerId:'p',source:'gathering',ref:'gathering:p:2026-11-02',time:t});assert.equal(a.awarded,1);
    assert.equal((await ledger.awardGameplay({guildId:'g',playerId:'p',source:'gathering',ref:'gathering:p:2026-11-02',time:t})).duplicate,true);
    await ledger.record({guildId:'g',playerId:'p',originalId:'o',proxyId:'x',words:900,time:'2026-11-02T18:00:00Z'});
    const capped=await ledger.awardGameplay({guildId:'g',playerId:'p',source:'quest',ref:'quest:c:m',time:t});assert.equal(capped.awarded,0);assert.equal(capped.capped,true);
    assert.equal((await ledger.awardGameplay({guildId:'g',playerId:'p',source:'quest',ref:'quest:c:m',time:t+86400000})).duplicate,true);
    assert.equal((await ledger.status('g','p',t)).today,4);
  } finally {await d.close();}
});
test('live quests award 1 AP per first-time milestone; test quests award none',async()=>{
  const scenes={yard:{title:'Yard',text:'A yard.',choices:[
    {id:'dig',label:'Dig',outcome:{text:'You find a key.',milestone:'found-key',ap:1}},
    {id:'leave',label:'Leave',outcome:{text:'Done.',goto:'@complete'}}]}};
  const liveQ=registerQuest({id:'live-trial',name:'Live Trial',status:'live',start:'yard',completion:{milestone:'live-done',ap:1,first:' First.',repeat:' Again.'},scenes});
  registerQuest({id:'test-trial',name:'Test Trial',status:'test',start:'yard',completion:{milestone:'test-done',ap:1,first:' First.',repeat:' Again.'},scenes});
  assert.deepEqual([...apMilestones(liveQ)].sort(),['found-key','live-done']);
  assert.throws(()=>validateQuest({...liveQ,id:'bad-ap',completion:{...liveQ.completion,ap:2}}),/completion.ap/);
  const {d,pool,approve}=await db();
  try {
    await approve('222222222222222222','Full Sheet','789');
    const store=new QuestStore(pool);await store.init();
    const sheet=quest=>({v:3,quest,guild:'111111111111111111',player:'222222222222222222',channel:'333333333333333333',invocation:'444444444444444444',character:'beyond-789',name:'Full Sheet',hp:10,maxHp:20,tempHp:0,passive:12,passiveSource:'computed',level:3,
      sk:Object.fromEntries(Object.keys(SKILLS).map(k=>[k,1])),sv:Object.fromEntries(Object.keys(ABILITIES).map(k=>[k,2])),ck:Object.fromEntries(Object.keys(ABILITIES).map(k=>[k,0])),ab:Object.fromEntries(Object.keys(ABILITIES).map(k=>[k,12])),adv:{},
      loadout:{source:'bags-rewritten',collection:BAG_COLLECTION,bags:[['Pack',{}]],coinsSource:'none'},coins:{pp:0,gp:0,ep:0,sp:0,cp:0},signature:'x'});
    const gid='111111111111111111';await d.query("UPDATE ledger_test_characters SET guild_id=$1",[gid]);
    const play=async quest=>{let r=await store.open(sheet(quest));r=await store.act(r.id,gid,'222222222222222222',0,'confirm');r=await store.act(r.id,gid,'222222222222222222',1,'dig');return store.act(r.id,gid,'222222222222222222',2,'leave');};
    const first=await play('live-trial');assert.match(first.state.text,/\+2 AP/);assert.equal(first.state.apAwarded,2);
    const again=await play('live-trial');assert.equal(again.state.apAwarded,0);assert.match(again.state.text,/Again/);
    const testRun=await play('test-trial');assert.equal(testRun.state.apAwarded,0);assert.doesNotMatch(testRun.state.text,/AP\*\*/);
    assert.deepEqual((await d.query("SELECT ref,awarded FROM ledger_ap_awards ORDER BY ref")).rows,[{ref:'quest:beyond-789:found-key',awarded:1},{ref:'quest:beyond-789:live-done',awarded:1}]);
  } finally {await d.close();}
});
