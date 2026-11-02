import { randomInt, randomUUID } from 'node:crypto';
import { importBags, hasResourceChanges, matchesEnding, resourceReceipt, spendResources } from './quest-resources.js';

export const skillNames = ['athletics','stealth','investigation','perception'];
function requireValue(ok, message) { if (!ok) throw new Error(message); }
function integer(n, min, max) { return Number.isInteger(n) && n >= min && n <= max; }
export function validateSnapshot(s) {
  requireValue(s && [1,2].includes(s.v) && s.quest === 'drowned-watch', 'Unsupported snapshot or quest.');
  requireValue(JSON.stringify(s).length<=6000,'Snapshot too large. Reduce manifest entries.');
  s=structuredClone(s);
  if(s.v===2) {
    requireValue(s.loadout?.source==='bags-rewritten','Invalid carried bags.');
    s.loadout.items=importBags(s.loadout);
    requireValue(!s.reconcile || /^[a-f0-9-]{36}$/.test(s.reconcile),'Invalid reconciliation reference.');
  }
  for (const k of ['guild','channel','player','invocation']) requireValue(/^\d{17,20}$/.test(s[k]), `Invalid ${k}.`);
  requireValue(/^beyond-\d+$/.test(s.character), 'Use an imported D&D Beyond character.');
  requireValue(typeof s.name === 'string' && s.name.length > 0 && s.name.length <= 80 && !/[`\r\n]/.test(s.name), 'Invalid character name.');
  requireValue(integer(s.hp,s.v===2?0:1,999) && integer(s.maxHp,Math.max(1,s.hp),999) && integer(s.tempHp,0,999), 'Invalid HP.');
  requireValue(integer(s.passive,1,50), 'Declare and review actual passive Perception.');
  for (const key of skillNames) {
    const skill = s.skills?.[key];
    requireValue(skill && integer(skill.mod,-10,40) && [true,false,null].includes(skill.adv), `Invalid ${key}.`);
  }
  requireValue((s.v===2||s.loadout?.source === 'declared-manifest') && Array.isArray(s.loadout.items) && s.loadout.items.length <= (s.v===2?60:20), 'A declared loadout is required (maximum 20 entries).');
  const seen = new Set();
  for (const item of s.loadout.items) {
    requireValue(s.v===2 || (typeof item.name === 'string' && /^[a-zA-Z0-9 ()'’.,/-]{1,60}$/.test(item.name) && integer(item.qty,1,999)), 'Invalid loadout item.');
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
  requireValue(s.guild === config.guild && s.channel === config.channel && message.guildId === s.guild && message.channelId === s.channel, 'Wrong export channel/server.');
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

// One explicitly offered, scene-owned cost. Bag (v2) runs only: v1 manifest
// runs have no reconciliation path, so a cost there could never be cleared.
export const tideBoxCost={coins:{gp:1}};
export function tideBoxOffered(run) {
  return run.snapshot?.v===2 && run.state.scene==='landing' && !run.state.tidebox && (run.state.coins?.gp??0)>=tideBoxCost.coins.gp;
}

export function transition(run, action, die = () => randomInt(1,21)) {
  const state = structuredClone(run.state), snapshot = run.snapshot;
  const draw = () => { const n=die(); requireValue(integer(n,1,20),'Invalid die.'); return n; };
  if (action === 'cancel' && state.scene === 'review') {
    state.scene='cancelled'; state.text='Unconfirmed departure discarded. Correct your manifest or character export, then depart again.';
  } else if (action === 'confirm' && state.scene === 'review') {
    state.scene='shore'; state.text='The Drowned Watch leans above the surf. A chain hangs from its upper landing; each wave pulls it taut. Below, a narrow culvert breathes cold air. The stairs are slick and exposed.';
    state.text += `\nPassive Perception ${snapshot.passive} applied to the approach.`;
    if (snapshot.passive >= 14) { state.text+=' You notice the chain pulls away from sound stone: it could tear loose under weight.'; state.facts=['chain-anchor']; }
  } else if (action === 'retreat' && ['shore','landing'].includes(state.scene)) {
    state.returnTo=state.scene; state.scene='town'; state.text='You withdraw along the clear shore path. No roll or rest. Your expedition and supplies remain locked.';
  } else if (action === 'resume' && state.scene === 'town') {
    state.scene=state.returnTo; state.text=state.returnTo === 'shore' ? 'You return to the same shore approach. Earlier discoveries and resources remain.' : 'You return to the secured landing; the recovered observation remains in your journal.';
  } else if (state.scene === 'shore' && ['climb','sneak','study'].includes(action)) {
    const skillName={climb:'athletics',sneak:'stealth',study:'investigation'}[action];
    const skill=snapshot.skills[skillName], dice=[draw()];
    if (skill.adv !== null) dice.push(draw());
    const face=skill.adv===true?Math.max(...dice):skill.adv===false?Math.min(...dice):dice[0];
    const total=face+skill.mod, success=total >= {climb:13,sneak:12,study:14}[action];
    state.roll={skill:skillName,dice,modifier:skill.mod,total,success};
    state.scene='landing';
    const result={
      climb: success ? 'You climb the exposed stairs and secure the landing. From above, you see the culvert mouth vanish beneath a passing swell.' : 'The chain tears free. You drop onto a lower shelf and reach the landing by a slower route. Your pack catches on the stone; the noise carries into the tower.',
      sneak: success ? 'You slip through the culvert between waves. Moon-shaped scratches mark a concealed side entrance.' : 'A wave drives you back before you can pass. You take the long stairs; a loose shutter begins knocking above you.',
      study: success ? 'You read the surviving harbor marks: the lower passage is usable only at low tide. You follow a marked maintenance route to the landing.' : 'Salt has eaten the key markings. Working slowly, you find a stable maintenance route, but darkness overtakes the outer yard.'
    };
    state.alert = !success && action !== 'study';
    state.text=`${skillName}: ${dice.join(', ')} ${skill.mod<0?'-':'+'} ${Math.abs(skill.mod)} = ${total}.\n${result[action]}`;
    state.facts=[...(state.facts??[]),success?{climb:'culvert-submerges',sneak:'moon-marked-door',study:'culvert-low-tide'}[action]:'maintenance-route'];
  } else if (action === 'tidebox' && state.scene === 'landing') {
    requireValue(tideBoxOffered(run),'The tide-box offering is not available on this visit.');
    const paid=spendResources(state,tideBoxCost);
    paid.tidebox=true;
    paid.text='You drop 1 gp through the slot of the old keeper\u2019s tide-box. The lid clicks open on a waxed slip: the Watch\u2019s last tide rota. The lower passage floods two hours before high water; the culvert clears an hour after the ebb.\n1 gp spent. It is listed in your supplies receipt.';
    paid.facts=[...(paid.facts??[]),'tide-rota'];
    return paid;
  } else if (action === 'finish' && state.scene === 'landing') {
    state.scene='complete'; state.text='You copy the Watch’s surviving harbor marks and return to Wickhaven. This short reconnaissance is complete. Your journal is saved.';
  } else throw new Error('That choice is no longer available. Use the latest buttons.');
  return state;
}

export class QuestStore {
  constructor(pool, die) { this.pool=pool; this.die=die; }
  async init() { for (const sql of questSchema) await this.pool.query(sql); }
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
    const state={scene:'review',hp:s.hp,tempHp:s.tempHp,coins:s.coins,items:s.loadout.items,text:'Review your exported character and declared loadout. Confirming locks this expedition. TEST only: no AP, gold, or sheet write-back.'};
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
      requireValue(run&&run.finished&&s.v===2&&run.snapshot.v===2,'No matching completed bag expedition receipt.');
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
      if(action==='revisit') throw new Error('Start a fresh visit with !depart drowned-watch.');
      const state=transition(run,action,this.die);
      for(const fact of state.facts??[]) await db.query('INSERT INTO ledger_quest_test_knowledge VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[guild,run.character_id,fact]);
      if(state.scene==='complete') {
        const reward=await db.query(`INSERT INTO ledger_quest_test_rewards VALUES($1,$2,'watch-reconnaissance',$3) ON CONFLICT DO NOTHING RETURNING reward`,[guild,run.character_id,id]);
        state.text+=reward.rows.length?' First reconnaissance recorded (journal only; no AP or gold).':' Repeat visit recorded. No additional reward.';
      }
      await db.query('INSERT INTO ledger_quest_test_events(run_id,revision,action,state) VALUES($1,$2,$3,$4)',[id,revision+1,action,JSON.stringify(state)]);
      const saved=(await db.query('UPDATE ledger_quest_test_runs SET state=$2,revision=revision+1,finished=$3 WHERE id=$1 RETURNING *',[id,JSON.stringify(state),['complete','cancelled'].includes(state.scene)])).rows[0];
      if(state.scene==='complete') await db.query('INSERT INTO ledger_quest_test_receipts(run_id,guild_id,player_id,character_id,receipt,status) VALUES($1,$2,$3,$4,$5,$6)',[id,guild,player,run.character_id,JSON.stringify(resourceReceipt(saved)),hasResourceChanges(saved)?'pending':'no-change']);
      await db.query('COMMIT'); return saved;
    } catch(e) { await db.query('ROLLBACK'); throw e; } finally { db.release(); }
  }
  async knowledge(run) { return (await this.pool.query('SELECT fact FROM ledger_quest_test_knowledge WHERE guild_id=$1 AND character_id=$2 ORDER BY fact',[run.guild_id,run.character_id])).rows.map(x=>x.fact); }
}
