import test from 'node:test';
import assert from 'node:assert/strict';
import { countWords, creditWriting, characterSlots, serverDay } from '../src/activity.js';
test('unfinished writing carries into the next award', () => {
  const a = creditWriting({}, 250);
  assert.deepEqual(creditWriting({ remainder: a.remainder, dailyAP: 0 }, 50), { remainder: 0, dailyAP: 1, awarded: 1 });
});
test('combined daily cap prevents surplus banking', () => {
  assert.deepEqual(creditWriting({ remainder: 250, dailyAP: 3 }, 1000), { remainder: 0, dailyAP: 4, awarded: 1 });
  assert.deepEqual(creditWriting({ remainder: 250, dailyAP: 4 }, 1000), { remainder: 250, dailyAP: 4, awarded: 0 });
});
test('slot unlocks require all three conditions', () => {
  assert.equal(characterSlots({ elapsedDays: 30, totalAP: 60, activeDays: 19 }), 2);
  assert.equal(characterSlots({ elapsedDays: 30, totalAP: 60, activeDays: 20 }), 3);
  assert.equal(characterSlots({ elapsedDays: 60, totalAP: 120, activeDays: 40 }), 4);
});
test('Chicago midnight handles summer and winter', () => {
  assert.equal(serverDay(new Date('2026-07-01T04:59:00Z')), '2026-06-30');
  assert.equal(serverDay(new Date('2026-07-01T05:00:00Z')), '2026-07-01');
  assert.equal(serverDay(new Date('2026-12-01T05:59:00Z')), '2026-11-30');
});
test('commands, quote lines, links and mentions do not count', () => {
  assert.equal(countWords('Hello there.\n> quoted words\n!rollstats\nhttps://example.com <@123>'), 2);
});
