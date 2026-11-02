import { Client, Events, GatewayIntentBits, Partials, MessageFlags } from 'discord.js';
import pg from 'pg';
import { TestLedger } from './store.js';
import { countWords } from './activity.js';
import { ProxyTracker } from './proxy.js';
import { commands, handleCommand } from './commands.js';
import { UserError } from './admin.js';
import { ReviewPosts } from './review-posts.js';
import { reviewInteraction } from './review-interactions.js';
import { CharacterNotifications } from './character-notifications.js';
import { installQuests } from './quest-discord.js';
import { card, message as payload, notice } from './ui.js';
import { liveConfig, earnsWritingAP, gatheringKind, gatheringCommand, avraeError } from './live.js';

const { DISCORD_TOKEN, DISCORD_GUILD_ID, TEST_CHANNEL_ID } = process.env;
const live = liveConfig();
const savedTestMode = process.env.AP_TEST_MODE === 'true' || live.live;
let pool;
let ledger;
if (savedTestMode) {
  if (!process.env.DATABASE_URL) { console.error('AP_TEST_MODE or LEDGER_LIVE requires DATABASE_URL.'); process.exit(1); }
  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3, connectionTimeoutMillis: 15000 });
  pool.on('error', () => console.error('Database connection error; no credentials logged.'));
  ledger = new TestLedger(pool, { requireApproval: live.live });
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
if (process.env.QUEST_TEST_ENABLED === 'true' || live.live) {
  if (!pool || !/^\d{17,20}$/.test(process.env.AVRAE_BOT_ID??'') || !/^\d{17,20}$/.test(process.env.QUEST_TEST_CHANNEL_ID??'')) {
    console.error('Quest test requires saved AP test mode, AVRAE_BOT_ID and QUEST_TEST_CHANNEL_ID.'); process.exit(1);
  }
  // QUEST_CHANNEL_ID (optional): player departures channel for quests marked live.
  const liveChannel = /^\d{17,20}$/.test(process.env.QUEST_CHANNEL_ID ?? '') ? process.env.QUEST_CHANNEL_ID : null;
  await installQuests(client,pool,{guild:DISCORD_GUILD_ID,channel:process.env.QUEST_TEST_CHANNEL_ID,liveChannel,avrae:process.env.AVRAE_BOT_ID});
}
if(ledger&&process.env.CHARACTERS_CHANNEL_ID&&process.env.MODERATOR_ROLE_IDS){
  ledger.reviewPosts=new ReviewPosts(pool,client,DISCORD_GUILD_ID,process.env.CHARACTERS_CHANNEL_ID,process.env.MODERATOR_ROLE_IDS.split(',')[0].trim());
}
if(ledger)ledger.notifications=new CharacterNotifications(pool,client,DISCORD_GUILD_ID);
let publishing=false;
async function publishPending(){
  if(publishing||!ledger?.reviewPosts||!client.isReady())return;
  publishing=true;
  try{await ledger.reviewPosts.retryPending();await ledger.notifications?.retryPending();}catch{console.error('Character-review publishing could not complete.');}finally{publishing=false;}
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
// TEST mode: only #bot-testing. LIVE: every in-character channel not excluded in live.js.
function isTracked(message) { return live.live ? earnsWritingAP(message, live, DISCORD_GUILD_ID) : message.guildId === DISCORD_GUILD_ID && message.channelId === TEST_CHANNEL_ID; }
const link = (channelId, messageId) => `https://discord.com/channels/${DISCORD_GUILD_ID}/${channelId}/${messageId}`;
async function report(payload) {
  const target = live.live ? live.log : TEST_CHANNEL_ID;
  if (!target) return;
  const channel = await client.channels.fetch(target);
  if (channel?.isTextBased()) await channel.send(typeof payload === 'string' ? notice(null, payload, 'neutral') : payload);
}
client.once(Events.ClientReady, async () => {
  console.log(`Ledger connected. Mode: ${live.live ? 'LIVE' : savedTestMode ? 'saved TEST AP' : 'ownership test'}.`);
  try {
    const guild = await client.guilds.fetch(DISCORD_GUILD_ID);
    for (const command of commands) await guild.commands.create(command);
    await report(live.live ? notice('📒 The Ledger is online', `**Live AP is on.** Tupper posts in in-character channels earn AP for approved players. This channel logs awards and messages held for review.${live.hunting || live.mining ? '' : '\nHunting/mining AP is off: set HUNTING_CHANNEL_ID and MINING_CHANNEL_ID.'}`, 'success') : savedTestMode ? notice('📒 The Ledger is online', 'Matched Tupper messages in this channel earn **TEST** AP. Use `/ledger-ap` to check your balance. Real progression is unaffected.', 'info') : notice('📒 The Ledger is online', 'Ownership test mode. No AP is awarded.', 'neutral'));
  }
  catch { console.error('Cannot post startup greeting; check test-channel permissions.'); }
  void publishPending();
});
client.on(Events.InteractionCreate, async interaction => {
  if(interaction.customId?.startsWith('quest:')) return;
  if(interaction.isButton()||interaction.isModalSubmit()){
    await reviewInteraction(interaction,ledger,DISCORD_GUILD_ID);return;
  }
  if (!interaction.isChatInputCommand() || !commands.some(c => c.name === interaction.commandName)) return;
  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const characterCommand=['ledger-character','ledger-review','ledger-approve','ledger-reject'].includes(interaction.commandName);
    const inReviews=process.env.CHARACTERS_CHANNEL_ID&&(interaction.channelId===process.env.CHARACTERS_CHANNEL_ID||interaction.channel?.parentId===process.env.CHARACTERS_CHANNEL_ID);
    if (interaction.guildId !== DISCORD_GUILD_ID || (!live.live && interaction.channelId !== TEST_CHANNEL_ID&&!(characterCommand&&inReviews))) return await interaction.editReply(notice('Wrong channel', 'Use this command in bot-testing, or use character commands inside the character review forum.', 'neutral'));
    if (!ledger) return await interaction.editReply(notice('Ledger offline', 'Saved AP testing is turned off right now.', 'neutral'));
    const result = await handleCommand(interaction,ledger,DISCORD_GUILD_ID);
    await interaction.editReply(typeof result === 'string' ? notice(null, result, 'info') : result);
  } catch (error) { console.error('Ledger command did not complete.'); if (interaction.deferred) await interaction.editReply(notice('Command not confirmed', error instanceof UserError ? error.message : 'The command couldn\u2019t be confirmed. Check your balance or audit history before trying again.')).catch(() => {}); }
});
// Gathering: a player's !mine or !hunt end, confirmed by Avrae's next non-error
// reply in that channel, earns 1 AP per player per day (shared 4 AP cap).
const gatherings = new Map();
async function gathering(message) {
  const kind = gatheringKind(message, live);
  if (!kind || !ledger) return;
  const queue = gatherings.get(message.channelId) ?? [];
  const now = Date.now();
  while (queue.length && now - queue[0].time > 20000) queue.shift();
  if (!message.author.bot && gatheringCommand(message.content, kind)) { queue.push({ playerId: message.author.id, messageId: message.id, time: message.createdTimestamp }); gatherings.set(message.channelId, queue); return; }
  if (message.author.id !== process.env.AVRAE_BOT_ID || !queue.length) return;
  const replyTo = message.reference?.messageId;
  const index = replyTo ? queue.findIndex(q => q.messageId === replyTo) : 0;
  if (index < 0) return;
  const [attempt] = queue.splice(index, 1);
  if (avraeError(message)) return;
  try {
    const approved = (await pool.query("SELECT 1 FROM ledger_test_characters WHERE guild_id=$1 AND player_id=$2 AND status='approved' LIMIT 1", [DISCORD_GUILD_ID, attempt.playerId])).rows.length;
    if (!approved) return;
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(attempt.time));
    const r = await ledger.awardGameplay({ guildId: DISCORD_GUILD_ID, playerId: attempt.playerId, source: 'gathering', ref: `gathering:${attempt.playerId}:${day}`, detail: kind, time: attempt.time });
    if (!r.duplicate) await report(payload(card({ title: kind === 'hunting' ? '🏹 Hunt completed' : '⛏️ Mining attempt', description: `<@${attempt.playerId}> • [Avrae result](${link(message.channelId, message.id)})`, tone: r.awarded ? 'success' : 'neutral', fields: [{ name: 'AP', value: r.awarded ? '+1 (daily gathering AP)' : 'Daily 4 AP cap reached; recorded without AP', inline: true }, { name: 'Today', value: `${r.dailyAP} / 4 AP`, inline: true }] })));
  } catch { console.error('Gathering AP could not be confirmed.'); }
}
client.on(Events.MessageCreate, async message => {
  if (live.live && message.guildId === DISCORD_GUILD_ID && message.author.id !== client.user.id) void gathering(message);
  if (!isTracked(message) || message.author.id === client.user.id) return;
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
        try {
          if (result.status === 'matched' && ledger) {
            const saved = await ledger.record({ guildId: DISCORD_GUILD_ID, playerId: result.playerId, originalId: result.originalId, proxyId: result.proxyId, words, time: message.createdTimestamp });
            const where = `[message](${link(message.channelId, result.proxyId)})`;
            if (saved.ineligible) await report(notice('🔎 No AP: no approved character', `<@${result.playerId}> • **${words}** words • ${where}\nThis player has no approved character yet, so nothing was credited.`, 'warning'));
            else if (saved.duplicate) { if (!live.live) await report(notice('Already recorded', 'This message was already counted. No duplicate credit.', 'neutral')); }
            // Live: log only posts that earned AP; word progress is visible in /ledger-ap.
            else if (!live.live || saved.awarded) await report(payload(card({ title: '✍️ Writing saved', description: `<@${result.playerId}> • **${words}** words${live.live ? ' • ' + where : ''}`, tone: 'success', fields: [
              { name: 'AP earned', value: `+${saved.awarded}`, inline: true }, { name: 'Today', value: `${saved.dailyAP} / 4 AP`, inline: true }, { name: 'Toward next AP', value: `${saved.remainder} / 300 words`, inline: true }] })));
          } else if (!live.live || !['untrusted-webhook', 'duplicate'].includes(result.status)) await report(notice('🔎 Message held for review', `${words} words • Reason: **${result.status}**${result.status === 'untrusted-webhook' ? '\n' + trustDetail : ''}${live.live ? ' • [message](' + link(message.channelId, message.id) + ')' : ''}\nNo player was credited and no AP was awarded.`, 'warning'));
        } catch { console.error('Ownership report or test-ledger write failed; no success claimed.'); await report(notice('Credit not confirmed', 'The database or report failed. Check `/ledger-ap` before trying again.')).catch(() => {}); }
      }, 2500);
      timers.add(timer);
      return;
    }
  } catch { console.error('Diagnostic message could not be sent; check channel permissions.'); }
});
client.on(Events.MessageDelete, async message => {
  if (message.guildId !== DISCORD_GUILD_ID || !recent.has(message.id)) return;
  recent.delete(message.id);
  tracker.deleted(message.id);
});
const cleanup = setInterval(() => { tracker.expire(Date.now()); for (const [id, item] of recent) if (item.expires < Date.now()) recent.delete(id); }, 30000);
client.on(Events.Error, () => console.error('Discord connection error.'));
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { clearInterval(cleanup); clearInterval(publicationTimer); for (const timer of timers) clearTimeout(timer); client.destroy(); process.exit(0); });
client.login(DISCORD_TOKEN).catch(() => { console.error('Discord login failed. Check the token and enabled intents.'); process.exit(1); });
