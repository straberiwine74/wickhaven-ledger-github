// Respec requests: a player asks staff to change parts of an approved character.
// Each request gets a private review thread in the review channel
// (#character-submission), like new submissions: staff Approve or Request
// Changes, and the player can Resubmit. Approval doesn't edit the sheet; the
// player makes the approved changes and runs !update.
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, MessageFlags } from 'discord.js';
import { UserError } from './admin.js';
import { card, message, notice, clean } from './ui.js';
import { canReview } from './review-interactions.js';

export const respecSchema = [
  `CREATE TABLE IF NOT EXISTS ledger_respec_requests (
    id text PRIMARY KEY, guild_id text NOT NULL, player_id text NOT NULL, name_key text NOT NULL, name text NOT NULL,
    changes text NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    revision integer NOT NULL DEFAULT 1, note text, moderator_id text, thread_id text, message_id text,
    created_at timestamptz NOT NULL DEFAULT now(), decided_at timestamptz)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS ledger_respec_open ON ledger_respec_requests (guild_id,player_id,name_key) WHERE status IN ('pending','rejected')`
];
const STATUS = { pending: 'Pending review', approved: 'Approved', rejected: 'Changes requested' };
const SHORT = { pending: 'Pending', approved: 'Approved', rejected: 'Changes requested' };
export const respecThreadName = r => `${clean(r.name).slice(0, 60)} · Respec · ${SHORT[r.status]}`.slice(0, 100);

export class RespecStore {
  constructor(pool) { this.pool = pool; }
  async init() { for (const sql of respecSchema) await this.pool.query(sql); }
  async get(id) {
    const r = (await this.pool.query('SELECT * FROM ledger_respec_requests WHERE id=$1', [id])).rows[0];
    if (!r) throw new UserError('That respec request was not found.');
    return r;
  }
  // New request, or an update to the character's open one (pending or changes requested).
  async request(guildId, playerId, name, changes, id) {
    changes = String(changes ?? '').trim();
    if (changes.length < 10 || changes.length > 1000) throw new UserError('Describe the changes in 10 to 1,000 characters.');
    const key = name.trim().toLowerCase();
    const c = (await this.pool.query('SELECT name,status FROM ledger_test_characters WHERE guild_id=$1 AND player_id=$2 AND name_key=$3', [guildId, playerId, key])).rows[0];
    if (!c) throw new UserError('No character with that name belongs to your account. Check `/ledger-character list`.');
    if (c.status !== 'approved') throw new UserError('Only approved characters can be respecced.');
    const open = (await this.pool.query("SELECT * FROM ledger_respec_requests WHERE guild_id=$1 AND player_id=$2 AND name_key=$3 AND status IN ('pending','rejected')", [guildId, playerId, key])).rows[0];
    if (open) {
      return { ...(await this.pool.query("UPDATE ledger_respec_requests SET changes=$2,status='pending',revision=revision+1 WHERE id=$1 RETURNING *", [open.id, changes])).rows[0], updated: true };
    }
    return (await this.pool.query('INSERT INTO ledger_respec_requests (id,guild_id,player_id,name_key,name,changes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [id, guildId, playerId, key, c.name, changes])).rows[0];
  }
  async decide(id, moderatorId, decision, note, expectedRevision) {
    if (!['approved', 'rejected'].includes(decision)) throw new UserError('Invalid decision.');
    note = String(note ?? '').trim();
    if (decision === 'rejected' && (note.length < 5 || note.length > 500)) throw new UserError('Explain the changes needed in 5 to 500 characters.');
    if (note.length > 500) throw new UserError('Keep the note under 500 characters.');
    const r = await this.get(id);
    if (r.revision !== expectedRevision) throw new UserError('This request changed after you opened it. Review the latest version.');
    if (r.status !== 'pending') throw new UserError(`That respec request is already ${STATUS[r.status].toLowerCase()}.`);
    return (await this.pool.query('UPDATE ledger_respec_requests SET status=$2,note=$3,moderator_id=$4,decided_at=now() WHERE id=$1 RETURNING *', [id, decision, note || null, moderatorId])).rows[0];
  }
  async resubmit(id, playerId, expectedRevision) {
    const r = await this.get(id);
    if (r.player_id !== playerId) throw new UserError('Only the player who asked for this respec can resubmit it.');
    if (r.status !== 'rejected') throw new UserError('Resubmitting is only available after staff request changes.');
    if (r.revision !== expectedRevision) throw new UserError('This request changed. Use the latest version.');
    return (await this.pool.query("UPDATE ledger_respec_requests SET status='pending',revision=revision+1 WHERE id=$1 RETURNING *", [id])).rows[0];
  }
  async setPost(id, threadId, messageId) {
    await this.pool.query('UPDATE ledger_respec_requests SET thread_id=$2,message_id=$3 WHERE id=$1', [id, threadId, messageId]);
  }
}

export function respecPayload(r, roleId, { welcome = false } = {}) {
  const fields = [{ name: 'Requested changes', value: clean(r.changes).slice(0, 1024) }];
  if (r.note) fields.push({ name: r.status === 'rejected' ? '✏️ Changes requested by staff' : 'Staff note', value: clean(r.note).slice(0, 1024) });
  if (r.status === 'rejected') fields.push({ name: 'Player next step', value: 'Adjust your request, then click **Resubmit Changes**. To change the wording, run `/ledger-character respec` again with the same name.' });
  if (r.status === 'approved') fields.push({ name: 'Player next step', value: 'Make the approved changes on your D&D Beyond sheet, then run `!update` in #bot-spam.' });
  fields.push({ name: '✅ Staff check', value: 'Respecs fix choices that no longer fit, not routine min-maxing. Check the new choices against the 2024 rules and creation guidelines.' });
  const embed = card({ title: `🔁 Respec request: ${r.name}`, description: `**Status: ${STATUS[r.status]}**\nPlayer: <@${r.player_id}>`, tone: { pending: 'pending', approved: 'success', rejected: 'warning' }[r.status], fields, footer: `Respec ${r.id} • Revision ${r.revision}` });
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`respec:approve:${r.id}:${r.revision}`).setLabel('Approve').setStyle(ButtonStyle.Success).setDisabled(r.status !== 'pending'),
    new ButtonBuilder().setCustomId(`respec:changes:${r.id}:${r.revision}`).setLabel('Request Changes').setStyle(ButtonStyle.Secondary).setDisabled(r.status !== 'pending'),
    new ButtonBuilder().setCustomId(`respec:resubmit:${r.id}:${r.revision}`).setLabel('Resubmit Changes').setStyle(ButtonStyle.Primary).setDisabled(r.status !== 'rejected'));
  const hello = welcome ? `<@${r.player_id}>, this private thread is for your respec request. Only you and staff can see it.\n` : '';
  return { content: hello + (r.status === 'pending' ? `<@&${roleId}> — a respec request is ready for review.` : 'Respec review completed.'), embeds: [embed], components: [row], allowedMentions: { parse: [], roles: r.status === 'pending' ? [roleId] : [], users: welcome ? [r.player_id] : [] } };
}

export class Respecs {
  constructor(pool, client, { guildId, channelId, roleId }) { this.store = new RespecStore(pool); Object.assign(this, { client, guildId, channelId, roleId }); }
  init() { return this.store.init(); }
  // Creates or updates the request's private thread. `event` adds a follow-up message.
  async publish(r, event = null) {
    const channel = await this.client.channels.fetch(this.channelId).catch(() => null);
    if (channel?.type !== ChannelType.GuildText) throw new UserError('The review channel isn’t set up. Ask an administrator.');
    let thread = r.thread_id ? await this.client.channels.fetch(r.thread_id).catch(() => null) : null;
    let msg = null;
    if (!thread) {
      thread = await channel.threads.create({ name: respecThreadName(r), type: ChannelType.PrivateThread, invitable: false, autoArchiveDuration: 10080, reason: 'Respec review' });
      await thread.members.add(r.player_id).catch(() => console.error('The player could not be added to their respec thread.'));
      msg = await thread.send(respecPayload(r, this.roleId, { welcome: true }));
      await this.store.setPost(r.id, thread.id, msg.id);
      return `https://discord.com/channels/${this.guildId}/${thread.id}`;
    }
    if (thread.archived) await thread.setArchived(false).catch(() => {});
    if (thread.name !== respecThreadName(r)) await thread.setName(respecThreadName(r)).catch(() => {});
    msg = r.message_id ? await thread.messages.fetch(r.message_id).catch(() => null) : null;
    if (msg) await msg.edit({ ...respecPayload(r, this.roleId), content: msg.content, allowedMentions: { parse: [] } });
    if (event === 'pending') await thread.send({ content: `<@&${this.roleId}> — updated respec request ready for review (revision ${r.revision}).`, allowedMentions: { parse: [], roles: [this.roleId], users: [] } });
    if (event === 'approved') await thread.send({ content: `✅ Respec approved! <@${r.player_id}>, make the changes on your D&D Beyond sheet, then run \`!update\` in #bot-spam.${r.note ? `\n> ${clean(r.note)}` : ''}`, allowedMentions: { parse: [], users: [r.player_id] } });
    if (event === 'rejected') await thread.send({ content: `✏️ <@${r.player_id}>, staff asked for changes to your respec request:\n> ${clean(r.note ?? '')}\nAdjust it, then click **Resubmit Changes** above, or run \`/ledger-character respec\` again with new details.`, allowedMentions: { parse: [], users: [r.player_id] } });
    return `https://discord.com/channels/${this.guildId}/${thread.id}`;
  }
}

// Buttons and modals for respec threads. Returns true when it handled the interaction.
export async function respecInteraction(interaction, ledger, guildId) {
  const button = interaction.isButton?.() && interaction.customId?.match(/^respec:(approve|changes|resubmit):(\d{1,20}):(\d+)$/);
  const modal = interaction.isModalSubmit?.() && interaction.customId?.match(/^respec-decision:(approve|changes):(\d{1,20}):(\d+)$/);
  if (!button && !modal) return false;
  const respecs = ledger?.respecs;
  const fail = async e => {
    const payload = notice('Respec not confirmed', e instanceof UserError ? e.message : 'The respec couldn’t be confirmed. Check the thread before trying again.');
    if (interaction.deferred || interaction.replied) await interaction.editReply(payload).catch(() => {});
    else await interaction.reply({ ...payload, flags: MessageFlags.Ephemeral }).catch(() => {});
  };
  try {
    if (!respecs || interaction.guildId !== guildId) throw new UserError('Respecs aren’t set up.');
    const [, action, id, rev] = button || modal;
    if (button && action === 'resubmit') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const r = await respecs.store.resubmit(id, interaction.user.id, Number(rev));
      await respecs.publish(r, 'pending');
      await interaction.editReply(message(card({ title: `🔁 Resubmitted: ${clean(r.name)}`, description: 'Your respec request is back with staff, and they’ve been alerted.', tone: 'pending' })));
      return true;
    }
    if (!canReview(interaction)) throw new UserError('Only administrators and configured Moderators can review respecs.');
    if (button) {
      const input = new TextInputBuilder().setCustomId('note').setStyle(TextInputStyle.Paragraph).setMaxLength(500)
        .setLabel(action === 'approve' ? 'Note to the player (optional)' : 'What needs to change?').setRequired(action !== 'approve');
      if (action !== 'approve') input.setMinLength(5);
      await interaction.showModal(new ModalBuilder().setCustomId(`respec-decision:${action}:${id}:${rev}`).setTitle(action === 'approve' ? 'Approve respec' : 'Request respec changes').addComponents(new ActionRowBuilder().addComponents(input)));
      return true;
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const decision = action === 'approve' ? 'approved' : 'rejected';
    const r = await respecs.store.decide(id, interaction.user.id, decision, interaction.fields.getTextInputValue('note'), Number(rev));
    let extra = '';
    try { await respecs.publish(r, decision); } catch { extra = ' The decision is saved, but the thread couldn’t be updated.'; }
    await interaction.editReply(message(card({ title: decision === 'approved' ? `✅ Respec approved: ${clean(r.name)}` : `✏️ Changes requested: ${clean(r.name)}`, description: `The player has been notified in the thread.${extra}`, tone: decision === 'approved' ? 'success' : 'warning' })));
    return true;
  } catch (e) { await fail(e); return true; }
}
