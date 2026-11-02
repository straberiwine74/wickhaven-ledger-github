import { card, message, clean } from './ui.js';
export class CharacterNotifications{
  constructor(pool,client,guildId){Object.assign(this,{pool,client,guildId});}
  async deliver(requestId){
    const db=await this.pool.connect();
    try{
      await db.query('BEGIN');
      const n=(await db.query("SELECT * FROM ledger_test_character_notifications WHERE guild_id=$1 AND request_id=$2 AND status='pending' AND next_attempt<=now() FOR UPDATE SKIP LOCKED",[this.guildId,requestId])).rows[0];
      if(!n){await db.query('ROLLBACK');return 'not-pending';}
      const c=(await db.query('SELECT name,status FROM ledger_test_characters WHERE guild_id=$1 AND player_id=$2 AND name_key=$3',[this.guildId,n.player_id,n.name_key])).rows[0];
      const review=(await db.query('SELECT request_id,note,decision FROM ledger_test_character_reviews WHERE guild_id=$1 AND player_id=$2 AND name_key=$3 ORDER BY created_at DESC,request_id DESC LIMIT 1',[this.guildId,n.player_id,n.name_key])).rows[0];
      if(c?.status!=='rejected'||review?.request_id!==requestId||review.decision!=='rejected'){
        await db.query("UPDATE ledger_test_character_notifications SET status='obsolete' WHERE guild_id=$1 AND request_id=$2",[this.guildId,requestId]);
        await db.query('COMMIT');return 'obsolete';
      }
      const post=(await db.query('SELECT thread_id FROM ledger_test_review_posts WHERE guild_id=$1 AND player_id=$2 AND name_key=$3',[this.guildId,n.player_id,n.name_key])).rows[0];
      const link=post?`https://discord.com/channels/${this.guildId}/${post.thread_id}`:'Open the characters review forum in the server.';
      let status='sent',errorCode=null;
      try{
        const user=await this.client.users.fetch(n.player_id);
        await user.send(message(card({title:`✏️ Changes requested: ${clean(c.name)}`,description:'Staff reviewed your character and asked for a few changes before approval.',tone:'warning',fields:[
          {name:'What to change',value:review.note},
          {name:'Review post',value:link},
          {name:'When you\u2019re done',value:'Click **Resubmit Changes** in the review post, or use `/ledger-character resubmit` with the same name. If your links, stat set, or resource choice changed, use `/ledger-character submit` again instead. Your review returns to Pending and Moderators are alerted.'}]}),{nonce:requestId,enforceNonce:true}));
      }catch(error){
        errorCode=String(Number.isInteger(error.code)?error.code:'unknown');
        status=[50007,10013,50001,50013].includes(error.code)?'blocked':n.attempts>=4?'failed':'pending';
      }
      await db.query(`UPDATE ledger_test_character_notifications SET status=$3,attempts=attempts+1,last_error=$4,
        delivered_at=CASE WHEN $3='sent' THEN now() ELSE NULL END,
        next_attempt=now()+interval '5 minutes' WHERE guild_id=$1 AND request_id=$2`,[this.guildId,requestId,status,errorCode]);
      await db.query('COMMIT');return status;
    }catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
  }
  async retryPending(){
    const rows=(await this.pool.query("SELECT request_id FROM ledger_test_character_notifications WHERE guild_id=$1 AND status='pending' AND next_attempt<=now() ORDER BY next_attempt LIMIT 20",[this.guildId])).rows;
    for(const row of rows){try{await this.deliver(row.request_id);}catch{console.error('A character DM could not be confirmed; the saved request remains.');}}
  }
  async latest(playerId,name){
    return(await this.pool.query(`SELECT n.status,n.last_error FROM ledger_test_character_notifications n
      JOIN ledger_test_character_reviews r USING (guild_id,request_id)
      WHERE n.guild_id=$1 AND n.player_id=$2 AND n.name_key=$3 ORDER BY r.created_at DESC,r.request_id DESC LIMIT 1`,[this.guildId,playerId,name.trim().toLowerCase()])).rows[0];
  }
}
export async function notifyChanges(ledger,requestId){
  if(!ledger.notifications)return 'Player DM notifications are not configured.';
  try{
    const state=await ledger.notifications.deliver(requestId);
    if(state==='sent')return 'The player was sent a DM with the requested changes.';
    if(state==='blocked')return 'Discord blocked the player DM. The request is saved in the review post; contact the player there.';
    if(state==='failed')return 'DM delivery failed after retries. The request remains saved; contact the player in the review post.';
    if(state==='obsolete')return 'This request was superseded; no outdated DM was sent.';
    return 'DM delivery is queued or already processed. Check /ledger-review for delivery status.';
  }catch{return 'The changes were saved, but DM delivery could not be confirmed. It remains queued for retry.';}
}
