import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { TestLedger } from '../src/store.js';
import { commands, handleCommand } from '../src/commands.js';

const g='1544310744571711558';
const at=h=>Date.parse(`2026-11-13T${String(h).padStart(2,'0')}:00:00Z`);
async function setup(){
  const db=new PGlite();const pool={query:db.query.bind(db),connect:async()=>({query:db.query.bind(db),release(){}})};
  const ledger=new TestLedger(pool);await ledger.init();return {db,ledger};
}
test('/ledger-adjust offers change OR words, both optional',()=>{
  const opts=commands.find(c=>c.name==='ledger-adjust').options;
  assert.deepEqual(opts.map(o=>[o.name,!!o.required]),[['player',true],['reason',true],['change',false],['words',false],['day',false]]);
});
test('word credit fills the tally like writing, awards AP, respects the cap and is audited',async()=>{
  const {db,ledger}=await setup();
  const base={guildId:g,playerId:'p',moderatorId:'mod',reason:'Held post was legit'};
  try{
    let r=await ledger.adjustWords({...base,requestId:'a',words:10,time:at(18)});
    assert.deepEqual([r.awarded,r.remainder,r.after_ap],[0,10,0]);
    r=await ledger.adjustWords({...base,requestId:'b',words:600,time:at(18)});
    assert.deepEqual([r.awarded,r.remainder,r.after_ap],[2,10,2]);
    assert.equal((await ledger.adjustWords({...base,requestId:'b',words:600,time:at(18)})).duplicate,true);
    r=await ledger.adjustWords({...base,requestId:'c',words:3000,time:at(18)});
    assert.deepEqual([r.awarded,r.after_ap,r.remainder],[2,4,0]);
    r=await ledger.adjustWords({...base,requestId:'d',words:50,time:at(18)});
    assert.deepEqual([r.awarded,r.capped],[0,true]);
    await assert.rejects(ledger.adjustWords({...base,requestId:'e',words:0,time:at(18)}),/1 to 3,000/);
    const audit=await ledger.audit(g,'p');
    assert.equal(audit.find(x=>x.words===600).delta,2);
  }finally{await db.close();}
});
test('command refuses both or neither of change and words',async()=>{
  const member={permissions:{has:()=>true},roles:{cache:new Map()}};
  const make=(change,words)=>({commandName:'ledger-adjust',user:{id:'mod'},guild:{members:{fetch:async()=>member}},options:{getUser:()=>({id:'p',bot:false}),getInteger:n=>n==='change'?change:n==='words'?words:null,getString:n=>n==='reason'?'Held post was legit':null}});
  await assert.rejects(handleCommand(make(null,null),{},g),/either `change`/);
  await assert.rejects(handleCommand(make(1,10),{},g),/either `change`/);
  let called;await handleCommand(make(null,10),{adjustWords:async a=>{called=a;return {duplicate:false,awarded:0,before_ap:0,after_ap:0,remainder:10,capped:false};}},g);
  assert.equal(called.words,10);
});
