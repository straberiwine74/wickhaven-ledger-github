import { createHash } from 'node:crypto';
import { ActionRowBuilder,ButtonBuilder,ButtonStyle,ChannelType,EmbedBuilder } from 'discord.js';
import { UserError } from './admin.js';

export const reviewKey=c=>createHash('md5').update(`${c.guild_id}:${c.player_id}:${c.name_key}`).digest('hex');
const clean=s=>s.replace(/[\r\n]/g,' ').slice(0,60);
export function reviewPayload(c,roleId,note=''){
  const key=reviewKey(c);
  const status={pending:'Pending review',approved:'Approved',rejected:'Changes requested'}[c.status];
  const embed=new EmbedBuilder().setTitle(`Character review: ${c.name}`).setColor(c.status==='approved'?0x3c9c63:c.status==='rejected'?0xcf9240:0x527cba)
    .setDescription(`**Status: ${status}**\nPlayer: <@${c.player_id}>\n**TEST SYSTEM — not live approval**`)
    .addFields(
      {name:'Character sheet',value:c.sheet_url},
      {name:`Ability scores — chosen set ${c.stat_set}`,value:c.stats_url},
      {name:'RP writing sample',value:c.sample_url},
      {name:'Starting resources',value:`${c.resources==='gold'?'Gold':'Equipment'} from BOTH class and background`},
      {name:'Creation rules to verify',value:'Level 3 • 2024 rules • official WotC only • legacy only where no 2024 option exists. Verify sheet ownership, chosen stat-set reaction, RP sample and resources manually.'})
    .setFooter({text:`Review ${key} • Revision ${c.revision}`});
  if(note)embed.addFields({name:c.status==='rejected'?'Changes requested by staff':'Staff review note',value:note});
  const row=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`char-review:approved:${key}:${c.revision}`).setLabel('Approve').setStyle(ButtonStyle.Success).setDisabled(c.status!=='pending'),
    new ButtonBuilder().setCustomId(`char-review:rejected:${key}:${c.revision}`).setLabel('Request Changes').setStyle(ButtonStyle.Secondary).setDisabled(c.status!=='pending'));
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
      if(!role)throw new UserError('Configured moderator role was not found.');
      if(c.status==='pending'&&!role.mentionable&&!forum.permissionsFor(this.client.user)?.has('MentionEveryone'))throw new UserError('The Moderator role cannot be notified. Allow Ledger Mention @everyone, @here, and All Roles in the characters forum, or make that role mentionable.');
      let post=(await db.query('SELECT * FROM ledger_test_review_posts WHERE guild_id=$1 AND player_id=$2 AND name_key=$3',[this.guildId,playerId,c.name_key])).rows[0];
      let thread;
      if(post){
        try{thread=await this.client.channels.fetch(post.thread_id);}catch(e){if(e.code!==10003)throw e;}
      }
      const key=reviewKey(c);
      if(!thread){
        // Recover a forum post created before a crash or a failed DB commit.
        let found=(await forum.threads.fetchActive()).threads.find(t=>t.ownerId===this.client.user.id&&t.name.endsWith(`[${key}]`));
        if(!found){
          let before;
          for(let page=0;page<20;page++){
            const archive=await forum.threads.fetchArchived({limit:100,...(before?{before}:{})});
            found=archive.threads.find(t=>t.ownerId===this.client.user.id&&t.name.endsWith(`[${key}]`));
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
        thread=await forum.threads.create({name:`${clean(c.name)} [${key}]`.slice(0,100),message:payload,...(tag?{appliedTags:[tag.id]}:{})});
        created=true;
      }
      if(thread.parentId!==this.forumId||thread.ownerId!==this.client.user.id)throw new UserError('Stored review post does not belong to this bot and forum.');
      if(thread.archived)await thread.setArchived(false);
      const starter=await thread.fetchStarterMessage();
      if(!starter||starter.author.id!==this.client.user.id)throw new UserError('The review starter message is missing. Staff assistance is needed.');
      const previouslyAnnounced=post?.last_ping_revision??0;
      if(!created)await starter.edit({...payload,allowedMentions:{parse:[]}});
      if(!created&&c.status==='pending'&&previouslyAnnounced<c.revision){
        const marker=`Review ${key} revision ${c.revision} ready`;
        const messages=await thread.messages.fetch({limit:100});
        const notified=messages.some(m=>m.author.id===this.client.user.id&&(m.content.includes(marker)||(m.id===starter.id&&m.embeds[0]?.footer?.text===`Review ${key} • Revision ${c.revision}`&&previouslyAnnounced===0)));
        if(!notified)await thread.send({content:`<@&${this.roleId}> — ${marker}.`,allowedMentions:{parse:[],roles:[this.roleId],users:[]}});
      }
      await db.query(`INSERT INTO ledger_test_review_posts (guild_id,player_id,name_key,thread_id,message_id,last_ping_revision)
        VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (guild_id,player_id,name_key)
        DO UPDATE SET thread_id=EXCLUDED.thread_id,message_id=EXCLUDED.message_id,last_ping_revision=EXCLUDED.last_ping_revision`,[this.guildId,playerId,c.name_key,thread.id,starter.id,c.status==='pending'?c.revision:previouslyAnnounced]);
      await db.query('UPDATE ledger_test_characters SET needs_publish=false WHERE guild_id=$1 AND player_id=$2 AND name_key=$3',[this.guildId,playerId,c.name_key]);
      await db.query('COMMIT');return `https://discord.com/channels/${this.guildId}/${thread.id}`;
    }catch(e){await db.query('ROLLBACK');throw e;}finally{db.release();}
  }
  async retryPending(){
    const rows=(await this.pool.query('SELECT player_id,name FROM ledger_test_characters WHERE guild_id=$1 AND needs_publish=true ORDER BY submitted_at LIMIT 20',[this.guildId])).rows;
    for(const c of rows){try{await this.sync(c.player_id,c.name);}catch{console.error('A saved character review could not be published; it remains queued.');}}
  }
}
