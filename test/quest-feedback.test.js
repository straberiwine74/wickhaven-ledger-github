import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { QuestFeedbackStore, starLine, parseDm, starTags, nextTags, publicReview, auditReview, questFeedbackCommand } from '../src/quest-feedback.js';

const tags=[{id:'t1',name:'⭐'},{id:'t2',name:'⭐⭐'},{id:'t3',name:'⭐⭐⭐'},{id:'t4',name:'⭐⭐⭐⭐'},{id:'t5',name:'⭐️⭐️⭐️⭐️⭐️'},{id:'live',name:'Live'}];

test('/quest offers 1 to 5 stars',()=>{
  assert.equal(questFeedbackCommand.name,'quest');
  assert.deepEqual(questFeedbackCommand.options[0].choices.map(c=>c.value),[1,2,3,4,5]);
});
test('star line, DM parsing and star-tag mapping',()=>{
  assert.equal(starLine(2),'⭐⭐☆☆☆');
  assert.equal(parseDm('Quest Date: someday\nDM: Sam'),'Sam');
  assert.equal(parseDm('**DM:** <@123>'),'<@123>');
  assert.equal(parseDm('no dm here'),null);
  assert.equal(starTags(tags).size,5);
  assert.equal(starTags(tags).get(5),'t5');
});
test('average 3.5 rounds to four stars and other tags are kept',()=>{
  assert.deepEqual(nextTags(['live','t2'],tags,3.5),{tags:['live','t4'],found:true});
  assert.deepEqual(nextTags(['live'],[{id:'live',name:'Live'}],5),{tags:['live'],found:false});
});
test('anonymous review hides the player; audit names them',()=>{
  const pub=JSON.stringify(publicReview(5,'Sam','Great pacing'));
  assert.ok(pub.includes('Anonymous quest feedback')&&pub.includes('Sam')&&!pub.includes('<@p1>'));
  const audit=JSON.stringify(auditReview({stars:2,dm:'Sam',feedback:'Too slow',playerId:'p1',threadId:'th',guildId:'g',publicId:'m1',replaced:true}));
  for(const s of ['<@p1>','<#th>','Too slow','(updated)','ids:th:p1:m1'])assert.ok(audit.includes(s),s);
});
test('re-running /quest replaces the earlier review and the average updates',async()=>{
  const db=new PGlite();const store=new QuestFeedbackStore({query:db.query.bind(db)});
  try{
    await store.init();
    assert.equal(await store.save('g','th','p1',5,'Awesome DM'),null);
    await store.setMessages('g','th','p1','m1','a1');
    await store.save('g','th','p2',2,'Rubbish pacing');
    assert.deepEqual(await store.average('g','th'),{average:3.5,count:2});
    const prior=await store.save('g','th','p2',4,'Second look, it was good');
    assert.equal(prior.stars,2);
    assert.deepEqual(await store.average('g','th'),{average:4.5,count:2});
    assert.equal((await store.get('g','th','p1')).public_message_id,'m1');
    assert.deepEqual(await store.average('g','other'),{average:0,count:0});
  }finally{await db.close();}
});
