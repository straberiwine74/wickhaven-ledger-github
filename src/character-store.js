import { UserError } from './admin.js';
import { characterInput, slotState } from './characters.js';

export const characterSchema = [
  `CREATE TABLE IF NOT EXISTS ledger_test_character_accounts (
    guild_id text NOT NULL,player_id text NOT NULL,first_approved_at timestamptz,
    earned_slots integer NOT NULL DEFAULT 2 CHECK (earned_slots BETWEEN 2 AND 4),
    PRIMARY KEY (guild_id,player_id))`,
  `CREATE TABLE IF NOT EXISTS ledger_test_characters (
    guild_id text NOT NULL,player_id text NOT NULL,name_key text NOT NULL,name text NOT NULL,
    sheet_id text NOT NULL,sheet_url text NOT NULL,stats_url text NOT NULL,sample_url text NOT NULL,
    stat_set integer NOT NULL,resources text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    approved_at timestamptz,submitted_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (guild_id,player_id,name_key),UNIQUE (guild_id,sheet_id))`,
  `CREATE TABLE IF NOT EXISTS ledger_test_character_reviews (
    guild_id text NOT NULL,request_id text NOT NULL,player_id text NOT NULL,name_key text NOT NULL,
    moderator_id text NOT NULL,decision text NOT NULL,note text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY (guild_id,request_id))`,
  `ALTER TABLE ledger_test_characters ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1`,
  `ALTER TABLE ledger_test_characters ADD COLUMN IF NOT EXISTS needs_publish boolean NOT NULL DEFAULT true`,
  `CREATE TABLE IF NOT EXISTS ledger_test_review_posts (
    guild_id text NOT NULL,player_id text NOT NULL,name_key text NOT NULL,
    thread_id text NOT NULL,message_id text NOT NULL,last_ping_revision integer NOT NULL DEFAULT 0,
    PRIMARY KEY (guild_id,player_id,name_key))`,
  `ALTER TABLE ledger_test_review_posts ADD COLUMN IF NOT EXISTS presentation_version integer NOT NULL DEFAULT 0`,
  `CREATE TABLE IF NOT EXISTS ledger_test_character_notifications (
    guild_id text NOT NULL,request_id text NOT NULL,player_id text NOT NULL,name_key text NOT NULL,
    status text NOT NULL DEFAULT 'pending',attempts integer NOT NULL DEFAULT 0,
    next_attempt timestamptz NOT NULL DEFAULT now(),delivered_at timestamptz,last_error text,
    PRIMARY KEY (guild_id,request_id))`,
  `INSERT INTO ledger_test_character_notifications (guild_id,request_id,player_id,name_key)
    SELECT r.guild_id,r.request_id,r.player_id,r.name_key FROM ledger_test_character_reviews r
    JOIN ledger_test_characters c USING (guild_id,player_id,name_key)
    WHERE r.decision='rejected' AND c.status='rejected' AND NOT EXISTS (
      SELECT 1 FROM ledger_test_character_reviews newer WHERE newer.guild_id=r.guild_id AND newer.player_id=r.player_id AND newer.name_key=r.name_key
      AND (newer.created_at>r.created_at OR (newer.created_at=r.created_at AND newer.request_id>r.request_id)))
    ON CONFLICT DO NOTHING`
];

async function accountLock(db,guildId,playerId) {
  await db.query('INSERT INTO ledger_test_character_accounts (guild_id,player_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',[guildId,playerId]);
  return (await db.query('SELECT * FROM ledger_test_character_accounts WHERE guild_id=$1 AND player_id=$2 FOR UPDATE',[guildId,playerId])).rows[0];
}
async function progress(db,guildId,playerId,account,now) {
  const counts = (await db.query('SELECT COALESCE(sum(ap),0)::integer AS total, count(*) FILTER (WHERE ap>0)::integer AS active FROM ledger_test_days WHERE guild_id=$1 AND player_id=$2',[guildId,playerId])).rows[0];
  const state = slotState(account.first_approved_at,account.earned_slots,counts.total,counts.active,now);
  if (state.unlocked > account.earned_slots) await db.query('UPDATE ledger_test_character_accounts SET earned_slots=$3 WHERE guild_id=$1 AND player_id=$2',[guildId,playerId,state.unlocked]);
  return state;
}

export class CharacterStore {
  constructor(pool) { this.pool=pool; }
  async submit(guildId,playerId,input) {
    const c=characterInput(input,guildId);
    const db=await this.pool.connect();
    try {
      await db.query('BEGIN');
      await accountLock(db,guildId,playerId);
      const prior=(await db.query('SELECT status FROM ledger_test_characters WHERE guild_id=$1 AND player_id=$2 AND name_key=$3',[guildId,playerId,c.nameKey])).rows[0];
      if (prior?.status==='approved') throw new UserError('That character is already approved. Ask staff about changes to an approved submission.');
      await db.query(`INSERT INTO ledger_test_characters (guild_id,player_id,name_key,name,sheet_id,sheet_url,stats_url,sample_url,stat_set,resources)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (guild_id,player_id,name_key)
        DO UPDATE SET name=EXCLUDED.name,sheet_id=EXCLUDED.sheet_id,sheet_url=EXCLUDED.sheet_url,stats_url=EXCLUDED.stats_url,sample_url=EXCLUDED.sample_url,stat_set=EXCLUDED.stat_set,resources=EXCLUDED.resources,status='pending',submitted_at=now(),revision=ledger_test_characters.revision+1,needs_publish=true`,
      [guildId,playerId,c.nameKey,c.name,c.sheetId,c.sheet,c.stats,c.sample,c.set,c.resources]);
      await db.query('COMMIT'); return c;
    } catch(e) {await db.query('ROLLBACK'); if(e.code==='23505') throw new UserError('That sheet is already submitted under another character or player. Ask staff to review it.'); throw e;}
    finally{db.release();}
  }
  async list(guildId,playerId) {
    return (await this.pool.query(`SELECT c.name,c.status,c.approved_at,
      (SELECT r.note FROM ledger_test_character_reviews r WHERE r.guild_id=c.guild_id AND r.player_id=c.player_id AND r.name_key=c.name_key
       ORDER BY r.created_at DESC,r.request_id DESC LIMIT 1) AS review_note
      FROM ledger_test_characters c WHERE c.guild_id=$1 AND c.player_id=$2 ORDER BY c.submitted_at`,[guildId,playerId])).rows;
  }
  async review(guildId,playerId,name) {
    const c=(await this.pool.query('SELECT * FROM ledger_test_characters WHERE guild_id=$1 AND player_id=$2 AND name_key=$3',[guildId,playerId,name.trim().toLowerCase()])).rows[0];
    if(!c) throw new UserError('No submission with that name was found for this player.');
    return c;
  }
  async resubmit(guildId,playerId,name,expectedRevision){
    const db=await this.pool.connect();
    try{
      await db.query('BEGIN');await accountLock(db,guildId,playerId);
      const c=(await db.query('SELECT * FROM ledger_test_characters WHERE guild_id=$1 AND player_id=$2 AND name_key=$3',[guildId,playerId,name.trim().toLowerCase()])).rows[0];
      if(!c)throw new UserError('No submission with that name belongs to your account.');
      if(c.status!=='rejected')throw new UserError('Resubmission is available only after staff request changes.');
      if(expectedRevision!==undefined&&c.revision!==expectedRevision)throw new UserError('This review changed. Refresh the review post before resubmitting.');
      await db.query("UPDATE ledger_test_characters SET status='pending',approved_at=NULL,revision=revision+1,needs_publish=true,submitted_at=now() WHERE guild_id=$1 AND player_id=$2 AND name_key=$3",[guildId,playerId,c.name_key]);
      await db.query('COMMIT');return {name:c.name,revision:c.revision+1};
    }catch(e){await db.query('ROLLBACK');throw e;}finally{db.release();}
  }
  async slots(guildId,playerId,now=new Date()) {
    const db=await this.pool.connect();
    try {
      await db.query('BEGIN');
      const account=await accountLock(db,guildId,playerId);
      const state=await progress(db,guildId,playerId,account,now);
      const approved=(await db.query("SELECT count(*)::integer AS count FROM ledger_test_characters WHERE guild_id=$1 AND player_id=$2 AND status='approved'",[guildId,playerId])).rows[0].count;
      await db.query('COMMIT'); return {...state,approved};
    }catch(e){await db.query('ROLLBACK');throw e;}finally{db.release();}
  }
  async decide({guildId,playerId,name,moderatorId,requestId,decision,note,now=new Date(),expectedRevision}) {
    if(!['approved','rejected'].includes(decision)) throw new UserError('Invalid review decision.');
    note=note.trim();
    if(note.length<5||note.length>300) throw new UserError('Provide a review note of 5–300 characters.');
    const key=name.trim().toLowerCase();
    const db=await this.pool.connect();
    try{
      await db.query('BEGIN');
      const account=await accountLock(db,guildId,playerId);
      const prior=(await db.query('SELECT decision FROM ledger_test_character_reviews WHERE guild_id=$1 AND request_id=$2',[guildId,requestId])).rows[0];
      if(prior){await db.query('ROLLBACK');return {duplicate:true,decision:prior.decision};}
      const c=(await db.query('SELECT * FROM ledger_test_characters WHERE guild_id=$1 AND player_id=$2 AND name_key=$3',[guildId,playerId,key])).rows[0];
      if(!c) throw new UserError('That player has no submission with that name.');
      if(expectedRevision!==undefined&&c.revision!==expectedRevision)throw new UserError('This submission changed after the review was opened. Review the latest post before deciding.');
      if(c.status!=='pending'&&!(decision==='rejected'&&c.status==='approved')) throw new UserError(c.status==='rejected'?'Changes were requested. The player must resubmit before approval.':`That submission is already ${c.status}.`);
      if(decision==='approved') {
        const state=await progress(db,guildId,playerId,account,now);
        const used=(await db.query("SELECT count(*)::integer AS count FROM ledger_test_characters WHERE guild_id=$1 AND player_id=$2 AND status='approved'",[guildId,playerId])).rows[0].count;
        if(used>=state.unlocked) throw new UserError(`No available character slot: ${used}/${state.unlocked} used. Check /ledger-character slots.`);
        await db.query('UPDATE ledger_test_character_accounts SET first_approved_at=COALESCE(first_approved_at,$3) WHERE guild_id=$1 AND player_id=$2',[guildId,playerId,now]);
      }
      await db.query('UPDATE ledger_test_characters SET status=$4,approved_at=$5,needs_publish=true WHERE guild_id=$1 AND player_id=$2 AND name_key=$3',[guildId,playerId,key,decision,decision==='approved'?now:null]);
      await db.query('INSERT INTO ledger_test_character_reviews (guild_id,request_id,player_id,name_key,moderator_id,decision,note) VALUES ($1,$2,$3,$4,$5,$6,$7)',[guildId,requestId,playerId,key,moderatorId,decision,note]);
      if(decision==='rejected')await db.query('INSERT INTO ledger_test_character_notifications (guild_id,request_id,player_id,name_key) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',[guildId,requestId,playerId,key]);
      await db.query('COMMIT');return {duplicate:false,decision,name:c.name};
    }catch(e){await db.query('ROLLBACK');throw e;}finally{db.release();}
  }
}
