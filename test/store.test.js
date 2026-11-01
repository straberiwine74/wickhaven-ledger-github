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
    assert.deepEqual(status, { remainder: 0, total: 4, active_days: 1, today: 4 });
    await write(250, '2026-11-01T18:00:00Z');
    await write(50, '2026-11-02T18:00:00Z');
    status = await new TestLedger(pool).status('g', 'p', Date.parse('2026-11-02T19:00:00Z'));
    assert.deepEqual(status, { remainder: 0, total: 5, active_days: 2, today: 1 });
    await assert.rejects(write(100, '2026-10-30T18:00:00Z'), /Out-of-order/);
    assert.equal((await ledger.status('g', 'p')).total, 5);
    const other = await ledger.status('other', 'p');
    assert.equal(other.total, 0);
    assert.equal((await write(300, '2026-11-02T18:00:00Z', { playerId: 'second' })).awarded, 1);
    const proxyDuplicate = await write(300, '2026-11-02T18:00:00Z', { proxyId: 'x2' });
    assert.equal(proxyDuplicate.duplicate, true);
  } finally { await db.close(); }
});
