import { ActionRowBuilder,ModalBuilder,TextInputBuilder,TextInputStyle,MessageFlags } from 'discord.js';
import { UserError } from './admin.js';
import { notifyChanges } from './character-notifications.js';
import { promoteApplicant } from './roles.js';
import { card, message, notice, clean } from './ui.js';

export function canReview(interaction){
  if(interaction.memberPermissions?.has(8n))return true;
  const ids=(process.env.MODERATOR_ROLE_IDS??'').split(',').map(s=>s.trim()).filter(Boolean);
  const roles=interaction.member?.roles;
  return ids.some(id=>Array.isArray(roles)?roles.includes(id):roles?.cache?.has(id));
}
export async function reviewInteraction(interaction,ledger,guildId){
  const resubmit=interaction.customId?.match(/^char-resubmit:([a-f0-9]{32}):(\d+)$/);
  if(resubmit){
    try{
      await interaction.deferReply({flags:MessageFlags.Ephemeral});
      if(interaction.guildId!==guildId||!ledger?.reviewPosts||interaction.channel?.parentId!==ledger.reviewPosts.forumId)throw new UserError('Use this control in your character review thread.');
      const c=await ledger.reviewPosts.byKey(resubmit[1]);
      if(c.player_id!==interaction.user.id)throw new UserError('Only the player who submitted this character may resubmit it.');
      await ledger.characters.resubmit(guildId,interaction.user.id,c.name,Number(resubmit[2]));
      let notice='';try{await ledger.reviewPosts.sync(c.player_id,c.name);}catch{notice=' The public update is queued for retry.';}
      await interaction.editReply(message(card({title:`🔁 Resubmitted: ${clean(c.name)}`,description:`Your character is back in the review queue, and staff have been alerted.${notice}`,tone:'pending',fields:[{name:'Good to know',value:'Your saved links and starting-resource choice were reused. Use `/ledger-character submit` again if those changed.'}]})));
    }catch(error){await interaction.editReply(notice('Resubmission not confirmed',error instanceof UserError?error.message:'Resubmission couldn\u2019t be confirmed. Check the review status before trying again.')).catch(()=>{});}
    return true;
  }
  const match=interaction.customId?.match(/^(char-review|char-decision):(approved|rejected):([a-f0-9]{32}):(\d+)$/);
  if(!match)return false;
  try{
    if(interaction.guildId!==guildId||!canReview(interaction))throw new UserError('Only administrators and configured Moderators can review submissions.');
    if(!ledger?.reviewPosts)throw new UserError('Public reviews are not configured.');
    if(interaction.channel?.parentId!==ledger.reviewPosts.forumId)throw new UserError('Use these controls in the character review thread.');
    const [,kind,decision,key,revisionText]=match;
    const revision=Number(revisionText);
    if(kind==='char-review'&&interaction.isButton()){
      // Showing a modal must be the initial interaction response.
      const modal=new ModalBuilder().setCustomId(`char-decision:${decision}:${key}:${revision}`).setTitle(decision==='approved'?'Approve character':'Request character changes');
      const note=new TextInputBuilder().setCustomId('note').setLabel(decision==='approved'?'Review note (public)':'Changes needed (public)').setStyle(TextInputStyle.Paragraph).setMinLength(5).setMaxLength(300).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(note));
      if(decision==='approved')modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('confirm').setLabel('Type APPROVE after checking all requirements').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(7)));
      await interaction.showModal(modal);return true;
    }
    if(kind==='char-decision'&&interaction.isModalSubmit()){
      await interaction.deferReply({flags:MessageFlags.Ephemeral});
      if(decision==='approved'&&interaction.fields.getTextInputValue('confirm').trim()!=='APPROVE')throw new UserError('Review the sheet, stat rolls and starting resources, then type APPROVE to confirm.');
      const c=await ledger.reviewPosts.byKey(key);
      const result=await ledger.characters.decide({guildId,playerId:c.player_id,name:c.name,moderatorId:interaction.user.id,requestId:interaction.id,decision,note:interaction.fields.getTextInputValue('note'),expectedRevision:revision});
      let notice='';
      try{await ledger.reviewPosts.sync(c.player_id,c.name);}catch{notice=' The decision was saved, but the public post update is queued for retry.';}
      if(decision==='approved'&&!result.duplicate){const promoted=await promoteApplicant({client:interaction.client,pool:ledger.characters.pool,guildId,playerId:c.player_id,nameKey:c.name_key});notice+=promoted==='promoted'?' Adventurer role granted.':promoted==='left'?' The player has left the server, so no roles were changed.':' The role change failed; see the note in the review post.';}
      if(decision==='rejected')notice+=' '+await notifyChanges(ledger,interaction.id);
      await interaction.editReply(message(card({title:result.duplicate?'Review already recorded':decision==='approved'?`✅ Approved: ${clean(c.name)}`:`✏️ Returned for changes: ${clean(c.name)}`,description:(notice.trim()||'The review post has been updated.'),tone:result.duplicate?'neutral':decision==='approved'?'success':'warning'})));return true;
    }
    throw new UserError('This review control is not valid.');
  }catch(error){
    const payload=notice('Review not confirmed',error instanceof UserError?error.message:'The review couldn\u2019t be confirmed. Check the submission before trying again.');
    if(interaction.deferred||interaction.replied)await interaction.editReply(payload).catch(()=>{});
    else await interaction.reply({...payload,flags:MessageFlags.Ephemeral}).catch(()=>{});
    return true;
  }
}
