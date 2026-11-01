import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { Collection,ChannelType } from 'discord.js';
import { TestLedger } from '../src/store.js';
import { ReviewPosts,reviewPayload } from '../src/review-posts.js';
import { reviewInteraction,canReview } from '../src/review-interactions.js';

const g='1566203164464513104',f='1566205298870325288',r='1566212934449893457';
const link=`https://discord.com/channels/${g}/1566206538563981483/1566255808382238942`;
const input={name:'Ryder',sheet:'https://www.dndbeyond.com/characters/123',stats:link,sample:link,set:2,resources:'gold'};
function transport(){
  const all=new Collection();let creates=0,pings=0;let fail=false;
  const normalize=p=>({...p,embeds:(p.embeds??[]).map(e=>e.toJSON?e.toJSON():e)});
  const forum={id:f,guildId:g,type:ChannelType.GuildForum,availableTags:[],flags:{bitfield:0},guild:{roles:{fetch:async()=>({mentionable:true})}}};
  forum.threads={fetchActive:async()=>({threads:all}),fetchArchived:async()=>({threads:new Collection(),hasMore:false}),create:async data=>{
    if(fail)throw new Error('Simulated missing Send Messages permission');
    creates++;
    const id=String(1566206000000000000n+BigInt(creates));
    const messages=new Collection();
    const starter={id,author:{id:'bot'},...normalize(data.message),edit:async payload=>Object.assign(starter,normalize(payload))};
    messages.set(id,starter);
    const thread={id,name:data.name,parentId:f,ownerId:'bot',archived:false,fetchStarterMessage:async()=>starter,messages:{fetch:async()=>messages},send:async payload=>{
      pings++;const message={id:'ping'+pings,author:{id:'bot'},...normalize(payload)};messages.set(message.id,message);return message;
    }};
    all.set(id,thread);return thread;
  }};
  return {client:{user:{id:'bot'},channels:{fetch:async id=>id===f?forum:all.get(id)}},all,get creates(){return creates;},get pings(){return pings;},set fail(value){fail=value;}};
}
test('public review creates once, mentions only moderators, updates resubmissions and decisions',async()=>{
  const db=new PGlite();
  const pool={query:db.query.bind(db),connect:async()=>({query:db.query.bind(db),release(){}})};
  const ledger=new TestLedger(pool),discord=transport();
  const posts=new ReviewPosts(pool,discord.client,g,f,r);
  try{
    await ledger.init();await ledger.characters.submit(g,'player',input);
    const url=await posts.sync('player','Ryder');assert.match(url,/discord.com\/channels/);assert.equal(discord.creates,1);
    const starter=await discord.all.first().fetchStarterMessage();
    assert.deepEqual(starter.allowedMentions,{parse:[],roles:[r],users:[]});assert.match(starter.content,new RegExp(r));
    assert.match(starter.embeds[0].description,/Pending review/);assert.equal(starter.embeds[0].fields.length,5);
    await posts.sync('player','Ryder');assert.equal(discord.creates,1);assert.equal(discord.pings,0);
    await ledger.characters.submit(g,'player',{...input,set:3});
    await posts.sync('player','Ryder');assert.equal(discord.creates,1);assert.equal(discord.pings,1);
    await posts.sync('player','Ryder');assert.equal(discord.pings,1);
    const c=await ledger.characters.review(g,'player','Ryder');
    const decision={guildId:g,playerId:'player',name:'Ryder',moderatorId:'mod',requestId:'approved',decision:'approved',note:'Reviewed all requirements'};
    await assert.rejects(ledger.characters.decide({...decision,expectedRevision:1}),/changed after/);
    await ledger.characters.decide({...decision,expectedRevision:c.revision});
    await posts.sync('player','Ryder');assert.match(starter.embeds[0].description,/Approved/);
    assert.deepEqual(starter.allowedMentions,{parse:[]});assert.equal(starter.components[0].toJSON().components[0].disabled,true);
    // Recover a post whose creation succeeded before its mapping was committed.
    await db.query('DELETE FROM ledger_test_review_posts');
    await posts.sync('player','Ryder');assert.equal(discord.creates,1);
    assert.equal((await db.query('SELECT needs_publish FROM ledger_test_characters')).rows[0].needs_publish,false);
  }finally{await db.close();}
});
test('Discord publish failure preserves the saved submission for retry',async()=>{
  const db=new PGlite();const pool={query:db.query.bind(db),connect:async()=>({query:db.query.bind(db),release(){}})};
  const ledger=new TestLedger(pool),discord=transport();const posts=new ReviewPosts(pool,discord.client,g,f,r);
  try{
    await ledger.init();await ledger.characters.submit(g,'player',input);discord.fail=true;
    await assert.rejects(posts.sync('player','Ryder'),/Simulated/);
    assert.equal((await ledger.characters.review(g,'player','Ryder')).needs_publish,true);
    assert.equal((await db.query('SELECT * FROM ledger_test_review_posts')).rows.length,0);
    discord.fail=false;await posts.retryPending();assert.equal(discord.creates,1);
  }finally{await db.close();}
});
test('review payload uses explicit role allowlist and never allows arbitrary mentions',()=>{
  const c={guild_id:g,player_id:'p',name_key:'x',name:'@everyone',status:'pending',revision:1,sheet_url:input.sheet,stats_url:link,sample_url:link,stat_set:1,resources:'equipment'};
  assert.deepEqual(reviewPayload(c,r).allowedMentions,{parse:[],roles:[r],users:[]});
});
test('public review buttons reject nonstaff before any database decision',async()=>{
  let reply;
  const interaction={customId:'char-review:approved:'+'a'.repeat(32)+':1',guildId:g,memberPermissions:{has:()=>false},member:{roles:[]},reply:async data=>{reply=data;}};
  await reviewInteraction(interaction,{},g);assert.match(reply.content,/Only administrators/);
  assert.equal(canReview({memberPermissions:{has:()=>true}}),true);
});
