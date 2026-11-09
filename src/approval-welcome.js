// After staff approve a new character, the player gets a DM with their next
// steps: post in the character directory (using the pinned template), import
// into Avrae, and register Tupper brackets. If their DMs are closed, the same
// steps are posted in their private review thread instead.
// Settings: CHARACTER_DIRECTORY_ID (forum), DIRECTORY_TEMPLATE_URL (optional link
// to the template post), BOT_SPAM_CHANNEL_ID.
import { card, message, clean } from './ui.js';

export const CHARACTER_DIRECTORY_ID = process.env.CHARACTER_DIRECTORY_ID || '1568995973173219528';
export const BOT_SPAM_CHANNEL_ID = process.env.BOT_SPAM_CHANNEL_ID || '1553519169595646104';

export function approvalSteps(name, { directoryId = CHARACTER_DIRECTORY_ID, templateUrl = process.env.DIRECTORY_TEMPLATE_URL, botSpamId = BOT_SPAM_CHANNEL_ID } = {}) {
  const template = /^https:\/\/(www\.)?discord\.com\/channels\/\d+\/\d+(\/\d+)?$/.test(templateUrl ?? '') ? ` using [the template](${templateUrl})` : ' using the template in the forum’s post guidelines';
  return [
    { name: '1️⃣ Add them to the directory', value: `Open <#${directoryId}>, click **New Post**, and share ${clean(name)}${template}: sheet link, portrait, appearance, personality and backstory. Tag the post **Active**.` },
    { name: '2️⃣ Bring them into Avrae', value: `In <#${botSpamId}>: \`!import <sheet link>\`, then \`!classinfo\`, then \`!welcome\` for your starting goodies.` },
    { name: '3️⃣ Register your Tupper', value: 'Run `/ledger-tupper register` with the same brackets you use in Tupperbox, so your in-character writing earns AP.' },
    { name: '4️⃣ Go adventure', value: 'Grab a rumor, find a group in #looking-for-group, or set out alone with `!depart` in #solo-expeditions.' }
  ];
}

export function approvalWelcome(name, guildId, threadId, opts) {
  const fields = approvalSteps(name, opts);
  if (threadId) fields.push({ name: 'Your review thread', value: `https://discord.com/channels/${guildId}/${threadId}` });
  return message(card({ title: `🎉 ${clean(name)} is approved!`, description: 'Welcome to Wickhaven. You now have the **Adventurer** role and the rest of Thaleryn is open to you. Here’s what to do next:', tone: 'success', fields }));
}

// Never throws: the approval is already saved.
export async function sendApprovalWelcome({ client, pool, guildId, playerId, nameKey, name }) {
  let threadId = null, thread = null;
  try {
    threadId = (await pool.query('SELECT thread_id FROM ledger_test_review_posts WHERE guild_id=$1 AND player_id=$2 AND name_key=$3', [guildId, playerId, nameKey])).rows[0]?.thread_id ?? null;
    if (threadId) thread = await client.channels.fetch(threadId).catch(() => null);
  } catch {}
  const payload = approvalWelcome(name, guildId, threadId);
  try {
    const user = await client.users.fetch(playerId);
    await user.send(payload);
    return 'dm';
  } catch (e) {
    console.error(`Approval DM could not be sent to ${playerId} (Discord ${e?.code ?? 'error'}); posting next steps in the review thread.`);
    const sent = await thread?.send({ content: `<@${playerId}>, your DMs are closed, so here are your next steps:`, embeds: payload.embeds, allowedMentions: { parse: [], users: [playerId] } }).catch(() => null);
    return sent ? 'thread' : 'failed';
  }
}
