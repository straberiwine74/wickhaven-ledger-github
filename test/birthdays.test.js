import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { Birthdays, validBirthday, celebratedOn, birthdayCommand } from '../src/birthdays.js';

test('/birthday has set, view and remove; only real dates are accepted',()=>{
  assert.deepEqual(birthdayCommand.options.map(o=>o.name),['set','view','remove']);
  assert.ok(validBirthday(2,29));assert.ok(!validBirthday(2,30));assert.ok(!validBirthday(4,31));assert.ok(validBirthday(12,31));
});
test('Feb 29 birthdays are celebrated on Feb 28 in non-leap years only',()=>{
  assert.ok(celebratedOn(11,8,'2026-11-08'));assert.ok(!celebratedOn(11,8,'2026-11-09'));
  assert.ok(celebratedOn(2,29,'2027-02-28'));assert.ok(!celebratedOn(2,29,'2028-02-28'));assert.ok(celebratedOn(2,29,'2028-02-29'));
});
test('one shout-out per day, role added then removed the next day, never repeated',async()=>{
  const db=new PGlite();const pool={query:db.query.bind(db)};
  const roles=new Map([['p1',new Set()],['p2',new Set()]]);const posts=[];
  const member=id=>({roles:{cache:{has:r=>roles.get(id).has(r)},add:async r=>roles.get(id).add(r),remove:async r=>roles.get(id).delete(r)}});
  const client={guilds:{fetch:async()=>({members:{fetch:async id=>{if(!roles.has(id))throw Object.assign(new Error('Unknown Member'),{code:10007});return member(id);}}})},
    channels:{fetch:async()=>({send:async p=>posts.push(p)})}};
  const b=new Birthdays(pool,client,{guildId:'g',channelId:'c',roleId:'1553500000000000001'});
  try{
    await b.init();
    await b.set('p1',11,8);await b.set('p2',11,8);await b.set('gone',11,8);await b.set('p3',12,25);
    await assert.rejects(b.set('p1',2,30),/invalid-date/);
    const day=new Date('2026-11-08T06:30:00Z'); // 12:30 AM Chicago
    assert.deepEqual((await b.run(day)).sort(),['p1','p2']);
    assert.equal(posts.length,1);assert.match(posts[0].content,/Happy birthday, <@p\d> and <@p\d>! Wickhaven raises a tankard/);
    assert.deepEqual(posts[0].allowedMentions.parse,[]);
    assert.ok(roles.get('p1').has('1553500000000000001'));
    assert.deepEqual(await b.run(new Date('2026-11-08T20:00:00Z')),[]);assert.equal(posts.length,1);
    await b.run(new Date('2026-11-09T06:10:00Z'));
    assert.ok(!roles.get('p1').has('1553500000000000001'));assert.equal(posts.length,1);
    assert.deepEqual(await b.get('p3'),{month:12,day:25});
    assert.equal(await b.remove('p3'),1);assert.equal(await b.get('p3'),null);
  }finally{await db.close();}
});
