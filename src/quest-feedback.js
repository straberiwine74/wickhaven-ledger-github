// /quest: anonymous star ratings for finished quests, run inside the quest's
// post in the quest-feedback forum. Posts the anonymous review in that post,
// sets the post's star tag to the rounded average, and logs the reviewer's
// name to a staff-only channel for audit. Running it again replaces the
// player's earlier review for that quest.
import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } from 'discord.js';
import { card, message, notice } from './ui.js';

const STARS = [1, 2, 3, 4, 5];
export const questFeedbackCommand = {
  name: 'quest',
  description: 'Rate a quest you played (use inside its quest-feedback post)',
  options: [{ type: 4, name: 'stars', description: 'How many stars, 1 to 5', required: true,
    choices: STARS.map(n => ({ name: '⭐'.repeat(n), value: n })) }]
};

export const questFeedbackSchema = [
  `CREATE TABLE IF NOT EXISTS ledger_quest_feedback (
    guild_id text NOT NULL, thread_id text NOT NULL, player_id text NOT NULL,
    stars integer NOT NULL CHECK (stars BETWEEN 1 AND 5), feedback text NOT NULL,
    public_message_id text, audit_message_id text,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (guild_id, thread_id, player_id))`
];

export const starLine = n => '⭐'.repeat(n) + '☆'.repeat(5 - n);
// "DM: Sam" (or "DM: @Sam") on its own line in the quest post's first message.
export function parseDm(text) {
  const m = /^\s*\**DM\**\s*:\s*\**\s*(.+?)\s*$/im.exec(String(text ?? ''));
  return m ? m[1].replace(/\*+$/, '').slice(0, 100) : null;
}
// Forum tags named ⭐ … ⭐⭐⭐⭐⭐ (spaces and variation selectors ignored).
export function starTags(availableTags = []) {
  const map = new Map();
  for (const t of availableTags) {
    const name = String(t.name ?? '').replace(/[\s️]/g, '');
    if (/^(⭐){1,5}$/u.test(name)) map.set([...name].length, t.id);
  }
  return map;
}
export function nextTags(applied = [], available = [], average) {
  const stars = starTags(available);
  const target = stars.get(Math.min(5, Math.max(1, Math.round(average))));
  const others = applied.filter(id => ![...stars.values()].includes(id));
  return { tags: target ? [...others, target].slice(-5) : others, found: Boolean(target) };
}

export class QuestFeedbackStore {
  constructor(pool) { this.pool = pool; }
  async init() { for (const sql of questFeedbackSchema) await this.pool.query(sql); }
  async get(guildId, threadId, playerId) {
    return (await this.pool.query('SELECT * FROM ledger_quest_feedback WHERE guild_id=$1 AND thread_id=$2 AND player_id=$3', [guildId, threadId, playerId])).rows[0] ?? null;
  }
  // Saves (or replaces) a review; returns the earlier row so its messages can be edited.
  async save(guildId, threadId, playerId, stars, feedback) {
    if (!STARS.includes(stars)) throw new Error('Invalid stars');
    const prior = await this.get(guildId, threadId, playerId);
    await this.pool.query(`INSERT INTO ledger_quest_feedback (guild_id,thread_id,player_id,stars,feedback) VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (guild_id,thread_id,player_id) DO UPDATE SET stars=EXCLUDED.stars, feedback=EXCLUDED.feedback, updated_at=now()`,
      [guildId, threadId, playerId, stars, feedback]);
    return prior;
  }
  async setMessages(guildId, threadId, playerId, publicId, auditId) {
    await this.pool.query('UPDATE ledger_quest_feedback SET public_message_id=$4, audit_message_id=$5 WHERE guild_id=$1 AND thread_id=$2 AND player_id=$3', [guildId, threadId, playerId, publicId, auditId]);
  }
  async average(guildId, threadId) {
    const r = (await this.pool.query('SELECT avg(stars)::float AS avg, count(*)::integer AS n FROM ledger_quest_feedback WHERE guild_id=$1 AND thread_id=$2', [guildId, threadId])).rows[0];
    return { average: r.n ? r.avg : 0, count: r.n };
  }
}

export function publicReview(stars, dm, feedback) {
  return { ...message(card({ title: starLine(stars), description: `${dm ? `**DM:** ${dm}\n\n` : ''}${feedback}`, tone: 'info', footer: 'Anonymous quest feedback' })), allowedMentions: { parse: [] } };
}
export function auditReview({ stars, dm, feedback, playerId, threadId, guildId, publicId, replaced }) {
  const fields = [
    { name: 'Player', value: `<@${playerId}>`, inline: true },
    { name: 'Quest', value: `<#${threadId}>`, inline: true },
    { name: 'DM', value: dm ?? 'Not listed', inline: true },
    { name: 'Review', value: `[Jump to review](https://discord.com/channels/${guildId}/${threadId}/${publicId})` },
    { name: 'Feedback', value: feedback }];
  return { ...message(card({ title: `${starLine(stars)} Quest feedback${replaced ? ' (updated)' : ''}`, tone: 'info', fields, footer: `ids:${threadId}:${playerId}:${publicId}` })), allowedMentions: { parse: [] } };
}

export class QuestFeedback {
  constructor(pool, client, { guildId, forumId, logId }) {
    this.store = new QuestFeedbackStore(pool);
    Object.assign(this, { client, guildId, forumId, logId });
  }
  init() { return this.store.init(); }
  inForum(interaction) {
    return interaction.guildId === this.guildId && interaction.channel?.isThread?.() && interaction.channel.parentId === this.forumId;
  }
  // Step 1: the slash command. A modal must be the first response, so no defer.
  async start(interaction) {
    if (!this.inForum(interaction)) {
      return interaction.reply({ ...notice('Use this inside a quest post', `Open the quest's post in <#${this.forumId}>, then run \`/quest\` there.`, 'neutral'), flags: MessageFlags.Ephemeral });
    }
    const stars = interaction.options.getInteger('stars', true);
    const prior = await this.store.get(this.guildId, interaction.channelId, interaction.user.id);
    const input = new TextInputBuilder().setCustomId('feedback').setLabel('Your feedback (posted anonymously)')
      .setStyle(TextInputStyle.Paragraph).setMinLength(10).setMaxLength(1000).setRequired(true)
      .setPlaceholder('What worked, what could be better, anything else for your DM');
    if (prior?.feedback) input.setValue(prior.feedback);
    const modal = new ModalBuilder().setCustomId(`qfb:${stars}`).setTitle(`${starLine(stars)} Quest feedback`)
      .addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
  }
  // Step 2: the modal. Save, post or edit the anonymous review, retag, log.
  async submit(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      if (!this.inForum(interaction)) throw new Error('wrong-channel');
      const stars = Number(interaction.customId.split(':')[1]);
      const feedback = interaction.fields.getTextInputValue('feedback').trim();
      const thread = interaction.channel;
      let dm = null;
      try { dm = parseDm((await thread.fetchStarterMessage())?.content); } catch {}
      const prior = await this.store.save(this.guildId, thread.id, interaction.user.id, stars, feedback);
      const pub = publicReview(stars, dm, feedback);
      let publicMsg = null;
      if (prior?.public_message_id) publicMsg = await thread.messages.edit(prior.public_message_id, pub).catch(() => null);
      if (!publicMsg) publicMsg = await thread.send(pub);
      const { average, count } = await this.store.average(this.guildId, thread.id);
      const { tags, found } = nextTags(thread.appliedTags ?? [], thread.parent?.availableTags ?? [], average);
      let tagNote = '';
      if (!found) tagNote = ' The star tag wasn’t updated: this forum has no ⭐ tags.';
      else await thread.setAppliedTags(tags).catch(() => { tagNote = ' The star tag couldn’t be updated (the Ledger needs Manage Threads here).'; });
      let auditId = prior?.audit_message_id ?? null;
      if (/^\d{17,20}$/.test(this.logId ?? '')) {
        const log = await this.client.channels.fetch(this.logId).catch(() => null);
        const audit = auditReview({ stars, dm, feedback, playerId: interaction.user.id, threadId: thread.id, guildId: this.guildId, publicId: publicMsg.id, replaced: Boolean(prior) });
        let sent = auditId ? await log?.messages.edit(auditId, audit).catch(() => null) : null;
        if (!sent) sent = await log?.send(audit).catch(() => null);
        auditId = sent?.id ?? auditId;
      }
      await this.store.setMessages(this.guildId, thread.id, interaction.user.id, publicMsg.id, auditId);
      await interaction.editReply(message(card({ title: prior ? '✏️ Feedback updated' : '✅ Feedback posted', description: `Your ${starLine(stars)} review is posted anonymously in this quest. The quest's average is **${average.toFixed(1)}** from ${count} review${count === 1 ? '' : 's'}.${tagNote}`, tone: 'success', footer: 'Run /quest again any time to replace your review.' })));
    } catch (error) {
      console.error('Quest feedback could not complete.');
      await interaction.editReply(notice('Feedback not posted', error?.message === 'wrong-channel' ? 'Use `/quest` inside a quest post in the quest-feedback forum.' : 'Your feedback couldn’t be confirmed. Try again, or tell a Moderator.')).catch(() => {});
    }
  }
}
