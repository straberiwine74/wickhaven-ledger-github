import { UserError, staffAllowed } from './admin.js';
import { notifyChanges } from './character-notifications.js';
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
  const first=s.firstApproval?new Date(s.firstApproval).toISOString().slice(0,10):'not yet approved';
  let text=`**TEST character slots**\nApproved: ${s.approved}/${s.unlocked}\nFirst approval: ${first}\nElapsed days: ${s.elapsedDays}\nAP: ${s.totalAP} • Active days: ${s.activeDays}`;
  if(s.next) text+=`\nNext slot requires all three: ${s.next.days} elapsed days, ${s.next.ap} total AP, ${s.next.active} active days.\nRemaining: ${Math.max(0,s.next.days-s.elapsedDays)} days, ${Math.max(0,s.next.ap-s.totalAP)} AP, ${Math.max(0,s.next.active-s.activeDays)} active days.`;
  else text+='\nAll four slots unlocked.';
  return text+'\nEarned slots stay unlocked. These records are for testing only.';
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
      try{publication=ledger.reviewPosts?`Review post: ${await ledger.reviewPosts.sync(playerId,c.name)}`:'Public review posting is not configured yet. Ask an administrator to configure it.';}
      catch(error){publication=`Saved, but the public review post could not be confirmed. It is queued for retry. ${error instanceof UserError?error.message:'Check bot permissions in the characters forum.'}`;}
      return `**TEST submission saved: ${c.name}**\nStatus: pending staff review. This is not approval or an Avrae import.\n${publication}`;
    }
    if(sub==='publish'){
      if(!ledger.reviewPosts)throw new UserError('Public review posting is not configured.');
      return `Review post: ${await ledger.reviewPosts.sync(playerId,interaction.options.getString('name',true))}`;
    }
    if(sub==='resubmit'){
      const c=await store.resubmit(guildId,playerId,interaction.options.getString('name',true));
      let notice='The review post update is queued.';
      if(ledger.reviewPosts)try{notice=`Review post: ${await ledger.reviewPosts.sync(playerId,c.name)}`;}catch{}
      return `**Resubmitted: ${c.name}**\nStatus: Pending review. Staff can review and approve again.\n${notice}\nThis reuses your saved links and resource choice. Use submit again if those details changed.`;
    }
    if(sub==='slots')return formatSlots(await store.slots(guildId,playerId));
    const rows=await store.list(guildId,playerId);
    return rows.length?('**Your TEST submissions**\n'+rows.map(r=>`${r.name}: ${{pending:"Pending review",approved:"Approved",rejected:"Changes requested"}[r.status]}${r.status==='rejected'&&r.review_note?'\nCorrection requested: '+r.review_note:''}`).join('\n')).slice(0,1900):'No submissions yet. Use /ledger-character submit.';
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
    return `**TEST submission: ${c.name}**\nPlayer ID: ${player.id} • Status: ${{pending:"Pending review",approved:"Approved",rejected:"Changes requested"}[c.status]}\nSheet: ${c.sheet_url}\nStat rolls (chosen set ${c.stat_set}): ${c.stats_url}\nStarting resources: ${c.resources} from BOTH class and background\nSlots used: ${s.approved}/${s.unlocked}\nPlayer DM: ${c.status==='rejected'?(dm?.status??'not queued'):'not applicable'}\n\n**Manual checks before approval**\n• Level 3 and 2024 rules; legacy only where no 2024 option exists; official WotC content only.\n• Sheet belongs to this player; selected full stat set matches reaction and sheet.\n• No mixed equipment/gold packages.\n• Submission and links belong to this player.\nThe bot validates URL formats only. It has not read or verified linked content. Staff must have access to the source posts.`;
  }
  const approved=interaction.commandName==='ledger-approve';
  if(approved&&!interaction.options.getBoolean('verified',true))throw new UserError('Complete the manual review, then set verified to true.');
  const result=await store.decide({guildId,playerId:player.id,name,moderatorId:playerId,requestId:interaction.id,decision:approved?'approved':'rejected',note:interaction.options.getString(approved?'note':'reason',true)});
  let publication='';
  if(ledger.reviewPosts)try{publication=`\nReview post: ${await ledger.reviewPosts.sync(player.id,name)}`;}catch{publication='\nDecision saved; public post update is queued for retry.';}
  if(!approved)publication+='\n'+await notifyChanges(ledger,interaction.id);
  return `**TEST character ${result.duplicate?'review already recorded':result.decision==='approved'?'approved':'changes requested'}**\nPlayer ID: ${player.id}\nCharacter: ${name}\n${approved?'A character slot is used. The first approval starts the 30/60-day clock; later approvals do not reset it.':'The player may correct and resubmit the same name. No slot was used.'}\nStaff decision and note were recorded. No Discord roles or Tupper settings were changed.${publication}`;
}
