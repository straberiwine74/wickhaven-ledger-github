import { Client, Events, GatewayIntentBits, Partials } from 'discord.js';
import { countWords } from './activity.js';
import { readFileSync } from 'node:fs';
import { ProxyTracker } from './proxy.js';

const { DISCORD_TOKEN, DISCORD_GUILD_ID, TEST_CHANNEL_ID } = process.env;
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
  if (!/^\d{17,20}$/.test(expected ?? '')) return false;
  let cached = ownerCache.get(message.webhookId);
  if (!cached || cached.expires < Date.now()) {
    const hook = await message.fetchWebhook();
    cached = { ownerId: hook.owner?.id, expires: Date.now() + 60000 };
    ownerCache.set(message.webhookId, cached);
  }
  return cached.ownerId === expected;
}
function isTest(message) { return message.guildId === DISCORD_GUILD_ID && message.channelId === TEST_CHANNEL_ID; }
async function report(text) {
  const channel = await client.channels.fetch(TEST_CHANNEL_ID);
  if (channel?.isTextBased()) await channel.send({ content: text, allowedMentions: { parse: [] } });
}
client.once(Events.ClientReady, async () => {
  console.log('Ledger connected in diagnostic mode. No AP is awarded or stored.');
  try { await report('**Ledger ownership test is online.** Send an ordinary message, then a Tupper message. No AP is awarded.'); }
  catch { console.error('Cannot post startup greeting; check test-channel permissions.'); }
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
      try { trusted = await trustedProxy(message); }
      catch { console.error('Cannot verify webhook creator; check Manage Webhooks in the test channel.'); }
      tracker.proxy({ id: message.id, channelId: message.channelId, content: message.content, time: message.createdTimestamp, trusted });
      const timer = setTimeout(async () => {
        timers.delete(timer);
        const result = tracker.resolve(message.id);
        const text = result.status === 'matched'
          ? `**Original/proxy match found** • ${words} words • Player ID: ${result.playerId}\nOriginal: ${result.originalId} • Proxy: ${result.proxyId}\nMatched by content, timing, deletion, and Tupperbox webhook creator. This is correlation evidence, not a direct ownership attestation. No AP awarded.`
          : `**Proxy held for review** • ${words} words • Reason: ${result.status}\nNo player credited. No AP awarded.`;
        try { await report(text); } catch { console.error('Cannot post ownership report.'); }
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
