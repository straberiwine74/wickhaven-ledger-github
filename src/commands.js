import { UserError, staffAllowed } from './admin.js';
import { serverDay } from './activity.js';
import { characterCommands, handleCharacterCommand } from './character-commands.js';
import { card, message, clean, testNote } from './ui.js';

const stringOption = (name, description, required = true, max_length = 80) => ({ type: 3, name, description, required, max_length });
export const commands = [
  ...characterCommands,
  { name: 'ledger-ap', description: 'View your AP balance and progress' },
  { name: 'ledger-tupper', description: 'Register your own Tupper brackets with the Ledger', options: [
    { type: 1, name: 'register', description: 'Add or update your own bracket registration', options: [
      stringOption('name','Character label'), stringOption('prefix','Opening bracket, e.g. R:',false,32), stringOption('suffix','Closing bracket, if any',false,32)] },
    { type: 1, name: 'list', description: 'List your registrations' },
    { type: 1, name: 'remove', description: 'Remove one of your registrations', options: [stringOption('name','Registered character label')] }
  ] },
  { name: 'ledger-adjust', description: 'Staff: adjust a player\u2019s AP with a recorded reason', default_member_permissions: '0', options: [
    { type: 6, name: 'player', description: 'Player to adjust', required: true },
    { type: 4, name: 'change', description: 'AP to add or remove, -4 through +4', required: true, min_value: -4, max_value: 4 },
    stringOption('reason','Reason for the correction; no sensitive scene text',true,300),
    stringOption('day','YYYY-MM-DD; defaults to today in America/Chicago',false,10)
  ] },
  { name: 'ledger-audit', description: 'Staff: review recent AP adjustments', default_member_permissions: '0', options: [
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
      return message(card({title:'🏷️ Brackets registered',description:`**${clean(input.name)}** is now linked to your account. The Ledger uses this to match your future Tupper messages.`,tone:'success',fields:[
        {name:'Prefix',value:'`'+JSON.stringify(input.prefix)+'`',inline:true},{name:'Suffix',value:'`'+JSON.stringify(input.suffix)+'`',inline:true},
        {name:'Good to know',value:'This doesn\u2019t create or approve a character, check your Tupper\u2019s display name, or grant a character slot. Your Tupperbox settings are unchanged.'}]}));
    }
    if (sub === 'remove') return await ledger.unregister(guildId,playerId,interaction.options.getString('name',true))
      ? message(card({title:'🏷️ Registration removed',description:'Those brackets are no longer linked to your account. Saved AP is unchanged.',tone:'neutral'}))
      : message(card({title:'Registration not found',description:'No registration with that name exists on your account. Use `/ledger-tupper list` to see your saved names.',tone:'neutral'}));
    const rows = await ledger.registrations(guildId,playerId);
    return message(card({title:'🏷️ Your registered brackets',description:rows.length?`${rows.length} registration${rows.length===1?'':'s'} on your account.`:'No brackets registered yet. Use `/ledger-tupper register` to add one.',tone:'info',
      fields:rows.slice(0,25).map(r=>({name:clean(r.name),value:'`'+`${JSON.stringify(r.prefix)}text${JSON.stringify(r.suffix)}`+'`',inline:true}))}));
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
      return message(card({title:`⚖️ AP adjustment ${result.duplicate ? 'already recorded' : 'saved'}`,description:`<@${target.id}>\nTotal AP and active days reflect this correction. The reason and your moderator ID are recorded.`,tone:result.duplicate?'neutral':'success',fields:[
        {name:'Day',value:day,inline:true},{name:'Daily AP',value:`${result.before_ap} → **${result.after_ap}**`,inline:true},
        {name:'Note',value:'This adjusts AP only. Unfinished words are unchanged, and the source writing may still earn credit later.'}]}));
    }
    const rows = await ledger.audit(guildId,target.id);
    return message(card({title:'⚖️ AP adjustment history',description:rows.length?`<@${target.id}> • most recent first`:`No AP adjustments recorded for <@${target.id}>.`,tone:'info',
      fields:rows.slice(0,20).map(r=>({name:`${r.day} • ${r.delta > 0 ? '+' : ''}${r.delta} AP (${r.before_ap} → ${r.after_ap})`,value:`${clean(r.reason)}\nModerator: <@${r.moderator_id}>`}))}));
  }
  const s = await ledger.status(guildId,playerId);
  return message(card({title:'📒 Your AP',description:testNote('*TEST ledger: this isn\u2019t real progression yet.*')||'Your progress toward new character slots.',tone:'info',fields:[
    {name:'Today',value:`**${s.today}** / 4 AP`,inline:true},{name:'Total',value:`**${s.total}** AP`,inline:true},{name:'Active days',value:`**${s.active_days}**`,inline:true},
    {name:'Words toward next AP',value:`${s.remainder} / 300`,inline:true},{name:'Daily reset',value:'Midnight, Chicago time',inline:true}]}));
}
