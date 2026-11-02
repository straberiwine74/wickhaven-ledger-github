import { randomUUID } from 'node:crypto';
import { importBags, hasResourceChanges, matchesEnding, resourceReceipt } from './quest-resources.js';
import { transition, defaultDie, questOf, available, isTerminal } from './quest-engine.js';
import { getQuest } from './quests/index.js';
import { SKILLS, ABILITIES, LEGACY_SKILLS, apMilestones } from './quest-schema.js';
import { awardGameplayAP, awardSchema } from './store.js';
export { transition };

export const skillNames = LEGACY_SKILLS;
function requireValue(ok, message) { if (!ok) throw new Error(message); }
function integer(n, min, max) { return Number.isInteger(n) && n >= min && n <= max; }
// v3 exports the full Avrae sheet compactly: sk (18 skills), sv (6 saves),
// ck (6 ability checks), ab (6 scores) and adv (advantage by key, e.g.
// "stealth", "save.dex", "check.str"). Expand it into {mod,adv} entries.
function expandSheet(s) {
  const adv=s.adv??{},num=(o,k)=>o?.[k];
  requireValue(s.sk&&s.sv&&s.ck&&s.ab&&typeof adv==='object'&&!Array.isArray(adv),'Departure data is missing the full character sheet.');
  for(const v of Object.values(adv)) requireValue(v===true||v===false,'Invalid advantage entry.');
  const out={...s,skills:{},saves:{},checks:{},abilities:{}};
  for(const k of Object.keys(SKILLS)) out.skills[k]={mod:num(s.sk,k),adv:adv[k]??null};
  for(const k of Object.keys(ABILITIES)) {out.saves[k]={mod:num(s.sv,k),adv:adv['save.'+k]??null};out.checks[k]={mod:num(s.ck,k),adv:adv['check.'+k]??null};out.abilities[k]=num(s.ab,k);}
  for(const k of ['sk','sv','ck','ab','adv']) delete out[k];
  return out;
}

export function validateSnapshot(s) {
  requireValue(s && [1,2,3].includes(s.v) && (s.v===3 ? !!getQuest(s.quest) : s.quest === 'drowned-watch'), 'Unsupported snapshot or quest.');
  requireValue(JSON.stringify(s).length<=6000,'Snapshot too large. Reduce manifest entries.');
  s=structuredClone(s);
  if(s.v===3) s=expandSheet(s);
  if(s.v>=2) {
    requireValue(s.loadout?.source==='bags-rewritten','Invalid carried bags.');
    s.loadout.items=importBags(s.loadout);
    requireValue(!s.reconcile || /^[a-f0-9-]{36}$/.test(s.reconcile),'Invalid reconciliation reference.');
  }
  for (const k of ['guild','channel','player','invocation']) requireValue(/^\d{17,20}$/.test(s[k]), `Invalid ${k}.`);
  requireValue(/^beyond-\d+$/.test(s.character), 'Use an imported D&D Beyond character.');
  requireValue(typeof s.name === 'string' && s.name.length > 0 && s.name.length <= 80 && !/[`\r\n]/.test(s.name), 'Invalid character name.');
  requireValue(integer(s.hp,s.v>=2?0:1,999) && integer(s.maxHp,Math.max(1,s.hp),999) && integer(s.tempHp,0,999), 'Invalid HP.');
  requireValue(integer(s.passive,1,50), 'Declare and review actual passive Perception.');
  const entryOk=e=>e && integer(e.mod,-10,40) && [true,false,null].includes(e.adv);
  for (const key of s.v===3?Object.keys(SKILLS):skillNames) requireValue(entryOk(s.skills?.[key]), `Invalid ${SKILLS[key]??key}.`);
  if(s.v===3) {
    for(const a of Object.keys(ABILITIES)) requireValue(entryOk(s.saves?.[a])&&entryOk(s.checks?.[a])&&integer(s.abilities?.[a],1,30),`Invalid ${ABILITIES[a]}.`);
    requireValue(integer(s.level,1,20),'Invalid character level.');
    requireValue(['declared','computed'].includes(s.passiveSource),'Invalid passive Perception source.');
  }
  requireValue((s.v>=2||s.loadout?.source === 'declared-manifest') && Array.isArray(s.loadout.items) && s.loadout.items.length <= (s.v>=2?60:20), 'A declared loadout is required (maximum 20 entries).');
  const seen = new Set();
  for (const item of s.loadout.items) {
    requireValue(s.v>=2 || (typeof item.name === 'string' && /^[a-zA-Z0-9 ()'’.,/-]{1,60}$/.test(item.name) && integer(item.qty,1,999)), 'Invalid loadout item.');
    const key=JSON.stringify([item.bag??'',item.name.toLowerCase()]);
    requireValue(!seen.has(key), 'Combine duplicate inventory entries.'); seen.add(key);
  }
  for (const coin of ['pp','gp','ep','sp','cp']) requireValue(integer(s.coins?.[coin],0,1000000), 'Invalid coins.');
  requireValue(typeof s.signature === 'string' && s.signature.length < 300, 'Missing Avrae signature.');
  return JSON.parse(JSON.stringify(s));
}

export function parseVerificationResponse(body) {
  // Preserve numeric Discord IDs before JSON parsing, including nested data.
  const result=JSON.parse(body.replace(/"(message_id|channel_id|author_id|guild_id)"\s*:\s*(\d+)/g,'"$1":"$2"'));
  if (Object.hasOwn(result,'success')) {
    requireValue(result.success === true && result.data && typeof result.data === 'object' && !Array.isArray(result.data), 'Avrae signature verification unavailable.');
    return result.data;
  }
  // Also support the flat response described in Avrae's alias API docs.
  requireValue(result && typeof result.scope === 'string', 'Avrae signature verification unavailable.');
  return result;
}

// config.channel is the staff test channel; config.liveChannel (optional) is the
// player-facing departures channel, where only quests with status 'live' run.
export const questChannels=config=>[config.channel,config.liveChannel].filter(Boolean);

export async function verifyExport(s, message, config, verify = async signature => {
  const response = await fetch('https://api.avrae.io/bot/signature/verify', {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({signature}), signal:AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Avrae signature verification unavailable.');
  // Snowflakes exceed JavaScript's safe integer range; preserve API numeric IDs.
  const body=await response.text();
  return parseVerificationResponse(body);
}) {
  validateSnapshot(s);
  requireValue(message.author.bot && !message.webhookId && message.author.id === config.avrae, 'Only configured Avrae exports are accepted.');
  requireValue(s.guild === config.guild && questChannels(config).includes(s.channel) && message.guildId === s.guild && message.channelId === s.channel, 'Wrong export channel/server.');
  requireValue(Date.now() - message.createdTimestamp >= -5000 && Date.now() - message.createdTimestamp < 300000, 'Export expired. Run departure again.');
  const proof = await verify(s.signature);
  requireValue(proof.scope === 'SERVER_ALIAS', 'Avrae did not verify a server-alias invocation.');
  requireValue(proof.user_data === 7, 'Avrae signature has the wrong departure marker.');
  requireValue(String(proof.author_id) === s.player, 'Signed player does not match the export.');
  requireValue(String(proof.channel_id) === s.channel, 'Signed channel does not match the export.');
  requireValue(String(proof.message_id) === s.invocation, 'Signed invocation does not match the export.');
  // Guild is cache-derived, not packed into Avrae's signature; the API may
  // omit it. The signed channel is already matched to the actual Discord
  // message channel, whose guild was checked above. Reject a contradictory
  // guild when supplied, without requiring this optional API field.
  requireValue(proof.guild_id == null || String(proof.guild_id) === s.guild, 'Verification server does not match the export.');
  const age = Date.now()/1000 - proof.timestamp;
  requireValue(Number.isFinite(age) && age >= -5 && age < 300, 'Signed departure expired.');
  return s;
}

export const questSchema = [
  `CREATE TABLE IF NOT EXISTS ledger_quest_test_runs (id text PRIMARY KEY, guild_id text NOT NULL, player_id text NOT NULL, character_id text NOT NULL, snapshot jsonb NOT NULL, state jsonb NOT NULL, revision integer NOT NULL DEFAULT 0, finished boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE UNIQUE INDEX IF NOT EXISTS ledger_quest_test_unfinished ON ledger_quest_test_runs(guild_id,player_id,character_id) WHERE NOT finished`,
  `CREATE TABLE IF NOT EXISTS ledger_quest_test_knowledge (guild_id text NOT NULL, character_id text NOT NULL, fact text NOT NULL, PRIMARY KEY(guild_id,character_id,fact))`,
  `CREATE TABLE IF NOT EXISTS ledger_quest_test_rewards (guild_id text NOT NULL, character_id text NOT NULL, reward text NOT NULL, run_id text NOT NULL, PRIMARY KEY(guild_id,character_id,reward))`,
  `CREATE TABLE IF NOT EXISTS ledger_quest_test_events (run_id text NOT NULL, revision integer NOT NULL, action text NOT NULL, state jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(run_id,revision))`,
  `CREATE TABLE IF NOT EXISTS ledger_quest_test_receipts (run_id text PRIMARY KEY REFERENCES ledger_quest_test_runs(id), guild_id text NOT NULL, player_id text NOT NULL, character_id text NOT NULL, receipt jsonb NOT NULL, status text NOT NULL CHECK(status IN ('pending','no-change','verified')), verified_at timestamptz, created_at timestamptz NOT NULL DEFAULT now())`
];

// Kept for older callers and tests: is the Drowned Watch tide-box offered?
export function tideBoxOffered(run) {
  const choice=questOf(run).scenes[run.state.scene]?.choices.find(c=>c.id==='tidebox');
  return !!choice&&available(run,choice);
}

export class QuestStore {
  constructor(pool, die=defaultDie) { this.pool=pool; this.die=die; }
  async init() { for (const sql of questSchema) await this.pool.query(sql); await this.pool.query(awardSchema); }
  async open(s) {
    s=validateSnapshot(s);
    const db=await this.pool.connect();
    try {
    await db.query('BEGIN');
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',[s.guild,s.character]);
    // The immutable snapshot belongs to an approved sheet, never a displayed name.
    const approved=await db.query(`SELECT 1 FROM ledger_test_characters WHERE guild_id=$1 AND player_id=$2 AND sheet_id=$3 AND status='approved'`,[s.guild,s.player,s.character.slice(7)]);
    requireValue(approved.rows.length,'This imported sheet needs Ledger TEST approval first.');
    const existing=(await db.query(`SELECT * FROM ledger_quest_test_runs WHERE guild_id=$1 AND player_id=$2 AND character_id=$3 AND NOT finished`,[s.guild,s.player,s.character])).rows[0];
    if(existing) {await db.query('COMMIT');return existing;}
    requireValue(s.hp>0,'Recover HP before starting a new expedition.');
    const pending=(await db.query(`SELECT run_id FROM ledger_quest_test_receipts WHERE guild_id=$1 AND character_id=$2 AND status='pending' LIMIT 1`,[s.guild,s.character])).rows[0];
    requireValue(!pending,'Reconcile the previous expedition receipt before a new departure.');
    const quest=getQuest(s.quest);requireValue(quest&&quest.status!=='hidden','This quest is not available.');
    const state={scene:'review',hp:s.hp,tempHp:s.tempHp,coins:s.coins,items:s.loadout.items,text:'Review your exported character and carried bags. Confirming locks this expedition.'};
    const run=(await db.query(`INSERT INTO ledger_quest_test_runs(id,guild_id,player_id,character_id,snapshot,state) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[randomUUID(),s.guild,s.player,s.character,JSON.stringify(s),JSON.stringify(state)])).rows[0];
    await db.query('COMMIT');return run;
    } catch(e) {await db.query('ROLLBACK');throw e;} finally {db.release();}
  }
  async inspect(id,guild,player) {
    const run=(await this.pool.query('SELECT * FROM ledger_quest_test_runs WHERE id=$1 AND guild_id=$2 AND player_id=$3',[id,guild,player])).rows[0];
    requireValue(run,'These expedition buttons belong to another player.');return run;
  }
  async reconcile(s) {
    s=validateSnapshot(s);const db=await this.pool.connect();
    try {
      await db.query('BEGIN');
      const run=(await db.query(`SELECT r.* FROM ledger_quest_test_runs r JOIN ledger_quest_test_receipts t ON t.run_id=r.id WHERE r.id=$1 AND r.guild_id=$2 AND r.player_id=$3 AND r.character_id=$4 FOR UPDATE OF t`,[s.reconcile,s.guild,s.player,s.character])).rows[0];
      requireValue(run&&run.finished&&s.v>=2&&run.snapshot.v>=2,'No matching completed bag expedition receipt.');
      requireValue(matchesEnding(run,s),'Exported bags, HP or currency do not match the ending receipt.');
      await db.query(`UPDATE ledger_quest_test_receipts SET status='verified',verified_at=now() WHERE run_id=$1`,[run.id]);
      await db.query('COMMIT');return run;
    } catch(e) {await db.query('ROLLBACK');throw e;} finally {db.release();}
  }
  async act(id,guild,player,revision,action) {
    const db=await this.pool.connect();
    try {
      await db.query('BEGIN');
      const run=(await db.query('SELECT * FROM ledger_quest_test_runs WHERE id=$1 FOR UPDATE',[id])).rows[0];
      requireValue(run && run.guild_id===guild && run.player_id===player,'These expedition buttons belong to another player.');
      if(run.revision!==revision || run.finished) { await db.query('COMMIT'); return run; }
      if(action==='revisit') throw new Error('Start a fresh visit with !depart.');
      const known=(await db.query('SELECT fact FROM ledger_quest_test_knowledge WHERE guild_id=$1 AND character_id=$2',[guild,run.character_id])).rows.map(x=>x.fact);
      const state=transition(run,action,this.die,known);
      for(const fact of state.facts??[]) await db.query('INSERT INTO ledger_quest_test_knowledge VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[guild,run.character_id,fact]);
      const ended=isTerminal(state.scene)&&state.scene!=='cancelled';
      if(ended) {
        const quest=questOf(run);
        // Milestones are journal records today; real AP is attached to them later.
        const reached=[...(state.milestones??[]),...(state.scene==='complete'?[quest.completion.milestone]:[])];
        const paying=quest.status==='live'?apMilestones(quest):new Set();let ap=0,capped=0;
        for(const m of reached) {
          const fresh=(await db.query(`INSERT INTO ledger_quest_test_rewards VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING reward`,[guild,run.character_id,m,id])).rows.length>0;
          if(m===quest.completion.milestone) state.text+=fresh?quest.completion.first:quest.completion.repeat;
          if(fresh&&paying.has(m)) {
            const r=await awardGameplayAP(db,{guildId:guild,playerId:run.player_id,source:'quest',ref:`quest:${run.character_id}:${m}`,detail:`${quest.id} ${m}`});
            ap+=r.awarded;if(r.capped) capped++;
          }
        }
        state.apAwarded=ap;state.apCapped=capped;
        if(ap) state.text+=`\n**+${ap} AP** for ${ap===1?'a first-time milestone':'first-time milestones'}.`;
        if(capped) state.text+=`\nDaily AP cap reached: ${capped===1?'that milestone was':'those milestones were'} recorded without AP.`;
      }
      await db.query('INSERT INTO ledger_quest_test_events(run_id,revision,action,state) VALUES($1,$2,$3,$4)',[id,revision+1,action,JSON.stringify(state)]);
      const saved=(await db.query('UPDATE ledger_quest_test_runs SET state=$2,revision=revision+1,finished=$3 WHERE id=$1 RETURNING *',[id,JSON.stringify(state),isTerminal(state.scene)])).rows[0];
      if(ended) await db.query('INSERT INTO ledger_quest_test_receipts(run_id,guild_id,player_id,character_id,receipt,status) VALUES($1,$2,$3,$4,$5,$6)',[id,guild,player,run.character_id,JSON.stringify(resourceReceipt(saved)),hasResourceChanges(saved)?'pending':'no-change']);
      await db.query('COMMIT'); return saved;
    } catch(e) { await db.query('ROLLBACK'); throw e; } finally { db.release(); }
  }
  async knowledge(run) { return (await this.pool.query('SELECT fact FROM ledger_quest_test_knowledge WHERE guild_id=$1 AND character_id=$2 ORDER BY fact',[run.guild_id,run.character_id])).rows.map(x=>x.fact); }
}
