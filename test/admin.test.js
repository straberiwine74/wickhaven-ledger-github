import test from 'node:test';
import assert from 'node:assert/strict';
import { registrationInput, adjustmentInput, staffAllowed } from '../src/admin.js';
import { handleCommand } from '../src/commands.js';

test('registration accepts prefix-only and paired or suffix-only brackets', () => {
  assert.equal(registrationInput('Ryder','R:').prefix,'R:');
  assert.equal(registrationInput('Lyra','[',']').suffix,']');
  assert.equal(registrationInput('Other','',')').suffix,')');
  assert.throws(() => registrationInput('Bad','',''), /nonempty/);
  assert.throws(() => registrationInput('Bad','R:\n'), /line breaks/);
});
test('adjustments validate calendar dates, future dates, delta and reasons', () => {
  assert.equal(adjustmentInput(-1,'2026-10-31','Correct test credit','2026-10-31').delta,-1);
  for (const date of ['2026-02-30','2026-11-01','10/31/2026']) assert.throws(() => adjustmentInput(1,date,'Correction','2026-10-31'));
  for (const delta of [0,5,-5,1.5]) assert.throws(() => adjustmentInput(delta,'2026-10-31','Correction','2026-10-31'));
  assert.throws(() => adjustmentInput(1,'2026-10-31','x','2026-10-31'));
});
test('staff authorization needs administrator or an explicitly configured role', () => {
  const member = (admin,roles) => ({ permissions: { has: () => admin }, roles: { cache: new Map(roles.map(r => [r,true])) } });
  assert.equal(staffAllowed(member(false,['player']),['mod']),false);
  assert.equal(staffAllowed(member(false,['mod']),['mod']),true);
  assert.equal(staffAllowed(member(true,[])),true);
});
test('self-service registration binds to invoking user without a target-user option', async () => {
  let captured;
  const interaction = {
    commandName:'ledger-tupper',user:{ id:'actual-player' },
    options:{ getSubcommand:()=>'register',getString:name=>({ name:'Ryder',prefix:'R:' })[name] }
  };
  await handleCommand(interaction,{ register:async (...args)=>{ captured=args; return {name:'Ryder',prefix:'R:',suffix:''}; } },'guild');
  assert.deepEqual(captured,['guild','actual-player','Ryder','R:','']);
});
test('unauthorized staff command never reaches the adjustment store', async () => {
  let wrote = false;
  const interaction = {commandName:'ledger-adjust',user:{id:'p'},guild:{members:{fetch:async()=>({permissions:{has:()=>false},roles:{cache:new Map()}})}}};
  await assert.rejects(handleCommand(interaction,{ adjust:async()=>{wrote=true;} },'g'),/Only administrators/);
  assert.equal(wrote,false);
});
