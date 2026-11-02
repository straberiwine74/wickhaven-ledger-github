import { UserError, staffAllowed } from './admin.js';
import { notifyChanges } from './character-notifications.js';
import { card, message, clean } from './ui.js';
const statusName={pending:'Pending review',approved:'Approved',rejected:'Changes requested'};
const statusTone={pending:'pending',approved:'success',rejected:'warning'};
const str=(name,description,max_length=80)=>({type:3,name,description,required:true,max_length});
const target={type:6,name:'player',description:'Submitting player',required:true};
export const characterCommands=[
  {name:'ledger-character',description:'Submit a TEST character or view your slots',options:[
    {type:1,name:'submit',description:'Submit links for staff review; this does not import a sheet',options:[
      str('name','Character name'),str('sheet','D&D Beyond character URL',300),
      str('stats','Discord message link containing the three stat sets',300),
      {type:4,name:'set',description:'Chosen stat set; also react to the roll post',required:true,min_value:1,max_value:3},
      {type:3,name:'resources',description:'Choose the same method for both class and background',required:true,choices:[{name:'Equipment from both',value:'equipment'},{name:'Gold from both',value:'gold'}]}
    ]},
    {type:1,name:'list',description:'View your submitted TEST characters'},
    {type:1,name:'publish',description:'Publish or repair your saved review post',options:[str('name','Submitted character name')]},
    {type:1,name:'resubmit',description:'Return a corrected character to pending review',options:[str('name','Submitted character name')]},
    {type:1,name:'slots',description:'View TEST slots and unlock progress'}
  ]},
  {name:'ledger-review',description:'Staff: inspect a TEST character submission',default_member_permissions:'0',options:[target,str('name','Submitted character name')]},
  {name:'ledger-approve',description:'Staff: approve a reviewed TEST submission',default_member_permissions:'0',options:[target,str('name','Submitted character name'),
    {type:5,name:'verified',description:'Confirm you manually checked the sheet, rolls and creation rules',required:true},str('note','Review note; do not include sensitive RP text',300)]},
  {name:'ledger-reject',description:'Staff: return a pending TEST submission for corrections',default_member_permissions:'0',options:[target,str('name','Submitted character name'),str('reason','What needs correcting; do not include sensitive RP text',300)]}
];
function formatSlots(s){
  const first=s.firstApproval?new Date(s.firstApproval).toISOString().slice(0,10):'Not yet approved';
  const fields=[
    {name:'Slots in use',value:`**${s.approved}** / ${s.unlocked}`,inline:true},
    {name:'First approval',value:first,inline:true},
    {name:'Elapsed days',value:`${s.elapsedDays}`,inline:true},
    {name:'AP',value:`${s.totalAP}`,inline:true},
    {name:'Active days',value:`${s.activeDays}`,inline:true}];
  if(s.next) fields.push({name:'🔓 Next slot needs all three',value:`${s.next.days} elapsed days • ${s.next.ap} total AP • ${s.next.active} active days\n**Still to go:** ${Math.max(0,s.next.days-s.elapsedDays)} days, ${Math.max(0,s.next.ap-s.totalAP)} AP, ${Math.max(0,s.next.active-s.activeDays)} active days`});
  else fields.push({name:'🔓 All four slots unlocked',value:'Nothing left to unlock.'});
  return message(card({title:'🧙 Your character slots',description:'Earned slots stay unlocked.\n*TEST records only.*',tone:'info',fields}));
}
export async function handleCharacterCommand(interaction,ledger,guildId){
  const playerId=interaction.user.id;
  const store=ledger.characters;
  if(interaction.commandName==='ledger-character'){
    const sub=interaction.options.getSubcommand();
    if(sub==='submit'){
      const c=await store.submit(guildId,playerId,{
        name:interaction.options.getString('name',true),sheet:interaction.options.getString('sheet',true),
        stats:interaction.options.getString('stats',true),
        set:interaction.options.getInteger('set',true),resources:interaction.options.getString('resources',true)
      });
      let publication;
      try{publication=ledger.reviewPosts?await ledger.reviewPosts.sync(playerId,c.name):'Public review posting isn\u2019t set up yet. Ask an administrator.';}
      catch(error){publication=`Saved, but the review post couldn\u2019t be confirmed. It\u2019s queued for retry. ${error instanceof UserError?error.message:'Check bot permissions in the characters forum.'}`;}
      return message(card({title:`📥 Submitted: ${clean(c.name)}`,description:'Your character is waiting for staff review. This isn\u2019t an approval or an Avrae import yet.',tone:'pending',fields:[{name:'Status',value:'Pending review',inline:true},{name:'Review post',value:publication}]}));
    }
    if(sub==='publish'){
      if(!ledger.reviewPosts)throw new UserError('Public review posting is not configured.');
      return message(card({title:'📌 Review post ready',description:await ledger.reviewPosts.sync(playerId,interaction.options.getString('name',true)),tone:'info'}));
    }
    if(sub==='resubmit'){
      const c=await store.resubmit(guildId,playerId,interaction.options.getString('name',true));
      let notice='The review post update is queued.';
      if(ledger.reviewPosts)try{notice=await ledger.reviewPosts.sync(playerId,c.name);}catch{}
      return message(card({title:`🔁 Resubmitted: ${clean(c.name)}`,description:'Your character is back in the review queue, and staff have been alerted.',tone:'pending',fields:[{name:'Status',value:'Pending review',inline:true},{name:'Review post',value:notice},{name:'Good to know',value:'This reuses your saved links and resource choice. Use `/ledger-character submit` again if those changed.'}]}));
    }
    if(sub==='slots')return formatSlots(await store.slots(guildId,playerId));
    const rows=await store.list(guildId,playerId);
    return message(card({title:'🧙 Your characters',description:rows.length?'*TEST submissions*':'No submissions yet. Use `/ledger-character submit` to send one in.',tone:'info',
      fields:rows.slice(0,25).map(r=>({name:clean(r.name),value:`**${statusName[r.status]}**${r.status==='rejected'&&r.review_note?'\nChanges requested: '+clean(r.review_note):''}`,inline:r.status!=='rejected'}))}));
  }
  const member=await interaction.guild.members.fetch(playerId);
  if(!staffAllowed(member,(process.env.MODERATOR_ROLE_IDS??'').split(',').map(s=>s.trim()).filter(Boolean)))throw new UserError('Only administrators or configured moderator roles can review characters.');
  const player=interaction.options.getUser('player',true);
  if(player.bot)throw new UserError('Choose a player, not a bot.');
  const name=interaction.options.getString('name',true);
  if(interaction.commandName==='ledger-review'){
    const c=await store.review(guildId,player.id,name);
    const s=await store.slots(guildId,player.id);
    const dm=await ledger.notifications?.latest(player.id,name);
    return message(card({title:`🔍 Review: ${clean(c.name)}`,description:`<@${player.id}> • **${statusName[c.status]}**`,tone:statusTone[c.status],fields:[
      {name:'Character sheet',value:c.sheet_url},{name:`Stat rolls (chosen set ${c.stat_set})`,value:c.stats_url},
      {name:'Starting resources',value:`${c.resources==='gold'?'Gold':'Equipment'} from both class and background`,inline:true},{name:'Slots used',value:`${s.approved} / ${s.unlocked}`,inline:true},{name:'Player DM',value:c.status==='rejected'?(dm?.status??'not queued'):'not applicable',inline:true},
      {name:'✅ Check before approving',value:'• Level 3, 2024 rules; legacy only where no 2024 option exists; official WotC content only\n• Sheet belongs to this player; the chosen stat set matches the reaction and the sheet\n• No mixing of equipment and gold packages\n• Submission and links belong to this player'},
      {name:'Heads up',value:'The bot only checks link formats. It hasn\u2019t opened or verified the linked content.'}]}));
  }
  const approved=interaction.commandName==='ledger-approve';
  if(approved&&!interaction.options.getBoolean('verified',true))throw new UserError('Complete the manual review, then set verified to true.');
  const result=await store.decide({guildId,playerId:player.id,name,moderatorId:playerId,requestId:interaction.id,decision:approved?'approved':'rejected',note:interaction.options.getString(approved?'note':'reason',true)});
  let post='';
  if(ledger.reviewPosts)try{post=await ledger.reviewPosts.sync(player.id,name);}catch{post='Decision saved; the review post update is queued for retry.';}
  const dm=approved?'':await notifyChanges(ledger,interaction.id);
  return message(card({title:result.duplicate?'Review already recorded':approved?`✅ Approved: ${clean(name)}`:`✏️ Changes requested: ${clean(name)}`,description:`<@${player.id}>\n${approved?'A character slot is now in use. The first approval starts the 30/60-day clock; later approvals don\u2019t reset it.':'The player can fix the character and resubmit under the same name. No slot was used.'}`,tone:result.duplicate?'neutral':approved?'success':'warning',
    fields:[{name:'Review post',value:post},{name:'Player DM',value:dm},{name:'Recorded',value:'Your decision and note are saved. No Discord roles or Tupper settings were changed.'}]}));
}
