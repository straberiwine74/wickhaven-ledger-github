import { Client, Events, GatewayIntentBits, Partials } from 'discord.js';
import { countWords } from './activity.js';

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
function isTest(message) { return message.guildId === DISCORD_GUILD_ID && message.channelId === TEST_CHANNEL_ID; }
async function report(text) {
  const channel = await client.channels.fetch(TEST_CHANNEL_ID);
  if (channel?.isTextBased()) await channel.send({ content: text, allowedMentions: { parse: [] } });
}
client.once(Events.ClientReady, async () => {
  console.log('Ledger connected in diagnostic mode. No AP is awarded or stored.');
  await report('**Ledger diagnostic mode is online.** Send an ordinary message, then a Tupper message. I report counts and message types only; no AP is awarded.');
});
client.on(Events.MessageCreate, async message => {
  if (!isTest(message) || message.author.id === client.user.id) return;
  if (message.author.bot && !message.webhookId) return;
  try {
    const words = countWords(message.content);
    recent.set(message.id, { expires: Date.now() + 120000 });
    await report(message.webhookId
      ? `**Proxy/webhook message** • ${words} words • Message ID: ${message.id}\nPlayer attribution: **unverified**. Display names do not prove ownership. No AP awarded.`
      : `**Original player message** • ${words} words • Message ID: ${message.id} • Player ID: ${message.author.id}\nNo AP awarded. If Tupperbox replaces it, its deletion should also be detected.`);
  } catch { console.error('Diagnostic message could not be sent; check channel permissions.'); }
});
client.on(Events.MessageDelete, async message => {
  if (!isTest(message) || !recent.has(message.id)) return;
  recent.delete(message.id);
  try { await report(`**Observed deletion** • Message ID: ${message.id}\nThis can occur when Tupperbox replaces an original. This alone does not establish proxy ownership.`); }
  catch { console.error('Deletion report could not be sent.'); }
});
const cleanup = setInterval(() => { for (const [id, item] of recent) if (item.expires < Date.now()) recent.delete(id); }, 30000);
client.on(Events.Error, () => console.error('Discord connection error.'));
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { clearInterval(cleanup); client.destroy(); process.exit(0); });
client.login(DISCORD_TOKEN).catch(() => { console.error('Discord login failed. Check the token and enabled intents.'); process.exit(1); });
