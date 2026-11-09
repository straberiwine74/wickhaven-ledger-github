import test from 'node:test';
import assert from 'node:assert/strict';
import { approvalWelcome, sendApprovalWelcome } from '../src/approval-welcome.js';

const pool={query:async()=>({rows:[{thread_id:'th'}]})};
test('approval welcome lists directory, Avrae, Tupper and adventuring steps',()=>{
  const text=JSON.stringify(approvalWelcome('Leaf','g','th',{directoryId:'dir',botSpamId:'spam',templateUrl:'https://discord.com/channels/1/2/3'}));
  for(const s of ['Leaf is approved','<#dir>','the template](https://discord.com/channels/1/2/3)','!import','<#spam>','/ledger-tupper register','!depart','https://discord.com/channels/g/th'])assert.ok(text.includes(s),s);
  assert.ok(JSON.stringify(approvalWelcome('Leaf','g',null,{directoryId:'dir',templateUrl:'not a link'})).includes('post guidelines'));
});
test('sends a DM, and falls back to the review thread when DMs are closed',async()=>{
  const dms=[],thread=[];
  const client=closed=>({users:{fetch:async()=>({send:async p=>{if(closed)throw Object.assign(new Error('Cannot send'),{code:50007});dms.push(p);}})},channels:{fetch:async()=>({send:async p=>{thread.push(p);return {id:'m'};}})}});
  assert.equal(await sendApprovalWelcome({client:client(false),pool,guildId:'g',playerId:'p',nameKey:'leaf',name:'Leaf'}),'dm');
  assert.equal(dms.length,1);assert.equal(thread.length,0);
  assert.equal(await sendApprovalWelcome({client:client(true),pool,guildId:'g',playerId:'p',nameKey:'leaf',name:'Leaf'}),'thread');
  assert.match(thread[0].content,/<@p>, your DMs are closed/);assert.deepEqual(thread[0].allowedMentions,{parse:[],users:['p']});
});
