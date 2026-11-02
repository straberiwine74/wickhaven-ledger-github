import test from 'node:test';
import assert from 'node:assert/strict';
import { questCatalogue } from '../src/quest-catalogue.js';
import { commands, handleCommand } from '../src/commands.js';
const interaction=(page=null)=>({commandName:'ledger-quests',options:{getInteger:()=>page}});
const env={LEDGER_LIVE:'true',QUEST_CHANNEL_ID:'12345678901234567',QUEST_TEST_CHANNEL_ID:'22345678901234567'};
test('quest catalogue is registered and dispatches without reading player data',async()=>{
  assert.ok(commands.some(c=>c.name==='ledger-quests'));
  const result=await handleCommand(interaction(),null,'guild');
  assert.match(result.embeds[0].title,/Quests/);
});
test('catalogue lists departure commands and separates testing, hidden and prerequisites',()=>{
  const registry={a:{id:'a',name:'A',status:'live'},b:{id:'b',name:'B',status:'test',requires:{scope:'server',hint:'Find the route.'}},c:{id:'c',name:'SECRET',status:'hidden'}};
  const result=questCatalogue(interaction(),registry,env),text=JSON.stringify(result);
  assert.match(text,/!depart a/);assert.match(text,/!depart b/);assert.match(text,/Testing only/);
  assert.match(text,/server discovery/);assert.match(text,/Find the route/);assert.doesNotMatch(text,/SECRET/);
  assert.match(text,/12345678901234567/);assert.match(text,/22345678901234567/);
  registry.d={id:'d',name:'D',status:'live'};
  assert.match(JSON.stringify(questCatalogue(interaction(),registry,env)),/!depart d/);
});
test('pagination preserves all quests within Discord limits',()=>{
  const registry=Object.fromEntries(Array.from({length:31},(_,i)=>[i,{id:`q-${i}`,name:`Quest ${String(i).padStart(2,'0')}`,status:'live'}]));
  const seen=[];
  for(let page=1;page<=7;page++) {
    const embed=questCatalogue(interaction(page),registry,env).embeds[0];
    assert.ok(embed.fields.length<=5);seen.push(...embed.fields.map(f=>f.name));
    assert.ok(JSON.stringify(embed).length<6000);
  }
  assert.equal(new Set(seen).size,31);
  assert.match(questCatalogue(interaction(100),registry,env).embeds[0].footer.text,/Page 7 of 7/);
});
test('empty and disabled catalogues explain availability',()=>{
  const text=JSON.stringify(questCatalogue(interaction(),{},{}));
  assert.match(text,/No quests/);assert.match(text,/turned off/);
});
