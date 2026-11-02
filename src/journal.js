// /ledger-journal: a character's expedition journal. Players see only their own
// characters; staff can open anyone's with the player option.
import { UserError, staffAllowed } from './admin.js';
import { quests, getQuest } from './quests/index.js';
import { questFacts, SKILLS } from './quest-schema.js';
import { card, message, clean, fitLines } from './ui.js';

const pretty=f=>{const t=f.replaceAll('-',' ');return t[0].toUpperCase()+t.slice(1)+'.';};
export const journalLine=(quest,fact)=>quest?.journal?.[fact]??pretty(fact);
const day=d=>new Date(d).toLocaleDateString('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric',year:'numeric'});
const ending={complete:'✅ Completed',downed:'🩸 Carried home',cancelled:'Discarded before setting out',town:'⏸️ Paused in Wickhaven',review:'Awaiting confirmation'};
const visible=()=>Object.values(quests).filter(q=>q.status!=='hidden');

export const journalCommand={name:'ledger-journal',description:'Read your character’s expedition journal',options:[
  {type:3,name:'character',description:'Character name (optional if you have one approved character)',required:false,max_length:80},
  {type:3,name:'quest',description:'Show one quest in detail',required:false,choices:Object.values(quests).filter(q=>q.status!=='hidden').slice(0,25).map(q=>({name:q.name,value:q.id}))},
  {type:6,name:'player',description:'Staff only: read another player’s journal',required:false}]};

export async function resolveCharacter(pool,guildId,playerId,name) {
  const rows=(await pool.query("SELECT name,name_key,sheet_id,status FROM ledger_test_characters WHERE guild_id=$1 AND player_id=$2 ORDER BY name",[guildId,playerId])).rows;
  if(name) {
    const c=rows.find(r=>r.name_key===name.trim().toLowerCase());
    if(!c) throw new UserError(`No character named “${clean(name)}” on that account.${rows.length?' Characters: '+rows.map(r=>clean(r.name)).join(', ')+'.':''}`);
    return c;
  }
  const approved=rows.filter(r=>r.status==='approved');
  if(approved.length===1) return approved[0];
  if(!approved.length) throw new UserError('No approved character found on that account yet.');
  throw new UserError(`Choose a character with the character option: ${approved.map(r=>clean(r.name)).join(', ')}.`);
}

// Tables are created when quests start up; treat a missing table as empty.
const rowsOrEmpty=async q=>{try {return (await q).rows;} catch(e) {if(e?.code==='42P01'||/does not exist/.test(e?.message)) return []; throw e;}};
export async function journalData(pool,guildId,characterId) {
  const runs=(await rowsOrEmpty(pool.query(`SELECT id,snapshot->>'quest' AS quest,finished,state,revision,created_at FROM ledger_quest_test_runs WHERE guild_id=$1 AND character_id=$2 ORDER BY created_at`,[guildId,characterId])));
  const rewards=new Set((await rowsOrEmpty(pool.query('SELECT reward FROM ledger_quest_test_rewards WHERE guild_id=$1 AND character_id=$2',[guildId,characterId]))).map(r=>r.reward));
  const knowledge=(await rowsOrEmpty(pool.query('SELECT fact FROM ledger_quest_test_knowledge WHERE guild_id=$1 AND character_id=$2',[guildId,characterId]))).map(r=>r.fact);
  const awards=await rowsOrEmpty(pool.query(`SELECT ref,awarded,held FROM ledger_ap_awards WHERE guild_id=$1 AND ref LIKE $2`,[guildId,`quest:${characterId}:%`]));
  return {runs,rewards,knowledge,awards};
}

// Group discoveries by the quest whose visits found them; anything else that the
// character knows but no saved visit explains goes to the quest that defines it.
export function byQuest(data) {
  const groups=new Map(visible().map(q=>[q.id,{quest:q,runs:[],facts:new Set()}]));
  for(const run of data.runs) {
    const g=groups.get(run.quest??'drowned-watch');if(!g) continue;
    g.runs.push(run);for(const f of run.state?.facts??[]) if(data.knowledge.includes(f)) g.facts.add(f);
  }
  const placed=new Set([...groups.values()].flatMap(g=>[...g.facts]));
  const other=[];
  for(const f of data.knowledge) if(!placed.has(f)) {
    const g=[...groups.values()].find(g=>questFacts(g.quest).has(f));
    if(g) g.facts.add(f); else other.push(f);
  }
  return {groups:[...groups.values()],other};
}

function stats(g,data) {
  const done=g.runs.filter(r=>r.finished&&r.state?.scene==='complete').length;
  const downed=g.runs.filter(r=>r.state?.scene==='downed').length;
  const open=g.runs.filter(r=>!r.finished&&r.state?.scene!=='review').length;
  const mine=milestonesOf(g.quest),ap=data.awards.filter(a=>mine.has(a.ref.split(':').slice(2).join(':')));
  return {done,downed,open,first:data.rewards.has(g.quest.completion.milestone),ap:ap.reduce((n,a)=>n+a.awarded,0),held:ap.filter(a=>a.held).length};
}
function milestonesOf(quest) {
  const out=new Set([quest.completion.milestone]);
  for(const scene of Object.values(quest.scenes)) for(const c of scene.choices) for(const o of [c.outcome,c.success,c.failure]) if(o?.milestone) out.add(o.milestone);
  return out;
}
const rollText=r=>`${r.label??SKILLS[r.skill]??r.skill} **${r.total}** ${r.success?'✅':'❌'}`;

export function journalSummary(name,data,locked=new Set()) {
  const {groups,other}=byQuest(data),fields=[],untouched=[];
  for(const g of groups) {
    if(!g.runs.length&&!g.facts.size) {if(locked.has(g.quest.id)) continue;untouched.push(`${g.quest.emoji??'🧭'} ${g.quest.name}`);continue;}
    const s=stats(g,data),last=g.runs.at(-1);
    const parts=[`**${s.done}** completed`];if(s.downed) parts.push(`${s.downed} carried home`);if(s.open) parts.push(`${s.open} unfinished`);
    fields.push({name:`${g.quest.emoji??'🧭'} ${g.quest.name}`,value:`${parts.join(' • ')}\nFirst completion: ${s.first?'✅':'not yet'}${s.ap?` • **${s.ap}** AP`:''}${s.held?` • ${s.held} held`:''}\n**${g.facts.size}** discover${g.facts.size===1?'y':'ies'}${last?` • last visit ${day(last.created_at)}`:''}`});
  }
  if(other.length) fields.push({name:'📌 Other discoveries',value:fitLines(other.map(f=>'• '+pretty(f)))});
  if(untouched.length) fields.push({name:'🗺️ Not yet explored',value:untouched.join('\n')});
  return message(card({title:`📖 ${clean(name)}’s Journal`,description:fields.length>1||groups.some(g=>g.runs.length)?'Expeditions and everything learned along the way. Add **quest:** to read one quest in full.':'No expeditions yet. Every entry here begins with a departure.',tone:'info',fields}));
}

export function journalDetail(name,data,questId) {
  const quest=getQuest(questId);if(!quest) throw new UserError('That quest was not found.');
  const g=byQuest(data).groups.find(x=>x.quest.id===questId);
  const s=stats(g,data),fields=[];
  fields.push({name:'Visits',value:`**${s.done}** completed${s.downed?` • ${s.downed} carried home`:''}${s.open?` • ${s.open} unfinished`:''}`,inline:true});
  fields.push({name:'First completion',value:s.first?'✅ Recorded':'Not yet',inline:true});
  if(s.ap||s.held) fields.push({name:'AP',value:`**${s.ap}** earned${s.held?` • ${s.held} held for tomorrow`:''}`,inline:true});
  const order=[...questFacts(quest)];
  const facts=[...g.facts].sort((a,b)=>(order.indexOf(a)+1||999)-(order.indexOf(b)+1||999)).map(f=>'• '+journalLine(quest,f));
  if(!facts.length) fields.push({name:'🔎 Discoveries',value:'Nothing recorded yet.'});
  // Split long discovery lists across fields (Discord allows 1024 characters each).
  let chunk=[],n=1;const flush=()=>{if(chunk.length) fields.push({name:n++===1?'🔎 Discoveries':'🔎 Discoveries (continued)',value:chunk.join('\n')});chunk=[];};
  for(const line of facts) {if((chunk.join('\n')+'\n'+line).length>1000) flush();chunk.push(line);}flush();
  const last=g.runs.at(-1);
  if(last) {
    const rolls=(last.state?.rolls??(last.state?.roll?[last.state.roll]:[])).map(rollText);
    fields.push({name:`🧭 Last visit • ${day(last.created_at)}`,value:`${ending[last.state?.scene]??(last.finished?'Finished':'In progress')}${rolls.length?'\n'+fitLines(rolls.slice(-8),700,'…'):''}`});
  }
  return message(card({title:`📖 ${clean(name)}’s Journal — ${quest.emoji??''} ${quest.name}`.replace('  ',' '),description:g.runs.length||g.facts.size?'What this character has learned here.':'This character hasn’t explored this quest yet.',tone:'info',fields}));
}

export async function handleJournal(interaction,ledger,guildId) {
  const target=interaction.options.getUser('player');
  let playerId=interaction.user.id;
  if(target&&target.id!==playerId) {
    const member=await interaction.guild.members.fetch(interaction.user.id);
    if(!staffAllowed(member,(process.env.MODERATOR_ROLE_IDS??'').split(',').map(s=>s.trim()).filter(Boolean))) throw new UserError('You can only read your own journal.');
    playerId=target.id;
  }
  const c=await resolveCharacter(ledger.pool,guildId,playerId,interaction.options.getString('character'));
  const data=await journalData(ledger.pool,guildId,'beyond-'+c.sheet_id);
  const quest=interaction.options.getString('quest');
  // Locked quests stay off the "not yet explored" list so the journal doesn't spoil them.
  const locked=new Set();
  for(const q of visible()) if(q.requires) {
    const server=q.requires.scope==='server';
    for(const fact of q.requires.facts) {
      const rows=await rowsOrEmpty(ledger.pool.query(`SELECT 1 FROM ledger_quest_test_knowledge WHERE guild_id=$1 AND fact=$2${server?'':' AND character_id=$3'} LIMIT 1`,server?[guildId,fact]:[guildId,fact,'beyond-'+c.sheet_id]));
      if(!rows.length) locked.add(q.id);
    }
  }
  if(quest&&locked.has(quest)) throw new UserError('That quest isn’t open yet.');
  return quest?journalDetail(c.name,data,quest):journalSummary(c.name,data,locked);
}
