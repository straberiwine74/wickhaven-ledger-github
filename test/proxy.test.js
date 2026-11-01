import test from 'node:test';
import assert from 'node:assert/strict';
import { ProxyTracker } from '../src/proxy.js';
function setup(content = 'L:Hello there') {
  const t = new ProxyTracker([{ playerId: 'p1', prefix: 'L:', suffix: '' }]);
  t.original({ id: 'o1', playerId: 'p1', channelId: 'c', content, time: 1000 });
  return t;
}
function proxy(t, overrides = {}) { t.proxy({ id: 'x', channelId: 'c', content: 'Hello there', time: 1100, trusted: true, ...overrides }); }
test('manual brackets match original author with deletion in either event order', () => {
  for (const early of [true, false]) {
    const t = setup(); if (early) t.deleted('o1'); proxy(t); if (!early) t.deleted('o1');
    assert.equal(t.resolve('x').playerId, 'p1');
    assert.equal(t.resolve('x').status, 'duplicate');
  }
});
test('autoproxy exact-content matching', () => { const t = setup('Hello there'); proxy(t); t.deleted('o1'); assert.equal(t.resolve('x').status, 'matched'); });
test('same content from two people remains ambiguous', () => {
  const t = setup(); t.original({ id: 'o2', playerId: 'p2', channelId: 'c', content: 'Hello there', time: 1050 });
  t.deleted('o1'); proxy(t); assert.equal(t.resolve('x').status, 'ambiguous');
});
test('missing deletion never matches', () => { const t = setup(); proxy(t); assert.equal(t.resolve('x').status, 'deletion-missing'); });
test('untrusted webhook never matches', () => { const t = setup(); t.deleted('o1'); proxy(t, { trusted: false }); assert.equal(t.resolve('x').status, 'untrusted-webhook'); });
test('cross-channel and stale originals never match', () => {
  for (const patch of [{ channelId: 'other' }, { time: 20000 }]) { const t = setup(); t.deleted('o1'); proxy(t, patch); assert.equal(t.resolve('x').status, 'original-missing'); }
});
test('one original cannot credit two proxies', () => {
  const t = setup(); t.deleted('o1'); proxy(t); assert.equal(t.resolve('x').status, 'matched');
  proxy(t, { id: 'y' }); assert.equal(t.resolve('y').status, 'already-matched');
});
test('only hashes retained and expiry removes records', () => {
  const t = setup(); assert.equal(t.originals.get('o1').content, undefined);
  t.expire(130000); assert.equal(t.originals.size, 0);
});
