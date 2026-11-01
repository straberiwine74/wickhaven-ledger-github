import { creditWriting, serverDay } from './activity.js';

export class TestLedger {
  constructor(pool) { this.pool = pool; }
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
      await db.query('COMMIT');
    } catch (e) { await db.query('ROLLBACK'); throw e; }
    finally { db.release(); }
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
  async status(guildId, playerId, time = Date.now()) {
    const result = await this.pool.query(`SELECT
      COALESCE((SELECT remainder FROM ledger_test_players WHERE guild_id=$1 AND player_id=$2),0) AS remainder,
      COALESCE((SELECT sum(ap) FROM ledger_test_days WHERE guild_id=$1 AND player_id=$2),0)::integer AS total,
      (SELECT count(*) FROM ledger_test_days WHERE guild_id=$1 AND player_id=$2 AND ap>0)::integer AS active_days,
      COALESCE((SELECT ap FROM ledger_test_days WHERE guild_id=$1 AND player_id=$2 AND day=$3),0) AS today`, [guildId, playerId, serverDay(new Date(time))]);
    return result.rows[0];
  }
}
