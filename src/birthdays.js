// /birthday: players save a month and day (no year). Shortly after midnight
// Chicago time, the Ledger posts one shout-out for everyone with a birthday
// that day and gives them the Birthday role, which comes off the next day.
// Feb 29 birthdays are celebrated on Feb 28 in non-leap years.
// Settings: BIRTHDAY_CHANNEL_ID (defaults to #announcements), BIRTHDAY_ROLE_ID (optional).
import { MessageFlags } from 'discord.js';
import { serverDay } from './activity.js';
import { card, message, notice } from './ui.js';

export const BIRTHDAY_CHANNEL_ID = process.env.BIRTHDAY_CHANNEL_ID || '1553528903182585896';
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_IN = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const birthdayCommand = {
  name: 'birthday',
  description: 'Save your birthday for a shout-out in Wickhaven',
  options: [
    { type: 1, name: 'set', description: 'Save or change your birthday (month and day only)', options: [
      { type: 4, name: 'month', description: 'Month', required: true, choices: MONTHS.map((name, i) => ({ name, value: i + 1 })) },
      { type: 4, name: 'day', description: 'Day of the month', required: true, min_value: 1, max_value: 31 }] },
    { type: 1, name: 'view', description: 'See the birthday you have saved' },
    { type: 1, name: 'remove', description: 'Remove your birthday' }
  ]
};

export const birthdaySchema = [
  `CREATE TABLE IF NOT EXISTS ledger_birthdays (guild_id text NOT NULL, player_id text NOT NULL,
    month integer NOT NULL CHECK (month BETWEEN 1 AND 12), day integer NOT NULL CHECK (day BETWEEN 1 AND 31),
    PRIMARY KEY (guild_id, player_id))`,
  `CREATE TABLE IF NOT EXISTS ledger_birthday_celebrations (guild_id text NOT NULL, player_id text NOT NULL, day text NOT NULL,
    role_given boolean NOT NULL DEFAULT false, role_removed boolean NOT NULL DEFAULT false, PRIMARY KEY (guild_id, player_id, day))`
];

export const validBirthday = (month, day) => Number.isInteger(month) && Number.isInteger(day) && month >= 1 && month <= 12 && day >= 1 && day <= DAYS_IN[month - 1];
export const formatBirthday = (month, day) => `${MONTHS[month - 1]} ${day}`;
const leap = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
// Is this saved birthday celebrated on `today` (YYYY-MM-DD, Chicago)?
export function celebratedOn(month, day, today) {
  const [y, m, d] = today.split('-').map(Number);
  if (month === m && day === d) return true;
  return month === 2 && day === 29 && m === 2 && d === 28 && !leap(y);
}

export class Birthdays {
  constructor(pool, client, { guildId, channelId = BIRTHDAY_CHANNEL_ID, roleId = process.env.BIRTHDAY_ROLE_ID }) {
    Object.assign(this, { pool, client, guildId, channelId, roleId: /^\d{17,20}$/.test(roleId ?? '') ? roleId : null });
  }
  async init() { for (const sql of birthdaySchema) await this.pool.query(sql); }
  async set(playerId, month, day) {
    if (!validBirthday(month, day)) throw new Error('invalid-date');
    await this.pool.query(`INSERT INTO ledger_birthdays (guild_id,player_id,month,day) VALUES ($1,$2,$3,$4)
      ON CONFLICT (guild_id,player_id) DO UPDATE SET month=EXCLUDED.month, day=EXCLUDED.day`, [this.guildId, playerId, month, day]);
  }
  async get(playerId) { return (await this.pool.query('SELECT month,day FROM ledger_birthdays WHERE guild_id=$1 AND player_id=$2', [this.guildId, playerId])).rows[0] ?? null; }
  async remove(playerId) { return (await this.pool.query('DELETE FROM ledger_birthdays WHERE guild_id=$1 AND player_id=$2', [this.guildId, playerId])).rowCount ?? 0; }

  // Slash command handler. Replies privately.
  async command(interaction) {
    const sub = interaction.options.getSubcommand();
    let payload;
    if (sub === 'set') {
      const month = interaction.options.getInteger('month', true), day = interaction.options.getInteger('day', true);
      if (!validBirthday(month, day)) payload = notice('Not a real date', `${MONTHS[month - 1]} doesn’t have a day ${day}. Try again.`, 'neutral');
      else { await this.set(interaction.user.id, month, day); payload = message(card({ title: '🎂 Birthday saved', description: `**${formatBirthday(month, day)}**. On your birthday, Wickhaven raises a tankard in your honor in <#${this.channelId}>.`, tone: 'success', footer: 'Only the month and day are saved. Use /birthday remove to opt out anytime.' })); }
    } else if (sub === 'view') {
      const b = await this.get(interaction.user.id);
      payload = message(card({ title: '🎂 Your birthday', description: b ? `**${formatBirthday(b.month, b.day)}**` : 'No birthday saved. Use `/birthday set` to add one.', tone: 'info' }));
    } else {
      const removed = await this.remove(interaction.user.id);
      payload = message(card({ title: removed ? 'Birthday removed' : 'Nothing to remove', description: removed ? 'You won’t get a birthday shout-out.' : 'You didn’t have a birthday saved.', tone: 'neutral' }));
    }
    await interaction.reply({ ...payload, flags: MessageFlags.Ephemeral });
  }

  // Runs every few minutes. Each birthday is celebrated once per day, even across restarts.
  async run(now = new Date()) {
    const today = serverDay(now);
    const guild = await this.client.guilds.fetch(this.guildId);
    // Take yesterday's (or older) birthday roles back off.
    if (this.roleId) {
      const old = (await this.pool.query('SELECT player_id,day FROM ledger_birthday_celebrations WHERE guild_id=$1 AND day<$2 AND role_given AND NOT role_removed', [this.guildId, today])).rows;
      for (const r of old) {
        const member = await guild.members.fetch(r.player_id).catch(() => null);
        if (member?.roles.cache.has(this.roleId)) await member.roles.remove(this.roleId, 'Birthday is over').catch(e => console.error(`Birthday role could not be removed (Discord ${e?.code ?? 'error'}).`));
        await this.pool.query('UPDATE ledger_birthday_celebrations SET role_removed=true WHERE guild_id=$1 AND player_id=$2 AND day=$3', [this.guildId, r.player_id, r.day]);
      }
    }
    const due = (await this.pool.query('SELECT player_id,month,day FROM ledger_birthdays WHERE guild_id=$1', [this.guildId])).rows.filter(b => celebratedOn(b.month, b.day, today));
    const celebrate = [];
    for (const b of due) {
      const claimed = (await this.pool.query('INSERT INTO ledger_birthday_celebrations (guild_id,player_id,day) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING player_id', [this.guildId, b.player_id, today])).rows.length;
      if (!claimed) continue;
      const member = await guild.members.fetch(b.player_id).catch(() => null);
      if (!member) continue; // left the server
      celebrate.push(b.player_id);
      if (this.roleId) await member.roles.add(this.roleId, 'Happy birthday').then(() => this.pool.query('UPDATE ledger_birthday_celebrations SET role_given=true WHERE guild_id=$1 AND player_id=$2 AND day=$3', [this.guildId, b.player_id, today]))
        .catch(e => console.error(`Birthday role could not be added (Discord ${e?.code ?? 'error'}). Check Manage Roles and that the Ledger's role is above the Birthday role.`));
    }
    if (!celebrate.length) return [];
    const names = celebrate.map(id => `<@${id}>`);
    const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
    const channel = await this.client.channels.fetch(this.channelId).catch(() => null);
    try {
      if (!channel?.send) throw Object.assign(new Error('Channel not visible'), { code: 50001 });
      await channel.send({ content: `🎂 Happy birthday, ${list}! Wickhaven raises a tankard in your honor today.`, allowedMentions: { parse: [], users: celebrate } });
    } catch (e) {
      // Un-claim so the next check (every 5 minutes) tries again once the channel is fixed.
      await this.pool.query('DELETE FROM ledger_birthday_celebrations WHERE guild_id=$1 AND day=$2 AND player_id = ANY($3)', [this.guildId, today, celebrate]);
      console.error(`Birthday shout-out could not be posted in ${this.channelId} (Discord ${e?.code ?? 'error'}). The Ledger needs View Channel and Send Messages there; it will retry in 5 minutes.`);
      return [];
    }
    return celebrate;
  }
}
