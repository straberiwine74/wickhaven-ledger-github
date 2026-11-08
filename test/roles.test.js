import test from 'node:test';
import assert from 'node:assert/strict';
import { promoteApplicant } from '../src/roles.js';
const roles={applicant:'APP',adventurer:'ADV'};
function setup({has=['APP'],fetchError,addError}={}){
  const sent=[],ops=[];
  const cache=new Set(has);
  const member={roles:{cache:{has:id=>cache.has(id)},add:async id=>{if(addError)throw addError;ops.push('add:'+id);cache.add(id);},remove:async id=>{ops.push('remove:'+id);cache.delete(id);}}};
  const client={guilds:{fetch:async()=>({members:{fetch:async()=>{if(fetchError)throw fetchError;return member;}}})},channels:{fetch:async()=>({send:async m=>sent.push(m.content)})}};
  const pool={query:async()=>({rows:[{thread_id:'th'}]})};
  return {args:{client,pool,guildId:'g',playerId:'p',nameKey:'leaf',roles},sent,ops};
}
test('approval swaps Applicant for Adventurer and confirms in the thread',async()=>{
  const s=setup();
  assert.equal(await promoteApplicant(s.args),'promoted');
  assert.deepEqual(s.ops,['add:ADV','remove:APP']);
  assert.match(s.sent[0],/✅ Approved! <@p> now has the Adventurer role/);
});
test('Applicant is only removed when the player has it; Adventurer is not re-added',async()=>{
  const s=setup({has:['ADV']});
  assert.equal(await promoteApplicant(s.args),'promoted');
  assert.deepEqual(s.ops,[]);
});
test('a player who left is skipped quietly',async()=>{
  const s=setup({fetchError:Object.assign(new Error('Unknown Member'),{code:10007})});
  assert.equal(await promoteApplicant(s.args),'left');
  assert.deepEqual(s.sent,[]);
});
test('a failed role change is logged and noted for staff, without throwing',async()=>{
  const s=setup({addError:Object.assign(new Error('Missing Permissions'),{code:50013})});
  assert.equal(await promoteApplicant(s.args),'failed');
  assert.match(s.sent[0],/⚠️ Approved, but the Ledger couldn.t change <@p>.s roles \(missing Manage Roles/);
});
