import { createHash } from 'node:crypto';
import { ActionRowBuilder,ButtonBuilder,ButtonStyle,ChannelType } from 'discord.js';
import { UserError } from './admin.js';
import { card, testNote } from './ui.js';

export const reviewKey=c=>createHash('md5').update(`${c.guild_id}:${c.player_id}:${c.name_key}`).digest('hex');
const clean=s=>s.replace(/[\r\n]/g,' ').slice(0,100);
const STATUS_SHORT={pending:'Pending',approved:'Approved',rejected:'Changes requested',retired:'Retired'};
export const threadName=c=>`${clean(c.name)} · ${STATUS_SHORT[c.status]??c.status}`.slice(0,100);
// Finds a review thread (and its review message) created by this bot, e.g. after a crash
// between creating the thread and saving its record.
async function findReviewThread(threads,c,key,botId,channelId){
  for(const thread of threads.values()){
    if(thread.ownerId!==botId||thread.parentId!==channelId||!(thread.name.startsWith(clean(c.name))||thread.name.endsWith(`[${key}]`)))continue;
    let messages;
    try{messages=await thread.messages.fetch({limit:50});}catch(error){if(error.code===10008||error.code===10003)continue;throw error;}
    const message=[...messages.values()].find(m=>m.author?.id===botId&&(m.embeds?.[0]?.footer?.text??'').includes(`Review ${key} •`));
    if(message)return {thread,message};
  }
}
// Reviews are private threads in a text channel (#character-submission): only the
// submitting player (added by the bot) and staff with Manage Threads can see each one.
export const REVIEW_PERMISSIONS=['ViewChannel','CreatePrivateThreads','SendMessagesInThreads','ReadMessageHistory','EmbedLinks','ManageThreads'];
export function missingReviewPermissions(channel,user){
  const perms=channel.permissionsFor(user);
  return REVIEW_PERMISSIONS.filter(p=>!perms?.has(p));
}
export function reviewPayload(c,roleId,note='',{welcome=false}={}){
  const key=reviewKey(c);
  const status={pending:'Pending review',approved:'Approved',rejected:'Changes requested',retired:'Retired'}[c.status];
  const fields=[
    {name:'Character sheet',value:c.sheet_url},
    {name:`Ability scores — chosen set ${c.stat_set}`,value:c.stats_url},
    {name:'Starting resources',value:c.resources==='gold'?'Gold (older submission)':'Starting equipment'},
    {name:'✅ Check before approving',value:'Level 3 • 2024 rules • legacy only where no 2024 option exists • official WotC only • starting equipment, not gold • one Uncommon magic item. Check sheet ownership, the chosen stat-set reaction, equipment and magic item by hand.'}];
  if(note)fields.push({name:c.status==='rejected'?'✏️ Changes requested by staff':'Staff review note',value:note});
  if(c.status==='rejected')fields.push({name:'Player next step',value:'Update your character, then click **Resubmit Changes**. The review returns to Pending and Moderators are alerted. If your links or options changed, use `/ledger-character submit` again.'});
  // Keep "Review <key> • Revision <n>" at the end of the footer: post lookup depends on it.
  const embed=card({title:`🧙 Character review: ${c.name}`,description:`**Status: ${status}**\nPlayer: <@${c.player_id}>${testNote('\n*TEST system: not a live approval.*')}`,tone:{pending:'pending',approved:'success',rejected:'warning',retired:'neutral'}[c.status],fields,footer:`Review ${key} • Revision ${c.revision}`});
  const row=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`char-review:approved:${key}:${c.revision}`).setLabel('Approve').setStyle(ButtonStyle.Success).setDisabled(c.status!=='pending'),
    new ButtonBuilder().setCustomId(`char-review:rejected:${key}:${c.revision}`).setLabel('Request Changes').setStyle(ButtonStyle.Secondary).setDisabled(c.status==='rejected'||c.status==='retired'),
    new ButtonBuilder().setCustomId(`char-resubmit:${key}:${c.revision}`).setLabel('Resubmit Changes').setStyle(ButtonStyle.Primary).setDisabled(c.status!=='rejected'));
  const welcomeLine=welcome?`<@${c.player_id}>, this private thread is just for you and staff. Updates on your character will show up here, and you can ask staff questions here too.\n`:'';
  return {content:welcomeLine+(c.status==='pending'?`<@&${roleId}> — a character is ready for review.`:'Character review completed.'),embeds:[embed],components:[row],allowedMentions:{parse:[],roles:c.status==='pending'?[roleId]:[],users:welcome?[c.player_id]:[]}};
}

export class ReviewPosts{
  constructor(pool,client,guildId,forumId,roleId){Object.assign(this,{pool,client,guildId,forumId,roleId});}
  async byKey(key){
    if(!/^[a-f0-9]{32}$/.test(key))throw new UserError('Invalid review reference.');
    const c=(await this.pool.query("SELECT * FROM ledger_test_characters WHERE guild_id=$1 AND md5(guild_id || ':' || player_id || ':' || name_key)=$2",[this.guildId,key])).rows[0];
    if(!c)throw new UserError('That submission was not found.');return c;
  }
  async sync(playerId,name){
    if(!/^\d{17,20}$/.test(this.forumId??'')||!/^\d{17,20}$/.test(this.roleId??''))throw new UserError('Review channel or moderator role is not configured.');
    const db=await this.pool.connect();
    try{
      await db.query('BEGIN');
      const c=(await db.query('SELECT * FROM ledger_test_characters WHERE guild_id=$1 AND player_id=$2 AND name_key=$3 FOR UPDATE',[this.guildId,playerId,name.trim().toLowerCase()])).rows[0];
      if(!c)throw new UserError('Submission not found.');
      let channel;
      try{channel=await this.client.channels.fetch(this.forumId);}
      catch(e){if(e.code===50001||e.code===10003)throw new UserError(`The Ledger can’t see channel ${this.forumId} (Discord ${e.code}). Check CHARACTERS_CHANNEL_ID and give the Ledger View Channel there.`);throw e;}
      if(channel?.type!==ChannelType.GuildText||channel.guildId!==this.guildId)throw new UserError('CHARACTERS_CHANNEL_ID must be a text channel in this server (#character-submission).');
      const missing=missingReviewPermissions(channel,this.client.user);
      if(missing.length)throw new UserError(`The Ledger is missing ${missing.join(', ')} in #${channel.name}.`);
      const role=await channel.guild.roles.fetch(this.roleId);
      if(!role)throw new UserError(`Moderator role ${this.roleId} isn’t a role in this server. Check the first ID in MODERATOR_ROLE_IDS in Vercel, then redeploy.`);
      if(c.status==='pending'&&!role.mentionable&&!channel.permissionsFor(this.client.user)?.has('MentionEveryone'))throw new UserError('The Moderator role cannot be notified. Make that role mentionable, or allow the Ledger Mention @everyone, @here, and All Roles in the review channel.');
      let post=(await db.query('SELECT * FROM ledger_test_review_posts WHERE guild_id=$1 AND player_id=$2 AND name_key=$3',[this.guildId,playerId,c.name_key])).rows[0];
      let thread,reviewMessage=null;
      if(post){
        try{thread=await this.client.channels.fetch(post.thread_id);}catch(e){if(e.code!==10003&&e.code!==50001)throw e;}
        // Older reviews lived in a forum; those get a fresh private thread here.
        if(thread&&thread.parentId!==this.forumId)thread=null;
      }
      const key=reviewKey(c);
      if(!thread){
        let found=await findReviewThread((await channel.threads.fetchActive()).threads,c,key,this.client.user.id,this.forumId);
        if(!found){
          let before;
          for(let page=0;page<20;page++){
            const archive=await channel.threads.fetchArchived({type:'private',limit:100,...(before?{before}:{})});
            found=await findReviewThread(archive.threads,c,key,this.client.user.id,this.forumId);
            if(found||!archive.hasMore)break;
            const oldest=archive.threads.last();
            if(!oldest?.archiveTimestamp||page===19)throw new UserError('Could not finish searching archived review threads; staff review is needed before creating another.');
            before=new Date(oldest.archiveTimestamp);
          }
        }
        if(found){thread=found.thread;reviewMessage=found.message;}
      }
      const note=(await db.query('SELECT note FROM ledger_test_character_reviews WHERE guild_id=$1 AND player_id=$2 AND name_key=$3 ORDER BY created_at DESC,request_id DESC LIMIT 1',[this.guildId,playerId,c.name_key])).rows[0]?.note??'';
      let created=false;
      if(!thread){
        thread=await channel.threads.create({name:threadName(c),type:ChannelType.PrivateThread,invitable:false,autoArchiveDuration:10080,reason:'Character review'});
        await thread.members.add(c.player_id).catch(()=>console.error('The submitting player could not be added to their review thread.'));
        reviewMessage=await thread.send(reviewPayload(c,this.roleId,c.status==='pending'?'':note,{welcome:true}));
        created=true;
      }
      if(thread.parentId!==this.forumId||thread.ownerId!==this.client.user.id)throw new UserError('Stored review thread does not belong to this bot and channel.');
      if(thread.archived)await thread.setArchived(false);
      if(!created)await thread.members.add(c.player_id).catch(()=>{});
      if(thread.name!==threadName(c))await thread.setName(threadName(c)).catch(()=>console.error('A review thread could not be renamed (Discord limits renames); its status is still updated inside.'));
      if(!reviewMessage&&post?.message_id)reviewMessage=await thread.messages.fetch(post.message_id).catch(()=>null);
      if(!reviewMessage){const found=await findReviewThread(new Map([[thread.id,thread]]),c,key,this.client.user.id,this.forumId);reviewMessage=found?.message??null;}
      if(!reviewMessage||reviewMessage.author?.id!==this.client.user.id)throw new UserError('The review message is missing. Staff assistance is needed.');
      const payload=reviewPayload(c,this.roleId,c.status==='pending'?'':note);
      const previouslyAnnounced=post?.last_ping_revision??0;
      if(!created)await reviewMessage.edit({...payload,content:reviewMessage.content,allowedMentions:{parse:[]}});
      if(!created&&c.status==='pending'&&previouslyAnnounced<c.revision){
        const marker=`Review ${key} revision ${c.revision} ready`;
        const messages=await thread.messages.fetch({limit:100});
        const notified=[...messages.values()].some(m=>m.author?.id===this.client.user.id&&(m.content?.includes(marker)||(m.id===reviewMessage.id&&m.embeds?.[0]?.footer?.text?.endsWith(`Review ${key} • Revision ${c.revision}`)&&previouslyAnnounced===0)));
        if(!notified)await thread.send({content:`<@&${this.roleId}> — ${marker}.`,allowedMentions:{parse:[],roles:[this.roleId],users:[]}});
      }
      await db.query(`INSERT INTO ledger_test_review_posts (guild_id,player_id,name_key,thread_id,message_id,last_ping_revision,presentation_version)
        VALUES ($1,$2,$3,$4,$5,$6,3) ON CONFLICT (guild_id,player_id,name_key)
        DO UPDATE SET thread_id=EXCLUDED.thread_id,message_id=EXCLUDED.message_id,last_ping_revision=EXCLUDED.last_ping_revision,presentation_version=3`,[this.guildId,playerId,c.name_key,thread.id,reviewMessage.id,c.status==='pending'?c.revision:previouslyAnnounced]);
      await db.query('UPDATE ledger_test_characters SET needs_publish=false WHERE guild_id=$1 AND player_id=$2 AND name_key=$3',[this.guildId,playerId,c.name_key]);
      await db.query('COMMIT');return `https://discord.com/channels/${this.guildId}/${thread.id}`;
    }catch(e){await db.query('ROLLBACK');throw e;}finally{db.release();}
  }
  async retryPending(){
    const rows=(await this.pool.query(`SELECT c.player_id,c.name FROM ledger_test_characters c
      LEFT JOIN ledger_test_review_posts p USING (guild_id,player_id,name_key)
      WHERE c.guild_id=$1 AND (c.needs_publish=true OR p.presentation_version IS NULL OR p.presentation_version<3)
      ORDER BY c.submitted_at LIMIT 20`,[this.guildId])).rows;
    for(const c of rows){try{await this.sync(c.player_id,c.name);}catch(e){console.error(`A saved character review could not be published; it remains queued. Reason: ${e?.code?`Discord ${e.code} ${e.message}`:(e?.message??'unknown')}`);}}
  }
}
