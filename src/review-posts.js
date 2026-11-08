import { createHash } from 'node:crypto';
import { ActionRowBuilder,ButtonBuilder,ButtonStyle,ChannelType } from 'discord.js';
import { UserError } from './admin.js';
import { card, testNote } from './ui.js';

export const reviewKey=c=>createHash('md5').update(`${c.guild_id}:${c.player_id}:${c.name_key}`).digest('hex');
const clean=s=>s.replace(/[\r\n]/g,' ').slice(0,100);
async function findReviewThread(threads,c,key,botId){
  for(const thread of threads.values()){
    if(thread.ownerId!==botId||!(thread.name===clean(c.name)||thread.name.endsWith(`[${key}]`)))continue;
    let starter;
    try{starter=await thread.fetchStarterMessage();}catch(error){if(error.code===10008)continue;throw error;}
    if(starter?.author.id===botId&&(starter.embeds[0]?.footer?.text??'').includes(`Review ${key} •`))return thread;
  }
}
export function reviewPayload(c,roleId,note=''){
  const key=reviewKey(c);
  const status={pending:'Pending review',approved:'Approved',rejected:'Changes requested',retired:'Retired'}[c.status];
  const fields=[
    {name:'Character sheet',value:c.sheet_url},
    {name:`Ability scores — chosen set ${c.stat_set}`,value:c.stats_url},
    {name:'Starting resources',value:`${c.resources==='gold'?'Gold':'Equipment'} from both class and background`},
    {name:'✅ Check before approving',value:'Level 3 • 2024 rules • official WotC only • legacy only where no 2024 option exists. Check sheet ownership, the chosen stat-set reaction, and starting resources by hand.'}];
  if(note)fields.push({name:c.status==='rejected'?'✏️ Changes requested by staff':'Staff review note',value:note});
  if(c.status==='rejected')fields.push({name:'Player next step',value:'Update your character, then click **Resubmit Changes**. The review returns to Pending and Moderators are alerted. If your links or options changed, use `/ledger-character submit` again.'});
  // Keep "Review <key> • Revision <n>" at the end of the footer: post lookup depends on it.
  const embed=card({title:`🧙 Character review: ${c.name}`,description:`**Status: ${status}**\nPlayer: <@${c.player_id}>${testNote('\n*TEST system: not a live approval.*')}`,tone:{pending:'pending',approved:'success',rejected:'warning',retired:'neutral'}[c.status],fields,footer:`Review ${key} • Revision ${c.revision}`});
  const row=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`char-review:approved:${key}:${c.revision}`).setLabel('Approve').setStyle(ButtonStyle.Success).setDisabled(c.status!=='pending'),
    new ButtonBuilder().setCustomId(`char-review:rejected:${key}:${c.revision}`).setLabel('Request Changes').setStyle(ButtonStyle.Secondary).setDisabled(c.status==='rejected'||c.status==='retired'),
    new ButtonBuilder().setCustomId(`char-resubmit:${key}:${c.revision}`).setLabel('Resubmit Changes').setStyle(ButtonStyle.Primary).setDisabled(c.status!=='rejected'));
  return {content:c.status==='pending'?`<@&${roleId}> — a character is ready for review.`:'Character review completed.',embeds:[embed],components:[row],allowedMentions:{parse:[],roles:c.status==='pending'?[roleId]:[],users:[]}};
}

export class ReviewPosts{
  constructor(pool,client,guildId,forumId,roleId){Object.assign(this,{pool,client,guildId,forumId,roleId});}
  async byKey(key){
    if(!/^[a-f0-9]{32}$/.test(key))throw new UserError('Invalid review reference.');
    const c=(await this.pool.query("SELECT * FROM ledger_test_characters WHERE guild_id=$1 AND md5(guild_id || ':' || player_id || ':' || name_key)=$2",[this.guildId,key])).rows[0];
    if(!c)throw new UserError('That submission was not found.');return c;
  }
  async sync(playerId,name){
    if(!/^\d{17,20}$/.test(this.forumId??'')||!/^\d{17,20}$/.test(this.roleId??''))throw new UserError('Review forum or moderator role is not configured.');
    const db=await this.pool.connect();
    try{
      await db.query('BEGIN');
      const c=(await db.query('SELECT * FROM ledger_test_characters WHERE guild_id=$1 AND player_id=$2 AND name_key=$3 FOR UPDATE',[this.guildId,playerId,name.trim().toLowerCase()])).rows[0];
      if(!c)throw new UserError('Submission not found.');
      const forum=await this.client.channels.fetch(this.forumId);
      if(forum?.type!==ChannelType.GuildForum||forum.guildId!==this.guildId)throw new UserError('The configured characters channel must be a forum in this server.');
      const role=await forum.guild.roles.fetch(this.roleId);
      if(!role)throw new UserError(`Moderator role ${this.roleId} isn\u2019t a role in this server. Check the first ID in MODERATOR_ROLE_IDS in Vercel, then redeploy.`);
      if(c.status==='pending'&&!role.mentionable&&!forum.permissionsFor(this.client.user)?.has('MentionEveryone'))throw new UserError('The Moderator role cannot be notified. Allow Ledger Mention @everyone, @here, and All Roles in the characters forum, or make that role mentionable.');
      let post=(await db.query('SELECT * FROM ledger_test_review_posts WHERE guild_id=$1 AND player_id=$2 AND name_key=$3',[this.guildId,playerId,c.name_key])).rows[0];
      let thread;
      if(post){
        try{thread=await this.client.channels.fetch(post.thread_id);}catch(e){if(e.code!==10003)throw e;}
      }
      const key=reviewKey(c);
      if(!thread){
        // Recover a forum post created before a crash or a failed DB commit.
        let found=await findReviewThread((await forum.threads.fetchActive()).threads,c,key,this.client.user.id);
        if(!found){
          let before;
          for(let page=0;page<20;page++){
            const archive=await forum.threads.fetchArchived({limit:100,...(before?{before}:{})});
            found=await findReviewThread(archive.threads,c,key,this.client.user.id);
            if(found||!archive.hasMore)break;
            const oldest=archive.threads.last();
            if(!oldest?.archiveTimestamp||page===19)throw new UserError('Could not finish searching archived review posts; staff review is needed before creating another.');
            before=new Date(oldest.archiveTimestamp);
          }
        }
        thread=found;
      }
      const note=(await db.query('SELECT note FROM ledger_test_character_reviews WHERE guild_id=$1 AND player_id=$2 AND name_key=$3 ORDER BY created_at DESC,request_id DESC LIMIT 1',[this.guildId,playerId,c.name_key])).rows[0]?.note??'';
      const payload=reviewPayload(c,this.roleId,c.status==='pending'?'':note);
      let created=false;
      if(!thread){
        const tag=forum.availableTags.find(t=>t.name.toLowerCase()===(c.status==='pending'?'pending':c.status==='approved'?'approved':'changes requested'));
        if((BigInt(forum.flags?.bitfield??0)&16n)&&!tag)throw new UserError('This forum requires tags. Add Pending, Approved and Changes Requested tags, or disable required tags.');
        thread=await forum.threads.create({name:clean(c.name),message:payload,...(tag?{appliedTags:[tag.id]}:{})});
        created=true;
      }
      if(thread.parentId!==this.forumId||thread.ownerId!==this.client.user.id)throw new UserError('Stored review post does not belong to this bot and forum.');
      if(thread.archived)await thread.setArchived(false);
      if(thread.name!==clean(c.name))await thread.setName(clean(c.name));
      const starter=await thread.fetchStarterMessage();
      if(!starter||starter.author.id!==this.client.user.id)throw new UserError('The review starter message is missing. Staff assistance is needed.');
      const previouslyAnnounced=post?.last_ping_revision??0;
      if(!created)await starter.edit({...payload,allowedMentions:{parse:[]}});
      if(!created&&c.status==='pending'&&previouslyAnnounced<c.revision){
        const marker=`Review ${key} revision ${c.revision} ready`;
        const messages=await thread.messages.fetch({limit:100});
        const notified=messages.some(m=>m.author.id===this.client.user.id&&(m.content.includes(marker)||(m.id===starter.id&&m.embeds[0]?.footer?.text?.endsWith(`Review ${key} • Revision ${c.revision}`)&&previouslyAnnounced===0)));
        if(!notified)await thread.send({content:`<@&${this.roleId}> — ${marker}.`,allowedMentions:{parse:[],roles:[this.roleId],users:[]}});
      }
      await db.query(`INSERT INTO ledger_test_review_posts (guild_id,player_id,name_key,thread_id,message_id,last_ping_revision,presentation_version)
        VALUES ($1,$2,$3,$4,$5,$6,2) ON CONFLICT (guild_id,player_id,name_key)
        DO UPDATE SET thread_id=EXCLUDED.thread_id,message_id=EXCLUDED.message_id,last_ping_revision=EXCLUDED.last_ping_revision,presentation_version=2`,[this.guildId,playerId,c.name_key,thread.id,starter.id,c.status==='pending'?c.revision:previouslyAnnounced]);
      await db.query('UPDATE ledger_test_characters SET needs_publish=false WHERE guild_id=$1 AND player_id=$2 AND name_key=$3',[this.guildId,playerId,c.name_key]);
      await db.query('COMMIT');return `https://discord.com/channels/${this.guildId}/${thread.id}`;
    }catch(e){await db.query('ROLLBACK');throw e;}finally{db.release();}
  }
  async retryPending(){
    const rows=(await this.pool.query(`SELECT c.player_id,c.name FROM ledger_test_characters c
      LEFT JOIN ledger_test_review_posts p USING (guild_id,player_id,name_key)
      WHERE c.guild_id=$1 AND (c.needs_publish=true OR p.presentation_version IS NULL OR p.presentation_version<2)
      ORDER BY c.submitted_at LIMIT 20`,[this.guildId])).rows;
    for(const c of rows){try{await this.sync(c.player_id,c.name);}catch{console.error('A saved character review could not be published; it remains queued.');}}
  }
}
