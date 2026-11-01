import { Client, Events, GatewayIntentBits, Partials, MessageFlags } from 'discord.js';
import pg from 'pg';
import { TestLedger } from './store.js';
import { countWords } from './activity.js';
import { readFileSync } from 'node:fs';
import { ProxyTracker } from './proxy.js';

const { DISCORD_TOKEN, DISCORD_GUILD_ID, TEST_CHANNEL_ID } = process.env;
const savedTestMode = process.env.AP_TEST_MODE === 'true';
let pool;
let ledger;
if (savedTestMode) {
  if (!process.env.DATABASE_URL) { console.error('AP_TEST_MODE requires DATABASE_URL.'); process.exit(1); }
  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3, connectionTimeoutMillis: 15000 });
  pool.on('error', () => console.error('Database connection error; no credentials logged.'));
  ledger = new TestLedger(pool);
  try { await ledger.init(); } catch { console.error('Cannot initialize test ledger. Check DATABASE_URL and database access.'); await pool.end(); process.exit(1); }
}
if (!DISCORD_TOKEN || !/^\d{17,20}$/.test(DISCORD_GUILD_ID ?? '') || !/^\d{17,20}$/.test(TEST_CHANNEL_ID ?? '')) {
  console.error('Configure DISCORD_TOKEN, DISCORD_GUILD_ID and TEST_CHANNEL_ID.');
  process.exit(1);
}
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Message, Partials.Channel],
  allowedMentions: { parse: [] }
});
const recent = new Map();
const tracker = new ProxyTracker(JSON.parse(readFileSync(new URL('./brackets.json', import.meta.url), 'utf8')));
const timers = new Set();
const ownerCache = new Map();
async function trustedProxy(message) {
  const expected = process.env.TUPPERBOX_BOT_ID;
  if (!/^\d{17,20}$/.test(expected ?? '')) return { trusted: false, detail: 'TUPPERBOX_BOT_ID is missing or invalid in the running deployment.' };
  let cached = ownerCache.get(message.webhookId);
  if (!cached || cached.expires < Date.now()) {
    const hook = await message.fetchWebhook();
    cached = { ownerId: hook.owner?.id, expires: Date.now() + 60000 };
    ownerCache.set(message.webhookId, cached);
  }
  return { trusted: cached.ownerId === expected, detail: `Expected creator ID: ${expected}; actual creator ID: ${cached.ownerId ?? 'not supplied by Discord'}.` };
}
function isTest(message) { return message.guildId === DISCORD_GUILD_ID && message.channelId === TEST_CHANNEL_ID; }
async function report(text) {
  const channel = await client.channels.fetch(TEST_CHANNEL_ID);
  if (channel?.isTextBased()) await channel.send({ content: text, allowedMentions: { parse: [] } });
}
client.once(Events.ClientReady, async () => {
  console.log(`Ledger connected. Saved test AP: ${savedTestMode}. Real progression disabled.`);
  try {
    const guild = await client.guilds.fetch(DISCORD_GUILD_ID);
    await guild.commands.create({ name: 'ledger-ap', description: 'View your separate test AP balance' });
    await report(savedTestMode ? '**Saved AP test is online.** Matched Tupper messages in this channel earn TEST credit. Use /ledger-ap to check your balance. Real progression is unaffected.' : '**Ledger ownership test is online.** No AP is awarded.');
  }
  catch { console.error('Cannot post startup greeting; check test-channel permissions.'); }
});
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'ledger-ap') return;
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    if (interaction.guildId !== DISCORD_GUILD_ID || interaction.channelId !== TEST_CHANNEL_ID) return await interaction.editReply('Use this test command in the configured bot-testing channel.');
    if (!ledger) return await interaction.editReply('Saved AP testing is disabled.');
    const s = await ledger.status(DISCORD_GUILD_ID, interaction.user.id);
    await interaction.editReply(`**TEST ledger — not real progression**\nToday: ${s.today}/4 AP\nTotal: ${s.total} AP\nUnfinished words: ${s.remainder}/300\nActive days: ${s.active_days}\nDaily reset: midnight America/Chicago.`);
  } catch { console.error('AP status lookup failed.'); if (interaction.deferred) await interaction.editReply('The test balance could not be read. Please try again later.').catch(() => {}); }
});
client.on(Events.MessageCreate, async message => {
  if (!isTest(message) || message.author.id === client.user.id) return;
  if (message.author.bot && !message.webhookId) return;
  try {
    const words = countWords(message.content);
    recent.set(message.id, { expires: Date.now() + 120000 });
    if (!message.webhookId) tracker.original({ id: message.id, playerId: message.author.id, channelId: message.channelId, content: message.content, time: message.createdTimestamp });
    else {
      let trusted = false;
      let trustDetail = '';
      try { const verification = await trustedProxy(message); trusted = verification.trusted; trustDetail = verification.detail; }
      catch (error) {
        const code = Number.isInteger(error.code) ? error.code : 'unknown';
        trustDetail = `Webhook lookup failed (Discord code ${code}). Check Ledger's effective Manage Webhooks permission in this channel.`;
        console.error(`Webhook creator lookup failed; Discord code ${code}.`);
      }
      tracker.proxy({ id: message.id, channelId: message.channelId, content: message.content, time: message.createdTimestamp, trusted });
      const timer = setTimeout(async () => {
        timers.delete(timer);
        const result = tracker.resolve(message.id);
        const text = result.status === 'matched'
          ? `**Original/proxy match found** • ${words} words • Player ID: ${result.playerId}\nOriginal: ${result.originalId} • Proxy: ${result.proxyId}\nMatched by content, timing, deletion, and Tupperbox webhook creator. This is correlation evidence, not a direct ownership attestation. No AP awarded.`
          : `**Proxy held for review** • ${words} words • Reason: ${result.status}\n${result.status === 'untrusted-webhook' ? trustDetail + '\n' : ''}No player credited. No AP awarded.`;
        try {
          if (result.status === 'matched' && ledger) {
            const saved = await ledger.record({ guildId: DISCORD_GUILD_ID, playerId: result.playerId, originalId: result.originalId, proxyId: result.proxyId, words, time: message.createdTimestamp });
            await report(saved.duplicate ? '**Already recorded** — no duplicate test credit.' : `**TEST writing saved** • ${words} words • Player ID: ${result.playerId}\n+${saved.awarded} test AP • Today: ${saved.dailyAP}/4 • Word remainder: ${saved.remainder}/300\nUse /ledger-ap to check your saved test progress. Real progression is unaffected.`);
          } else await report(text);
        } catch { console.error('Ownership report or test-ledger write failed; no success claimed.'); await report('**Test credit not confirmed.** Database or reporting failed; check /ledger-ap before retrying.').catch(() => {}); }
      }, 2500);
      timers.add(timer);
      return;
    }
    await report(message.webhookId
      ? `**Proxy/webhook message** • ${words} words • Message ID: ${message.id}\nPlayer attribution: **unverified**. Display names do not prove ownership. No AP awarded.`
      : `**Original player message** • ${words} words • Message ID: ${message.id} • Player ID: ${message.author.id}\nNo AP awarded. If Tupperbox replaces it, its deletion should also be detected.`);
  } catch { console.error('Diagnostic message could not be sent; check channel permissions.'); }
});
client.on(Events.MessageDelete, async message => {
  if (!isTest(message) || !recent.has(message.id)) return;
  recent.delete(message.id);
  tracker.deleted(message.id);
  try { await report(`**Observed deletion** • Message ID: ${message.id}\nThis can occur when Tupperbox replaces an original. This alone does not establish proxy ownership.`); }
  catch { console.error('Deletion report could not be sent.'); }
});
const cleanup = setInterval(() => { tracker.expire(Date.now()); for (const [id, item] of recent) if (item.expires < Date.now()) recent.delete(id); }, 30000);
client.on(Events.Error, () => console.error('Discord connection error.'));
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { clearInterval(cleanup); for (const timer of timers) clearTimeout(timer); client.destroy(); process.exit(0); });
client.login(DISCORD_TOKEN).catch(() => { console.error('Discord login failed. Check the token and enabled intents.'); process.exit(1); });
