import { UserError, staffAllowed } from './admin.js';
import { serverDay } from './activity.js';
import { characterCommands, handleCharacterCommand } from './character-commands.js';

const stringOption = (name, description, required = true, max_length = 80) => ({ type: 3, name, description, required, max_length });
export const commands = [
  ...characterCommands,
  { name: 'ledger-ap', description: 'View your separate test AP balance' },
  { name: 'ledger-tupper', description: 'Register your own Tupper brackets with the Ledger', options: [
    { type: 1, name: 'register', description: 'Add or update your own bracket registration', options: [
      stringOption('name','Character label'), stringOption('prefix','Opening bracket, e.g. R:',false,32), stringOption('suffix','Closing bracket, if any',false,32)] },
    { type: 1, name: 'list', description: 'List your registrations' },
    { type: 1, name: 'remove', description: 'Remove one of your registrations', options: [stringOption('name','Registered character label')] }
  ] },
  { name: 'ledger-adjust', description: 'Staff: adjust TEST AP with a recorded reason', default_member_permissions: '0', options: [
    { type: 6, name: 'player', description: 'Player to adjust', required: true },
    { type: 4, name: 'change', description: 'AP to add or remove, -4 through +4', required: true, min_value: -4, max_value: 4 },
    stringOption('reason','Reason for the correction; no sensitive scene text',true,300),
    stringOption('day','YYYY-MM-DD; defaults to today in America/Chicago',false,10)
  ] },
  { name: 'ledger-audit', description: 'Staff: review recent TEST AP adjustments', default_member_permissions: '0', options: [
    { type: 6, name: 'player', description: 'Player to review', required: true }
  ] }
];

export async function handleCommand(interaction, ledger, guildId) {
  if(characterCommands.some(c=>c.name===interaction.commandName))return handleCharacterCommand(interaction,ledger,guildId);
  const playerId = interaction.user.id;
  if (interaction.commandName === 'ledger-tupper') {
    const sub = interaction.options.getSubcommand();
    if (sub === 'register') {
      const input = await ledger.register(guildId,playerId,interaction.options.getString('name',true),interaction.options.getString('prefix') ?? '',interaction.options.getString('suffix') ?? '');
      return `Registered ${input.name} to your account. Prefix: ${JSON.stringify(input.prefix)}; suffix: ${JSON.stringify(input.suffix)}.\nThis helps match future messages. It does not create or approve a character, verify a Tupper display name, or grant a character slot. Your Tupperbox configuration is unchanged.`;
    }
    if (sub === 'remove') return await ledger.unregister(guildId,playerId,interaction.options.getString('name',true)) ? 'Your registration was removed. Saved AP is unchanged.' : 'No registration with that name exists on your account.';
    const rows = await ledger.registrations(guildId,playerId);
    return rows.length ? ('**Your registered brackets**\n' + rows.map(r => `${r.name}: ${JSON.stringify(r.prefix)}text${JSON.stringify(r.suffix)}`).join('\n')).slice(0,1900) : 'No brackets registered. Use /ledger-tupper register.';
  }
  if (interaction.commandName === 'ledger-adjust' || interaction.commandName === 'ledger-audit') {
    const member = await interaction.guild.members.fetch(playerId);
    const roleIds = (process.env.MODERATOR_ROLE_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean);
    if (!staffAllowed(member,roleIds)) throw new UserError('Only administrators or configured moderator roles can use this command.');
    const target = interaction.options.getUser('player',true);
    if (target.bot) throw new UserError('Choose a player, not a bot.');
    if (interaction.commandName === 'ledger-adjust') {
      const day = interaction.options.getString('day') ?? serverDay(new Date());
      const result = await ledger.adjust({ guildId, playerId: target.id, moderatorId: playerId, requestId: interaction.id, delta: interaction.options.getInteger('change',true), day, reason: interaction.options.getString('reason',true) });
      return `**TEST adjustment ${result.duplicate ? 'already recorded' : 'saved'}**\nPlayer ID: ${target.id}\nDay: ${day}\nDaily AP: ${result.before_ap} → ${result.after_ap}\nTotal AP and active days reflect this correction. Unfinished words are unchanged. The reason and moderator ID are recorded.\nThis adjusts AP only; source writing may earn new credit later.`;
    }
    const rows = await ledger.audit(guildId,target.id);
    return rows.length ? ('**TEST adjustment history**\nPlayer ID: ' + target.id + '\n' + rows.map(r => `${r.day}: ${r.delta > 0 ? '+' : ''}${r.delta} AP (${r.before_ap}→${r.after_ap}); moderator ${r.moderator_id}\n${r.reason}`).join('\n\n')).slice(0,1900) : 'No test AP adjustments recorded for this player.';
  }
  const s = await ledger.status(guildId,playerId);
  return `**TEST ledger — not real progression**\nToday: ${s.today}/4 AP\nTotal: ${s.total} AP\nUnfinished words: ${s.remainder}/300\nActive days: ${s.active_days}\nDaily reset: midnight America/Chicago.`;
}
