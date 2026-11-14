import { creditWriting, serverDay } from './activity.js';
import { UserError, registrationInput, adjustmentInput } from './admin.js';
import { CharacterStore, characterSchema } from './character-store.js';

export const awardSchema = `CREATE TABLE IF NOT EXISTS ledger_ap_awards (
  guild_id text NOT NULL, ref text NOT NULL, player_id text NOT NULL, day text NOT NULL,
  source text NOT NULL CHECK (source IN ('quest','gathering')), awarded integer NOT NULL CHECK (awarded BETWEEN 0 AND 1),
  detail text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (guild_id, ref))`;
// held: a quest milestone reached at the daily cap. It is paid on a later day
// (paid_day) the next time that day has room, before any new AP that day.
export const awardColumns = [
  `ALTER TABLE ledger_ap_awards ADD COLUMN IF NOT EXISTS held boolean NOT NULL DEFAULT false`,
  `ALTER TABLE ledger_ap_awards ADD COLUMN IF NOT EXISTS paid_day text`];

// Pay held milestones into `day` while it has room. Caller holds the player lock.
export async function settleHeld(db, guildId, playerId, day) {
  const held = (await db.query('SELECT ref FROM ledger_ap_awards WHERE guild_id=$1 AND player_id=$2 AND held AND day<$3 ORDER BY created_at, ref', [guildId, playerId, day])).rows;
  if (!held.length) return 0;
  await db.query('INSERT INTO ledger_test_days (guild_id,player_id,day) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [guildId, playerId, day]);
  let paid = 0;
  for (const { ref } of held) {
    const room = (await db.query('SELECT ap FROM ledger_test_days WHERE guild_id=$1 AND player_id=$2 AND day=$3', [guildId, playerId, day])).rows[0].ap < 4;
    if (!room) break;
    await db.query('UPDATE ledger_test_days SET ap=ap+1 WHERE guild_id=$1 AND player_id=$2 AND day=$3', [guildId, playerId, day]);
    await db.query('UPDATE ledger_ap_awards SET held=false, awarded=1, paid_day=$3 WHERE guild_id=$1 AND ref=$2', [guildId, ref, day]);
    paid++;
  }
  return paid;
}

export async function isApproved(db, guildId, playerId) {
  return (await db.query("SELECT 1 FROM ledger_test_characters WHERE guild_id=$1 AND player_id=$2 AND status='approved' LIMIT 1", [guildId, playerId])).rows.length > 0;
}

// Gameplay AP (quest milestones, daily gathering) under the shared 4 AP/day cap.
// Runs inside the caller's transaction. `ref` makes every award happen once:
// quest:<character>:<milestone> or gathering:<player>:<day>. At the cap, a
// quest milestone is held for a later day; daily gathering AP is simply not
// paid (it is a once-per-day allowance).
export async function awardGameplayAP(db, { guildId, playerId, source, ref, detail = '', time = Date.now() }) {
  const day = serverDay(new Date(time));
  await db.query('INSERT INTO ledger_test_players (guild_id,player_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [guildId, playerId]);
  await db.query('SELECT remainder FROM ledger_test_players WHERE guild_id=$1 AND player_id=$2 FOR UPDATE', [guildId, playerId]);
  const prior = (await db.query('SELECT awarded,day FROM ledger_ap_awards WHERE guild_id=$1 AND ref=$2', [guildId, ref])).rows[0];
  if (prior) return { duplicate: true, awarded: 0, day: prior.day };
  await settleHeld(db, guildId, playerId, day);
  await db.query('INSERT INTO ledger_test_days (guild_id,player_id,day) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [guildId, playerId, day]);
  const before = (await db.query('SELECT ap FROM ledger_test_days WHERE guild_id=$1 AND player_id=$2 AND day=$3', [guildId, playerId, day])).rows[0].ap;
  const awarded = before < 4 ? 1 : 0;
  if (awarded) await db.query('UPDATE ledger_test_days SET ap=ap+1 WHERE guild_id=$1 AND player_id=$2 AND day=$3', [guildId, playerId, day]);
  const held = !awarded && source === 'quest';
  await db.query('INSERT INTO ledger_ap_awards (guild_id,ref,player_id,day,source,awarded,detail,held) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [guildId, ref, playerId, day, source, awarded, detail.slice(0, 200), held]);
  return { duplicate: false, awarded, day, dailyAP: before + awarded, capped: !awarded, held };
}

export class TestLedger {
  // requireApproval: live mode. Only players with an approved character earn
  // writing AP or may register Tupper brackets.
  constructor(pool, { requireApproval = false } = {}) { this.pool = pool; this.requireApproval = requireApproval; this.characters = new CharacterStore(pool); }
  async init() {
    const db = await this.pool.connect();
    try {
      await db.query('BEGIN');
      await db.query(`CREATE TABLE IF NOT EXISTS ledger_test_players (
        guild_id text NOT NULL, player_id text NOT NULL,
        remainder integer NOT NULL DEFAULT 0 CHECK (remainder BETWEEN 0 AND 299),
        PRIMARY KEY (guild_id, player_id))`);
      await db.query(`CREATE TABLE IF NOT EXISTS ledger_test_days (
        guild_id text NOT NULL, player_id text NOT NULL, day text NOT NULL,
        ap integer NOT NULL DEFAULT 0 CHECK (ap BETWEEN 0 AND 4),
        PRIMARY KEY (guild_id, player_id, day))`);
      await db.query(`CREATE TABLE IF NOT EXISTS ledger_test_events (
        guild_id text NOT NULL, original_id text NOT NULL, proxy_id text NOT NULL,
        player_id text NOT NULL, day text NOT NULL, words integer NOT NULL,
        awarded integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (guild_id, original_id), UNIQUE (guild_id, proxy_id))`);
      await db.query(`CREATE TABLE IF NOT EXISTS ledger_proxy_registrations (
        guild_id text NOT NULL, player_id text NOT NULL, name_key text NOT NULL,
        name text NOT NULL, prefix text NOT NULL, suffix text NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (guild_id,player_id,name_key), UNIQUE (guild_id,player_id,prefix,suffix))`);
      await db.query(`CREATE TABLE IF NOT EXISTS ledger_test_adjustments (
        guild_id text NOT NULL, request_id text NOT NULL, moderator_id text NOT NULL,
        player_id text NOT NULL, day text NOT NULL, delta integer NOT NULL,
        before_ap integer NOT NULL, after_ap integer NOT NULL, reason text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (guild_id,request_id))`);
      await db.query('ALTER TABLE ledger_test_adjustments ADD COLUMN IF NOT EXISTS words integer');
      for (const sql of characterSchema) await db.query(sql);
      await db.query(awardSchema);
      for (const sql of awardColumns) await db.query(sql);
      await db.query('COMMIT');
    } catch (e) { await db.query('ROLLBACK'); throw e; }
    finally { db.release(); }
  }
  async register(guildId, playerId, name, prefix, suffix = '') {
    const input = registrationInput(name, prefix, suffix);
    if (this.requireApproval && !(await isApproved(this.pool, guildId, playerId))) throw new UserError('Register your Tupper brackets after your first character is approved. Submit one with /ledger-character submit.');
    try {
      await this.pool.query(`INSERT INTO ledger_proxy_registrations (guild_id,player_id,name_key,name,prefix,suffix)
        VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (guild_id,player_id,name_key)
        DO UPDATE SET name=EXCLUDED.name,prefix=EXCLUDED.prefix,suffix=EXCLUDED.suffix,updated_at=now()`,
      [guildId, playerId, input.name.toLowerCase(), input.name, input.prefix, input.suffix]);
    } catch (e) { if (e.code === '23505') throw new UserError('Those brackets are already registered to another name on your account. Update or remove that entry first.'); throw e; }
    return input;
  }
  async registrations(guildId, playerId) {
    return (await this.pool.query('SELECT name,prefix,suffix FROM ledger_proxy_registrations WHERE guild_id=$1 AND player_id=$2 ORDER BY name', [guildId,playerId])).rows;
  }
  async unregister(guildId, playerId, name) {
    return (await this.pool.query('DELETE FROM ledger_proxy_registrations WHERE guild_id=$1 AND player_id=$2 AND name_key=$3', [guildId,playerId,name.trim().toLowerCase()])).rowCount;
  }
  async adjust({ guildId, playerId, moderatorId, requestId, delta, day, reason, today = serverDay(new Date()) }) {
    ({ delta, day, reason } = adjustmentInput(delta, day, reason, today));
    const db = await this.pool.connect();
    try {
      await db.query('BEGIN');
      await db.query('INSERT INTO ledger_test_players (guild_id,player_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [guildId,playerId]);
      await db.query('SELECT remainder FROM ledger_test_players WHERE guild_id=$1 AND player_id=$2 FOR UPDATE', [guildId,playerId]);
      const prior = await db.query('SELECT before_ap,after_ap FROM ledger_test_adjustments WHERE guild_id=$1 AND request_id=$2', [guildId,requestId]);
      if (prior.rows.length) { await db.query('ROLLBACK'); return { duplicate: true, ...prior.rows[0] }; }
      await db.query('INSERT INTO ledger_test_days (guild_id,player_id,day) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [guildId,playerId,day]);
      const current = await db.query('SELECT ap FROM ledger_test_days WHERE guild_id=$1 AND player_id=$2 AND day=$3', [guildId,playerId,day]);
      const before = current.rows[0].ap;
      const after = before + delta;
      if (after < 0 || after > 4) throw new UserError(`That day has ${before} AP. The resulting daily balance must remain between 0 and 4.`);
      await db.query('UPDATE ledger_test_days SET ap=$4 WHERE guild_id=$1 AND player_id=$2 AND day=$3', [guildId,playerId,day,after]);
      await db.query(`INSERT INTO ledger_test_adjustments (guild_id,request_id,moderator_id,player_id,day,delta,before_ap,after_ap,reason)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [guildId,requestId,moderatorId,playerId,day,delta,before,after,reason]);
      await db.query('COMMIT');
      return { duplicate: false, before_ap: before, after_ap: after };
    } catch (e) { await db.query('ROLLBACK'); throw e; }
    finally { db.release(); }
  }
  // Staff word credit (e.g. a legitimate post that was held). Counts toward today
  // exactly like writing: fills the 300-word tally, awards AP, respects the cap.
  async adjustWords({ guildId, playerId, moderatorId, requestId, words, reason, time = Date.now() }) {
    if (!Number.isInteger(words) || words < 1 || words > 3000) throw new UserError('Credit 1 to 3,000 words.');
    reason = String(reason ?? '').trim();
    if (reason.length < 5 || reason.length > 300) throw new UserError('Provide a reason of 5–300 characters.');
    const day = serverDay(new Date(time));
    const db = await this.pool.connect();
    try {
      await db.query('BEGIN');
      await db.query('INSERT INTO ledger_test_players (guild_id,player_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [guildId,playerId]);
      const account = (await db.query('SELECT remainder FROM ledger_test_players WHERE guild_id=$1 AND player_id=$2 FOR UPDATE', [guildId,playerId])).rows[0];
      const prior = (await db.query('SELECT before_ap,after_ap,delta FROM ledger_test_adjustments WHERE guild_id=$1 AND request_id=$2', [guildId,requestId])).rows[0];
      if (prior) { await db.query('ROLLBACK'); return { duplicate: true, ...prior, awarded: prior.delta, remainder: account.remainder }; }
      await settleHeld(db, guildId, playerId, day);
      await db.query('INSERT INTO ledger_test_days (guild_id,player_id,day) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [guildId,playerId,day]);
      const before = (await db.query('SELECT ap FROM ledger_test_days WHERE guild_id=$1 AND player_id=$2 AND day=$3', [guildId,playerId,day])).rows[0].ap;
      const result = creditWriting({ remainder: account.remainder, dailyAP: before }, words);
      await db.query('UPDATE ledger_test_players SET remainder=$3 WHERE guild_id=$1 AND player_id=$2', [guildId,playerId,result.remainder]);
      await db.query('UPDATE ledger_test_days SET ap=$4 WHERE guild_id=$1 AND player_id=$2 AND day=$3', [guildId,playerId,day,result.dailyAP]);
      await db.query(`INSERT INTO ledger_test_adjustments (guild_id,request_id,moderator_id,player_id,day,delta,before_ap,after_ap,reason,words)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [guildId,requestId,moderatorId,playerId,day,result.awarded,before,result.dailyAP,reason,words]);
      await db.query('COMMIT');
      return { duplicate: false, awarded: result.awarded, before_ap: before, after_ap: result.dailyAP, remainder: result.remainder, capped: before === 4 };
    } catch (e) { await db.query('ROLLBACK'); throw e; }
    finally { db.release(); }
  }
  async audit(guildId, playerId) {
    return (await this.pool.query(`SELECT moderator_id,day,delta,before_ap,after_ap,reason,words,created_at
      FROM ledger_test_adjustments WHERE guild_id=$1 AND player_id=$2 ORDER BY created_at DESC,request_id DESC LIMIT 10`, [guildId,playerId])).rows;
  }
  async record({ guildId, playerId, originalId, proxyId, words, time }) {
    if (!Number.isInteger(words) || words < 0) throw new Error('Invalid words');
    const day = serverDay(new Date(time));
    const db = await this.pool.connect();
    try {
      await db.query('BEGIN');
      await db.query('INSERT INTO ledger_test_players (guild_id, player_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [guildId, playerId]);
      const account = await db.query('SELECT remainder FROM ledger_test_players WHERE guild_id=$1 AND player_id=$2 FOR UPDATE', [guildId, playerId]);
      const duplicate = await db.query('SELECT 1 FROM ledger_test_events WHERE guild_id=$1 AND (original_id=$2 OR proxy_id=$3)', [guildId, originalId, proxyId]);
      if (duplicate.rows.length) { await db.query('ROLLBACK'); return { duplicate: true }; }
      if (this.requireApproval && !(await isApproved(db, guildId, playerId))) { await db.query('ROLLBACK'); return { duplicate: false, ineligible: true, awarded: 0 }; }
      const latestDay = (await db.query('SELECT max(day) AS day FROM ledger_test_events WHERE guild_id=$1 AND player_id=$2', [guildId, playerId])).rows[0].day;
      if (!latestDay || day >= latestDay) await settleHeld(db, guildId, playerId, day);
      // Delayed older-day events cannot retroactively consume newer-day carryover.
      const latest = await db.query('SELECT max(day) AS day FROM ledger_test_events WHERE guild_id=$1 AND player_id=$2', [guildId, playerId]);
      if (latest.rows[0].day && day < latest.rows[0].day) throw new Error('Out-of-order day requires review');
      await db.query('INSERT INTO ledger_test_days (guild_id,player_id,day) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [guildId, playerId, day]);
      const daily = await db.query('SELECT ap FROM ledger_test_days WHERE guild_id=$1 AND player_id=$2 AND day=$3', [guildId, playerId, day]);
      const result = creditWriting({ remainder: account.rows[0].remainder, dailyAP: daily.rows[0].ap }, words);
      await db.query('INSERT INTO ledger_test_events (guild_id,original_id,proxy_id,player_id,day,words,awarded) VALUES ($1,$2,$3,$4,$5,$6,$7)', [guildId, originalId, proxyId, playerId, day, words, result.awarded]);
      await db.query('UPDATE ledger_test_players SET remainder=$3 WHERE guild_id=$1 AND player_id=$2', [guildId, playerId, result.remainder]);
      await db.query('UPDATE ledger_test_days SET ap=$4 WHERE guild_id=$1 AND player_id=$2 AND day=$3', [guildId, playerId, day, result.dailyAP]);
      await db.query('COMMIT');
      return { ...result, duplicate: false };
    } catch (e) { await db.query('ROLLBACK'); throw e; }
    finally { db.release(); }
  }
  async awardGameplay(args) {
    const db = await this.pool.connect();
    try { await db.query('BEGIN'); const r = await awardGameplayAP(db, args); await db.query('COMMIT'); return r; }
    catch (e) { await db.query('ROLLBACK'); throw e; } finally { db.release(); }
  }
  // Pay held milestones for one player, or (no playerId) every player with
  // held AP. Called by /ledger-ap and by the bot's hourly sweep.
  async settle(guildId, playerId = null, time = Date.now()) {
    const day = serverDay(new Date(time));
    const players = playerId ? [playerId] : (await this.pool.query('SELECT DISTINCT player_id FROM ledger_ap_awards WHERE guild_id=$1 AND held AND day<$2', [guildId, day])).rows.map(r => r.player_id);
    let paid = 0;
    for (const p of players) {
      const db = await this.pool.connect();
      try {
        await db.query('BEGIN');
        await db.query('INSERT INTO ledger_test_players (guild_id,player_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [guildId, p]);
        await db.query('SELECT remainder FROM ledger_test_players WHERE guild_id=$1 AND player_id=$2 FOR UPDATE', [guildId, p]);
        paid += await settleHeld(db, guildId, p, day);
        await db.query('COMMIT');
      } catch (e) { await db.query('ROLLBACK'); throw e; } finally { db.release(); }
    }
    return paid;
  }
  async status(guildId, playerId, time = Date.now()) {
    const result = await this.pool.query(`SELECT
      COALESCE((SELECT remainder FROM ledger_test_players WHERE guild_id=$1 AND player_id=$2),0) AS remainder,
      COALESCE((SELECT sum(ap) FROM ledger_test_days WHERE guild_id=$1 AND player_id=$2),0)::integer AS total,
      (SELECT count(*) FROM ledger_test_days WHERE guild_id=$1 AND player_id=$2 AND ap>0)::integer AS active_days,
      COALESCE((SELECT ap FROM ledger_test_days WHERE guild_id=$1 AND player_id=$2 AND day=$3),0) AS today,
      (SELECT count(*) FROM ledger_ap_awards WHERE guild_id=$1 AND player_id=$2 AND held)::integer AS held`, [guildId, playerId, serverDay(new Date(time))]);
    return result.rows[0];
  }
}
