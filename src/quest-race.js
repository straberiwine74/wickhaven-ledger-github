import { randomUUID } from 'node:crypto';
import { QuestStore } from './quest.js';

const active=new WeakSet();
function barrierPool(pool,n) {
  let arrived=0,release;
  const ready=new Promise(resolve=>{release=resolve;});
  const pids=new Set();
  let timer=setTimeout(()=>release(),15000);
  return {pids,async connect() {
    const db=await pool.connect();
    return {release:()=>db.release(),async query(sql,args) {
      if(sql==='SELECT * FROM ledger_quest_test_runs WHERE id=$1 FOR UPDATE') {
        pids.add((await db.query('SELECT pg_backend_pid() AS pid')).rows[0].pid);
        arrived++;if(arrived===n) {clearTimeout(timer);release();}
        await ready;
      }
      return db.query(sql,args);
    }};
  },stop(){clearTimeout(timer);release();}};
}

export async function runClickDiagnostic(pool) {
  if(active.has(pool)) throw new Error('A click-protection test is already running.');
  active.add(pool);
  const id=randomUUID(),scope='diagnostic:'+id;
  let created=false,phase='setup';
  const check=(ok,label)=>{if(!ok) throw new Error('Click diagnostic failed at '+label);};
  const snapshot={v:1,name:'Synthetic test',hp:10,maxHp:10,tempHp:0,passive:10,skills:Object.fromEntries(['athletics','stealth','investigation','perception'].map(k=>[k,{mod:0,adv:null}])),loadout:{source:'declared-manifest',items:[{name:'Synthetic rations',qty:2}]},coins:{pp:0,gp:1,ep:0,sp:0,cp:0}};
  const state={scene:'review',hp:10,tempHp:0,items:snapshot.loadout.items,coins:snapshot.coins};
  let choices,finishes;
  try {
    await pool.query(`INSERT INTO ledger_quest_test_runs(id,guild_id,player_id,character_id,snapshot,state) VALUES($1,$2,$2,$2,$3,$4)`,[id,scope,JSON.stringify(snapshot),JSON.stringify(state)]);created=true;
    const store=new QuestStore(pool);await store.act(id,scope,scope,0,'confirm');
    let rolls=0;choices=barrierPool(pool,3);
    const race=new QuestStore(choices,()=>{rolls++;return 10;});
    phase='parallel choices';
    const picked=await Promise.allSettled(['climb','sneak','study'].map(action=>race.act(id,scope,scope,1,action)));
    check(picked.every(r=>r.status==='fulfilled'),'choice responses');
    check(choices.pids.size===3,'three independent database sessions');
    check(rolls===1,'single die roll');
    const committed=(await pool.query('SELECT * FROM ledger_quest_test_runs WHERE id=$1',[id])).rows[0];
    check(committed.revision===2&&committed.state.scene==='landing','single choice commit');
    check(picked.every(r=>JSON.stringify(r.value.state)===JSON.stringify(committed.state)),'identical saved results');
    check(committed.state.hp===10&&committed.state.items[0].qty===2&&committed.state.coins.gp===1,'resource preservation');
    finishes=barrierPool(pool,3);phase='parallel completion';
    const ended=await Promise.allSettled(Array.from({length:3},()=>new QuestStore(finishes).act(id,scope,scope,2,'finish')));
    check(ended.every(r=>r.status==='fulfilled')&&finishes.pids.size===3,'completion sessions');
    const count=async table=>(await pool.query(`SELECT count(*)::integer AS n FROM ${table} WHERE run_id=$1`,[id])).rows[0].n;
    check(await count('ledger_quest_test_rewards')===1,'one journal reward');
    check(await count('ledger_quest_test_receipts')===1,'one ending receipt');
    check(await count('ledger_quest_test_events')===3,'exactly confirm, choice and completion events');
    return {ok:true,choiceSessions:choices.pids.size,completionSessions:finishes.pids.size,rolls,rewards:1,receipts:1};
  } catch(error) { console.error(`Quest synthetic concurrency test failed during ${phase}.`);throw error; }
  finally {
    choices?.stop();finishes?.stop();
    try {
      if(created) {
        const db=await pool.connect();
        try {
          await db.query('BEGIN');
          for(const table of ['ledger_quest_test_receipts','ledger_quest_test_rewards','ledger_quest_test_events']) await db.query(`DELETE FROM ${table} WHERE run_id=$1`,[id]);
          await db.query('DELETE FROM ledger_quest_test_knowledge WHERE guild_id=$1 AND character_id=$1',[scope]);
          await db.query('DELETE FROM ledger_quest_test_runs WHERE id=$1 AND guild_id=$2',[id,scope]);
          await db.query('COMMIT');
        } catch(e) {await db.query('ROLLBACK');throw e;} finally {db.release();}
      }
    } finally {active.delete(pool);}
  }
}
