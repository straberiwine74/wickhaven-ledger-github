import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { TestLedger } from '../src/store.js';

test('database saves, deduplicates, carries words across days and enforces cap', async () => {
  const db = new PGlite();
  const pool = { query: db.query.bind(db), connect: async () => ({ query: db.query.bind(db), release() {} }) };
  const ledger = new TestLedger(pool);
  let sequence = 0;
  const write = (words, time = '2026-10-31T18:00:00Z', overrides = {}) => {
    sequence++;
    return ledger.record({ guildId: 'g', playerId: 'p', originalId: `o${sequence}`, proxyId: `x${sequence}`, words, time, ...overrides });
  };
  try {
    await ledger.init();
    assert.equal((await write(250)).remainder, 250);
    assert.equal((await write(50)).awarded, 1);
    const duplicate = await write(50, undefined, { originalId: 'o2' });
    assert.equal(duplicate.duplicate, true);
    assert.equal((await ledger.status('g', 'p', Date.parse('2026-10-31T19:00:00Z'))).total, 1);
    await write(1200);
    assert.equal((await write(900)).awarded, 0);
    let status = await ledger.status('g', 'p', Date.parse('2026-10-31T19:00:00Z'));
    assert.deepEqual(status, { remainder: 0, total: 4, active_days: 1, today: 4, held: 0 });
    await write(250, '2026-11-01T18:00:00Z');
    await write(50, '2026-11-02T18:00:00Z');
    status = await new TestLedger(pool).status('g', 'p', Date.parse('2026-11-02T19:00:00Z'));
    assert.deepEqual(status, { remainder: 0, total: 5, active_days: 2, today: 1, held: 0 });
    await assert.rejects(write(100, '2026-10-30T18:00:00Z'), /Out-of-order/);
    assert.equal((await ledger.status('g', 'p')).total, 5);
    const other = await ledger.status('other', 'p');
    assert.equal(other.total, 0);
    assert.equal((await write(300, '2026-11-02T18:00:00Z', { playerId: 'second' })).awarded, 1);
    const proxyDuplicate = await write(300, '2026-11-02T18:00:00Z', { proxyId: 'x2' });
    assert.equal(proxyDuplicate.duplicate, true);
  } finally { await db.close(); }
});

test('registrations are per-player and corrections are audited, idempotent and bounded', async () => {
  const db = new PGlite();
  const pool = { query: db.query.bind(db), connect: async () => ({ query: db.query.bind(db), release() {} }) };
  const ledger = new TestLedger(pool);
  try {
    await ledger.init();
    await ledger.register('g','p','Ryder','R:');
    await ledger.register('g','p','Lyra','L:');
    await ledger.register('g','other','Their Ryder','R:');
    assert.equal((await ledger.registrations('g','p')).length,2);
    assert.equal((await ledger.registrations('g','other')).length,1);
    assert.equal((await new TestLedger(pool).registrations('g','p'))[1].prefix,'R:');
    assert.equal(await ledger.unregister('g','other','Lyra'),0);
    await ledger.register('g','p','Ryder','Ry:');
    assert.equal((await ledger.registrations('g','p'))[1].prefix,'Ry:');
    await assert.rejects(ledger.register('g','p','Conflict','L:'), /already registered/);
    await ledger.record({ guildId:'g',playerId:'p',originalId:'o',proxyId:'x',words:350,time:'2026-10-31T18:00:00Z' });
    const input = { guildId:'g',playerId:'p',moderatorId:'mod',requestId:'a1',delta:-1,day:'2026-10-31',reason:'Remove test award',today:'2026-10-31' };
    const correction = await ledger.adjust(input);
    assert.equal(correction.before_ap,1);
    assert.equal(correction.after_ap,0);
    const status = await ledger.status('g','p',Date.parse('2026-10-31T19:00:00Z'));
    assert.deepEqual(status,{ remainder:50,total:0,active_days:0,today:0,held:0 });
    assert.equal((await ledger.adjust(input)).duplicate,true);
    await assert.rejects(ledger.adjust({ ...input,requestId:'a2' }), /between 0 and 4/);
    await ledger.adjust({ ...input,requestId:'a3',delta:4,reason:'Restore test credit' });
    await assert.rejects(ledger.adjust({ ...input,requestId:'a4',delta:1 }), /between 0 and 4/);
    assert.equal((await ledger.status('g','p')).total,4);
    const audit = await ledger.audit('g','p');
    assert.equal(audit.length,2);
    assert.equal(audit[0].moderator_id,'mod');
    assert.equal((await ledger.audit('other','p')).length,0);
    assert.equal(await ledger.unregister('g','p','Ryder'),1);
    assert.equal((await ledger.registrations('g','p')).length,1);
  } finally { await db.close(); }
});
