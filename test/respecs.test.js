import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { Collection, ChannelType } from 'discord.js';
import { TestLedger } from '../src/store.js';
import { Respecs, respecPayload, respecInteraction, respecThreadName } from '../src/respecs.js';
import { characterCommands } from '../src/character-commands.js';

const g='1566203164464513104',ch='1553532263830917262',role='1553523287412449310';
const link=`https://discord.com/channels/${g}/1566206538563981483/1566255808382238942`;
const input={name:'Leaf',sheet:'https://www.dndbeyond.com/characters/777',stats:link,set:1,resources:'equipment'};
function discord(){
  const threads=new Collection();const sent=[];
  const channel={id:ch,type:ChannelType.GuildText,threads:{create:async d=>{
    const msgs=new Collection();
    const t={id:'t'+(threads.size+1),name:d.name,type:d.type,archived:false,members:new Set(),setName:async n=>{t.name=n;},setArchived:async()=>{},
      messages:{fetch:async id=>msgs.get(id)},
      send:async p=>{const m={id:'m'+msgs.size,content:p.content,...p};m.edit=async q=>Object.assign(m,q);msgs.set(m.id,m);sent.push(p);return m;}};
    t.members.add=async u=>Set.prototype.add.call(t.members,u);
    threads.set(t.id,t);return t;}}};
  return {client:{channels:{fetch:async id=>id===ch?channel:threads.get(id)}},threads,sent};
}
async function setup(){
  const db=new PGlite();const pool={query:db.query.bind(db),connect:async()=>({query:db.query.bind(db),release(){}})};
  const ledger=new TestLedger(pool);await ledger.init();
  await ledger.characters.submit(g,'p',input);
  await ledger.characters.submit(g,'p',{...input,name:'Pending One',sheet:'https://www.dndbeyond.com/characters/778'});
  await ledger.characters.decide({guildId:g,playerId:'p',name:'Leaf',moderatorId:'mod',requestId:'a1',decision:'approved',note:'Reviewed creation requirements'});
  const d=discord();ledger.respecs=new Respecs(pool,d.client,{guildId:g,channelId:ch,roleId:role});await ledger.respecs.init();
  return {db,ledger,d};
}
test('respec command takes a name and the requested changes',()=>{
  const sub=characterCommands.find(c=>c.name==='ledger-character').options.find(o=>o.name==='respec');
  assert.deepEqual(sub.options.map(o=>o.name),['name','changes']);
});
test('respec requests need an approved character and update the open request instead of duplicating',async()=>{
  const {db,ledger}=await setup();const s=ledger.respecs.store;
  try{
    await assert.rejects(s.request(g,'p','Pending One','Swap a feat please','r0'),/Only approved/);
    await assert.rejects(s.request(g,'other','Leaf','Swap a feat please','r0'),/No character/);
    await assert.rejects(s.request(g,'p','Leaf','short','r0'),/10 to 1,000/);
    const r=await s.request(g,'p','Leaf','Swap Alert for Lucky','r1');assert.equal(r.status,'pending');
    const again=await s.request(g,'p','Leaf','Swap Alert for Tough instead','r2');
    assert.equal(again.id,'r1');assert.equal(again.revision,2);assert.equal(again.updated,true);
  }finally{await db.close();}
});
test('staff decide, player resubmits, and the private thread tracks status',async()=>{
  const {db,ledger,d}=await setup();const s=ledger.respecs.store;
  try{
    let r=await s.request(g,'p','Leaf','Swap Alert for Lucky','r1');
    await ledger.respecs.publish(r);
    const t=d.threads.first();
    assert.equal(t.type,ChannelType.PrivateThread);assert.ok(t.members.has('p'));assert.equal(t.name,'Leaf · Respec · Pending');
    assert.deepEqual(d.sent[0].allowedMentions,{parse:[],roles:[role],users:['p']});
    await assert.rejects(s.decide('r1','mod','rejected','no',1),/5 to 500/);
    r=await s.decide('r1','mod','rejected','Lucky is fine, but explain why Alert no longer fits',1);
    await ledger.respecs.publish(r,'rejected');assert.equal(t.name,'Leaf · Respec · Changes requested');assert.match(d.sent.at(-1).content,/<@p>, staff asked for changes/);
    await assert.rejects(s.resubmit('r1','someone',1),/Only the player/);
    r=await s.resubmit('r1','p',1);assert.equal(r.status,'pending');assert.equal(r.revision,2);
    await ledger.respecs.publish(r,'pending');assert.match(d.sent.at(-1).content,new RegExp(`<@&${role}>`));
    await assert.rejects(s.decide('r1','mod','approved','',1),/changed after/);
    r=await s.decide('r1','mod','approved','',2);await ledger.respecs.publish(r,'approved');
    assert.equal(t.name,'Leaf · Respec · Approved');assert.match(d.sent.at(-1).content,/✅ Respec approved! <@p>/);
    await assert.rejects(s.decide('r1','mod','approved','',2),/already approved/);
    const next=await s.request(g,'p','Leaf','Now swap my cantrip','r3');assert.equal(next.id,'r3');
  }finally{await db.close();}
});
test('payload buttons follow status and non-staff cannot decide',async()=>{
  const r={id:'r1',player_id:'p',name:'Leaf',changes:'Swap Alert for Lucky',status:'pending',revision:1};
  const b=respecPayload(r,role).components[0].toJSON().components;
  assert.deepEqual(b.map(x=>x.disabled),[false,false,true]);
  assert.equal(respecThreadName({...r,status:'rejected'}),'Leaf · Respec · Changes requested');
  let reply;
  const handled=await respecInteraction({customId:'respec:approve:123:1',isButton:()=>true,isModalSubmit:()=>false,guildId:g,memberPermissions:{has:()=>false},member:{roles:[]},reply:async x=>{reply=x;}},{respecs:{}},g);
  assert.equal(handled,true);assert.match(reply.embeds[0].description,/Only administrators/);
  assert.equal(await respecInteraction({customId:'char-review:approved:x:1',isButton:()=>true,isModalSubmit:()=>false},{},g),false);
});
