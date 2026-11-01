import { Client, Events, GatewayIntentBits, Partials, MessageFlags } from 'discord.js';
import pg from 'pg';
import { TestLedger } from './store.js';
import { countWords } from './activity.js';
import { ProxyTracker } from './proxy.js';
import { commands, handleCommand } from './commands.js';
import { UserError } from './admin.js';
import { ReviewPosts } from './review-posts.js';
import { reviewInteraction } from './review-interactions.js';

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
if(ledger&&process.env.CHARACTERS_CHANNEL_ID&&process.env.MODERATOR_ROLE_IDS){
  ledger.reviewPosts=new ReviewPosts(pool,client,DISCORD_GUILD_ID,process.env.CHARACTERS_CHANNEL_ID,process.env.MODERATOR_ROLE_IDS.split(',')[0].trim());
}
let publishing=false;
async function publishPending(){
  if(publishing||!ledger?.reviewPosts||!client.isReady())return;
  publishing=true;
  try{await ledger.reviewPosts.retryPending();}catch{console.error('Character-review publishing could not complete.');}finally{publishing=false;}
}
const publicationTimer=setInterval(()=>{void publishPending();},60000);
const recent = new Map();
const tracker = new ProxyTracker();
const bracketLookups = new Set();
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
    for (const command of commands) await guild.commands.create(command);
    await report(savedTestMode ? '**Saved AP test is online.** Matched Tupper messages in this channel earn TEST credit. Use /ledger-ap to check your balance. Real progression is unaffected.' : '**Ledger ownership test is online.** No AP is awarded.');
  }
  catch { console.error('Cannot post startup greeting; check test-channel permissions.'); }
  void publishPending();
});
client.on(Events.InteractionCreate, async interaction => {
  if(interaction.isButton()||interaction.isModalSubmit()){
    await reviewInteraction(interaction,ledger,DISCORD_GUILD_ID);return;
  }
  if (!interaction.isChatInputCommand() || !commands.some(c => c.name === interaction.commandName)) return;
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const characterCommand=['ledger-character','ledger-review','ledger-approve','ledger-reject'].includes(interaction.commandName);
    const inReviews=process.env.CHARACTERS_CHANNEL_ID&&(interaction.channelId===process.env.CHARACTERS_CHANNEL_ID||interaction.channel?.parentId===process.env.CHARACTERS_CHANNEL_ID);
    if (interaction.guildId !== DISCORD_GUILD_ID || (interaction.channelId !== TEST_CHANNEL_ID&&!(characterCommand&&inReviews))) return await interaction.editReply('Use this command in bot-testing, or use character commands inside the characters review forum.');
    if (!ledger) return await interaction.editReply('Saved AP testing is disabled.');
    await interaction.editReply({ content: await handleCommand(interaction,ledger,DISCORD_GUILD_ID), allowedMentions: { parse: [] } });
  } catch (error) { console.error('Ledger command did not complete.'); if (interaction.deferred) await interaction.editReply({ content: error instanceof UserError ? error.message : 'The command could not be confirmed. Check your balance or audit history before retrying.', allowedMentions: { parse: [] } }).catch(() => {}); }
});
client.on(Events.MessageCreate, async message => {
  if (!isTest(message) || message.author.id === client.user.id) return;
  if (message.author.bot && !message.webhookId) return;
  try {
    const words = countWords(message.content);
    recent.set(message.id, { expires: Date.now() + 120000 });
    if (!message.webhookId) {
      tracker.original({ id: message.id, playerId: message.author.id, channelId: message.channelId, content: message.content, time: message.createdTimestamp });
      if (ledger) {
        const task = ledger.registrations(DISCORD_GUILD_ID,message.author.id)
          .then(rows => tracker.addBrackets(message.id,message.content,rows))
          .catch(() => console.error('Bracket lookup failed; prefixed matches may require review.'));
        bracketLookups.add(task);
        task.finally(() => bracketLookups.delete(task));
      }
    }
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
        // Wait for original-message registrations even if deletion arrived first.
        await Promise.all([...bracketLookups]);
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
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { clearInterval(cleanup); clearInterval(publicationTimer); for (const timer of timers) clearTimeout(timer); client.destroy(); process.exit(0); });
client.login(DISCORD_TOKEN).catch(() => { console.error('Discord login failed. Check the token and enabled intents.'); process.exit(1); });
