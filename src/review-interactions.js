import { ActionRowBuilder,ModalBuilder,TextInputBuilder,TextInputStyle,MessageFlags } from 'discord.js';
import { UserError } from './admin.js';

export function canReview(interaction){
  if(interaction.memberPermissions?.has(8n))return true;
  const ids=(process.env.MODERATOR_ROLE_IDS??'').split(',').map(s=>s.trim()).filter(Boolean);
  const roles=interaction.member?.roles;
  return ids.some(id=>Array.isArray(roles)?roles.includes(id):roles?.cache?.has(id));
}
export async function reviewInteraction(interaction,ledger,guildId){
  const match=interaction.customId?.match(/^(char-review|char-decision):(approved|rejected):([a-f0-9]{32}):(\d+)$/);
  if(!match)return false;
  try{
    if(interaction.guildId!==guildId||!canReview(interaction))throw new UserError('Only administrators and configured Moderators can review submissions.');
    if(!ledger?.reviewPosts)throw new UserError('Public reviews are not configured.');
    if(interaction.channel?.parentId!==ledger.reviewPosts.forumId)throw new UserError('Use these controls in the configured character-review forum.');
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
      if(decision==='approved'&&interaction.fields.getTextInputValue('confirm').trim()!=='APPROVE')throw new UserError('Review the sheet, stat rolls, RP sample and starting resources, then type APPROVE to confirm.');
      const c=await ledger.reviewPosts.byKey(key);
      const result=await ledger.characters.decide({guildId,playerId:c.player_id,name:c.name,moderatorId:interaction.user.id,requestId:interaction.id,decision,note:interaction.fields.getTextInputValue('note'),expectedRevision:revision});
      let notice='';
      try{await ledger.reviewPosts.sync(c.player_id,c.name);}catch{notice=' The decision was saved, but the public post update is queued for retry.';}
      await interaction.editReply({content:`TEST review ${result.duplicate?'already recorded':decision==='approved'?'approved':'returned for changes'}.${notice}`,allowedMentions:{parse:[]}});return true;
    }
    throw new UserError('This review control is not valid.');
  }catch(error){
    const payload={content:error instanceof UserError?error.message:'The review could not be confirmed. Check the submission before retrying.',allowedMentions:{parse:[]}};
    if(interaction.deferred||interaction.replied)await interaction.editReply(payload).catch(()=>{});
    else await interaction.reply({...payload,flags:MessageFlags.Ephemeral}).catch(()=>{});
    return true;
  }
}
