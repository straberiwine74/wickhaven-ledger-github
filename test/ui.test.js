import test from 'node:test';
import assert from 'node:assert/strict';
import { card, message, notice, palette } from '../src/ui.js';

test('cards share the Ledger footer, palette and Discord limits',()=>{
  const e=card({title:'x'.repeat(300),description:'d',tone:'warning',footer:'Extra',fields:[{name:'A',value:'1',inline:true},{name:'Empty',value:''},...Array.from({length:30},(_,i)=>({name:'F'+i,value:'v'.repeat(1100)}))]});
  assert.equal(e.title.length,256);assert.equal(e.color,palette.warning);assert.equal(e.footer.text,'The Wickhaven Ledger • TEST • Extra');
  assert.ok(e.fields.length<=25&&!e.fields.some(f=>f.name==='Empty'));assert.ok(e.fields.every(f=>f.value.length<=1024));
  const size=[e.title,e.description,e.footer.text,...e.fields.flatMap(f=>[f.name,f.value])].join('').length;assert.ok(size<=6000,String(size));
  assert.deepEqual(message(e).allowedMentions,{parse:[]});assert.equal(notice('T','D').embeds[0].color,palette.danger);
});
