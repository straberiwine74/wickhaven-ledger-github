import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { QuestStore, verifyExport, questChannels } from './quest.js';
import { getQuest } from './quests/index.js';
import { questOf, choicesFor } from './quest-engine.js';
import { SKILLS, checksUsed } from './quest-schema.js';
import { resourceReceipt, hasResourceChanges, resourceDelta } from './quest-resources.js';
import { runClickDiagnostic } from './quest-race.js';
import { canReview } from './review-interactions.js';
import { card, message, notice, clean, signed, fitLines, testNote } from './ui.js';

const coinKeys=['pp','gp','ep','sp','cp'];
const questName=run=>{try{return questOf(run).name;}catch{return 'Expedition';}};
const title=s=>s[0].toUpperCase()+s.slice(1);
const observation=k=>'• '+title(k.replaceAll('-',' '));
const runFooter=run=>`${questName(run)} • Run ${String(run.id).slice(0,8)} • Step ${run.revision}`;
const coinLine=c=>coinKeys.filter(k=>c?.[k]).map(k=>`**${c[k]}** ${k}`).join(' · ')||'none';

export function changeSummary(run) {
  const d=resourceDelta(run),out=[];
  if(d.hp) out.push(`HP ${signed(d.hp)}`);
  if(d.tempHp) out.push(`temporary HP ${signed(d.tempHp)}`);
  for(const [k,v] of Object.entries(d.coins)) if(v) out.push(`${signed(v)} ${k}`);
  for(const i of d.items) out.push(`${signed(i.delta)} × ${clean(i.name)}${i.bag?' ['+clean(i.bag)+']':''}`);
  return out.join(', ')||'none';
}

export function rollLine(roll) {
  if(!roll) return null;
  const face=roll.total-roll.modifier;
  const dice=roll.dice.length>1?`${roll.dice.join(' / ')} → **${face}**`:`**${face}**`;
  return `${roll.label??SKILLS[roll.skill]??title(roll.skill)}: d20 ${dice} ${roll.modifier<0?'−':'+'} ${Math.abs(roll.modifier)} = **${roll.total}** — ${roll.success?'✅ Success':'❌ Fail forward'}`;
}

export function suppliesView(run) {
  const r=resourceReceipt(run),changed=hasResourceChanges(run);
  const coinChange=coinKeys.filter(k=>r.starting.coins[k]||r.current.coins[k]).map(k=>`${k}: ${r.starting.coins[k]} → **${r.current.coins[k]}**`).join('\n')||'none carried';
  const embed=card({
    title:'🎒 Supplies & Receipt',
    description:`**${clean(run.snapshot.name)}** • ${r.status==='final'?'Expedition finished':'Expedition in progress'}\nThis view changes nothing.`,
    tone:changed?'warning':'info',
    fields:[
      {name:'❤️ Hit Points',value:`${r.starting.hp} → **${r.current.hp}**${r.starting.tempHp||r.current.tempHp?`\nTemp ${r.starting.tempHp} → **${r.current.tempHp}**`:''}`,inline:true},
      {name:'💰 Coins',value:coinChange,inline:true},
      {name:'📦 Changes',value:changed?`${changeSummary(run)}\nUpdate Avrae by hand. Automatic write-back isn't available.`:'No changes. Nothing to copy back to Avrae.'},
      {name:'🎲 Saved roll',value:rollLine(r.lastRoll)??'No approach roll yet.'},
      {name:'🧾 Receipt',value:`Inventory source: ${r.source}. Full starting and current item quantities are in the attached file.`}
    ],
    footer:runFooter(run)
  });
  return message(embed,{files:[{attachment:Buffer.from(JSON.stringify(r,null,2)),name:`expedition-${run.id}.json`}]});
}

const safeMessages=new Set(['Departure data was truncated or malformed.','Unsupported snapshot or quest.','Use an imported D&D Beyond character.','Invalid HP.','Declare and review actual passive Perception.','A declared loadout is required (maximum 20 entries).','Invalid loadout item.','Combine duplicate inventory entries.','Invalid coins.','Missing Avrae signature.','Snapshot too large. Reduce manifest entries.','Only configured Avrae exports are accepted.','Wrong export channel/server.','Export expired. Run departure again.','Avrae signature verification unavailable.','Use the installed server departure alias; personal aliases are not accepted.','Signed departure expired.','This imported sheet needs Ledger TEST approval first.',
  'Avrae did not verify a server-alias invocation.','Avrae signature has the wrong departure marker.','Signed player does not match the export.','Signed channel does not match the export.','Signed invocation does not match the export.','Verification server does not match the export.',
  'Invalid carried bags.','Invalid bag item.','Too many carried item entries.','Invalid expedition coin source.','Invalid reconciliation reference.','Recover HP before starting a new expedition.','Reconcile the previous expedition receipt before a new departure.','No matching completed bag expedition receipt.','Exported bags, HP or currency do not match the ending receipt.']);
export function departureFailure(stage,error) {
  const m=String(error?.message??'');
  const safe=safeMessages.has(m)||/^Invalid [A-Za-z ]{2,40}\.$/.test(m)||/^This character export has no [A-Za-z ]{2,40}\./.test(m)||['This quest is not available.','This quest is still in testing.','Departure data is missing the full character sheet.'].includes(m);
  const detail=m==='Unfinished expedition elsewhere.'?error.hint:m==='This quest isn\u2019t open yet.'?`${m} ${error.hint??'Someone needs to discover the way there first.'}`:safe?m:'The check did not complete. Staff can inspect the bot log.';
  return notice('⛔ Departure stopped',`**${detail}**`,'danger',[
    {name:'Stopped at',value:title(stage),inline:true},
    {name:'Your progress',value:'Nothing was reset and no reward was given. Saved progress is preserved.',inline:true}
  ]);
}

// Warn at or below half maximum HP (bloodied). 0 HP is blocked in QuestStore.open.
export const lowHp=s=>s.hp>0&&s.hp*2<=s.maxHp;

export function reviewEmbed(run,knowledge=[]) {
  const s=run.snapshot,low=lowHp(s),fields=[];
  if(low) fields.push({name:'⚠️ Low HP',value:`You can still depart, but consider resting in Avrae first, then run \`!depart ${s.quest??'drowned-watch'}\` again.`});
  fields.push({name:'❤️ Hit Points',value:`**${s.hp}** / ${s.maxHp}${s.tempHp?`\n+${s.tempHp} temporary`:''}`,inline:true});
  fields.push({name:'👁️ Passive Perception',value:`**${s.passive}**\n${s.passiveSource==='computed'?'from your Perception bonus':'declared — check your sheet'}`,inline:true});
  fields.push({name:'💰 Coins',value:`${coinLine(s.coins)}${s.v>=2?`\n${({'avrae-coinpurse':'from Avrae coin purse','bag-coin-pouch':'from bag coin pouch','none':'no coins carried'})[s.loadout.coinsSource]}`:''}`,inline:true});
  const adv=v=>v.adv===true?' (adv)':v.adv===false?' (dis)':'';
  if(s.v===3) {
    fields.push({name:'🎲 Skills',value:Object.keys(SKILLS).map(k=>`${SKILLS[k]} **${signed(s.skills[k].mod)}**${adv(s.skills[k])}`).join(' · ')});
    fields.push({name:'🛡️ Saving throws',value:Object.entries(s.saves).map(([k,v])=>`${k.toUpperCase()} **${signed(v.mod)}**${adv(v)}`).join(' · '),inline:true});
    fields.push({name:'📊 Level',value:`**${s.level}**`,inline:true});
  } else fields.push({name:'🎲 Skills',value:Object.keys(s.skills).map(k=>`${SKILLS[k]??title(k)} **${signed(s.skills[k].mod)}**${adv(s.skills[k])}`).join(' · ')});
  try {fields.push({name:'🧭 This expedition may test',value:checksUsed(questOf(run)).join(' · ')});} catch {}
  const groups=s.v>=2?s.loadout.bags.map(b=>b[0]):[null];
  // Discord caps a whole embed at 6000 characters; share an inventory budget across bags.
  const budget=Math.min(1024,Math.floor(3000/Math.max(1,Math.min(groups.length,12))));
  for(const bag of groups.slice(0,12)) {
    const items=s.loadout.items.filter(i=>(i.bag??null)===bag).map(i=>`${i.qty}× ${clean(i.name)}`);
    fields.push({name:bag===null?'🎒 Declared inventory':`🎒 ${clean(bag)}`,value:items.length?fitLines(items,budget,'…more in the attached receipt'):'*empty*',inline:true});
  }
  if(knowledge.length) fields.push({name:'📜 Known observations',value:fitLines(knowledge.map(observation))});
  return card({
    title:`${questName(run)} — Departure Review`,
    url:`https://www.dndbeyond.com/characters/${s.character.slice(7)}`,
    description:`**${clean(s.name)}** is ready to set out. Review everything below. **Confirming locks this expedition.**${(()=>{try{return questOf(run).status==='live'?'\n*No automatic sheet write-back: you update Avrae yourself.*':'\n*TEST quest: no AP, gold, or sheet write-back.*';}catch{return '';}})()}`,
    tone:low?'warning':'info',fields,
    footer:'Tools, spells, and reroll features aren’t supported yet. If anything is wrong, discard and fix it in Avrae.'
  });
}

const builtIn={
  town:{title:'🏘️ Back in Wickhaven',tone:'town'},
  complete:{title:'✅ Expedition Complete',tone:'success'},
  downed:{title:'🩸 Carried Home',tone:'danger'},
  cancelled:{title:'Departure Discarded',tone:'neutral'}
};
const sceneInfo=run=>{try{return questOf(run).scenes[run.state.scene]??builtIn[run.state.scene];}catch{return builtIn[run.state.scene]??{title:run.state.scene,tone:'info'};}};
const rollPrefix=/^(athletics|stealth|investigation|perception): [^\n]*\n/; // pre-engine saved runs
export function sceneEmbed(run,knowledge=[]) {
  const s=run.snapshot,state=run.state,scene=sceneInfo(run);
  const pending=['complete','downed'].includes(state.scene)&&hasResourceChanges(run);
  const fields=[];
  if(state.roll&&!['review','town','cancelled'].includes(state.scene)) fields.push({name:'🎲 Last roll',value:rollLine(state.roll)});
  if(!['cancelled'].includes(state.scene)) {
    fields.push({name:'❤️ Hit Points',value:`**${state.hp}** / ${s.maxHp}${state.tempHp?` (+${state.tempHp})`:''}`,inline:true});
    fields.push({name:'💰 Coins',value:coinLine(state.coins),inline:true});
  }
  if(state.scene==='town') fields.push({name:'⏸️ Expedition paused',value:'Your progress, discoveries, and supplies stay locked until you return.'});
  if(pending) fields.push({name:'📦 Copy into Avrae',value:`**${changeSummary(run)}**\nUpdate your bags, HP, or coins in Avrae, then verify with:\n\`!depart reconcile ${run.id}\`\nNew expeditions stay locked until this matches.`});
  else if(['complete','downed'].includes(state.scene)) fields.push({name:'📦 Supplies',value:'No changes. Nothing to copy back to Avrae.'});
  if(knowledge.length) fields.push({name:'📜 Known observations',value:fitLines(knowledge.map(observation))});
  return card({
    title:`${questName(run)} — ${scene.title}`,
    description:`**${clean(s.name)}**\n${String(state.text??'').replace(rollPrefix,'')}`,
    tone:pending?'warning':scene.tone,fields,footer:runFooter(run)
  });
}

const styles={primary:ButtonStyle.Primary,secondary:ButtonStyle.Secondary,success:ButtonStyle.Success,danger:ButtonStyle.Danger};
const builtInButtons={confirm:['Confirm loadout','✅','success'],cancel:['Discard departure','🗑️','danger']};
export function questView(run, knowledge=[]) {
  const state=run.state;
  const choices=choicesFor(run,knowledge).map(c=>{
    if(builtInButtons[c.id]) return [c.id,builtInButtons[c.id]];
    if(c.id==='resume') {let q;try{q=questOf(run);}catch{}return ['resume',[`Return to the ${q?.name??'expedition'}`,q?.emoji??'🧭','primary']];}
    return [c.id,[c.label,c.emoji??'▶️',c.style??(c.check?'primary':'secondary')]];
  });
  const button=(action,[label,emoji,style])=>new ButtonBuilder().setCustomId(`quest:${run.id}:${run.revision}:${action}`).setLabel(label).setEmoji(emoji).setStyle(styles[style]??style);
  const buttons=choices.map(([a,spec])=>button(a,spec));
  // The staff click-protection diagnostic passed live on November 1; its button is
  // retired. Old messages that still show it continue to work for staff.
  const utility=new ActionRowBuilder().addComponents(button('supplies',['Supplies & saved roll','🎒','secondary']));
  const payload=message(state.scene==='review'?reviewEmbed(run,knowledge):sceneEmbed(run,knowledge),{components:[...(buttons.length?[new ActionRowBuilder().addComponents(buttons)]:[]),utility]});
  if(state.scene==='review') payload.files=suppliesView(run).files;
  return payload;
}

export async function installQuests(client,pool,config) {
  const store=new QuestStore(pool); await store.init();
  client.on('messageCreate',async message=>{
    if(message.guildId!==config.guild || !questChannels(config).includes(message.channelId) || message.author.id!==config.avrae || !message.author.bot || message.webhookId) return;
    const embed=message.embeds.find(e=>e.title==='Chronicles of Thaleryn Solo Expedition'||e.title==='BTLL departure v1');
    if(!embed) return;
    let stage='export format';
    try {
      const match=/^```json\n([\s\S]+)\n```$/.exec(embed.description??'');
      if(!match) throw new Error('Departure data was truncated or malformed.');
      const s=JSON.parse(match[1]);
      stage='character data and Avrae signature';
      await verifyExport(s,message,config);
      if(s.reconcile) {
        stage='resource reconciliation';
        const run=await store.reconcile(s);
        const supplies=suppliesView(run);await message.reply({...supplies,embeds:[card({title:'✅ Ending resources verified',description:'The fresh Avrae export matches the completed expedition. **You can depart again.**',tone:'success',footer:runFooter(run)}),...supplies.embeds]});return;
      }
      if(message.channelId!==config.channel&&getQuest(s.quest)?.status!=='live') throw new Error('This quest is still in testing.');
      stage='Ledger approval and expedition save';
      const run=await store.open(s);
      stage='confirmation message';
      await message.reply(questView(run,await store.knowledge(run)));
    } catch(error) {
      const code=/^[A-Z0-9_]{1,20}$/.test(String(error?.code??''))?String(error.code):'unspecified';
      console.error(`Quest departure failed: stage=${stage}; code=${code}`);
      await message.reply(departureFailure(stage,error)).catch(()=>console.error('Quest failure notice could not be posted.'));
    }
  });
  client.on('interactionCreate',async interaction=>{
    if(!interaction.isButton() || !interaction.customId.startsWith('quest:')) return;
    try {
      await interaction.deferReply({flags:MessageFlags.Ephemeral});
      if(interaction.guildId!==config.guild || !questChannels(config).includes(interaction.channelId)) {await interaction.editReply(notice('Wrong channel','Use these expedition buttons in the quest test channel.','neutral'));return;}
      const [,id,revision,action]=interaction.customId.split(':');
      if(!/^\d+$/.test(revision)) throw new Error('Invalid expedition button.');
      if(action==='supplies') {
        const run=await store.inspect(id,interaction.guildId,interaction.user.id);
        await interaction.editReply(suppliesView(run));return;
      }
      if(action==='race') {
        if(!canReview(interaction)) {await interaction.editReply(notice('Staff only','Only staff can run the synthetic click-protection test.','neutral'));return;}
        const result=await runClickDiagnostic(pool);
        await interaction.editReply(notice('🧪 Simultaneous-click test passed','Three separate database sessions raced each step. Only synthetic records were used and then removed. No player expedition, supplies, or AP changed.','success',[{name:'Approaches',value:`${result.rolls} roll saved`,inline:true},{name:'Completion',value:`${result.rewards} journal record • ${result.receipts} receipt`,inline:true}]));return;
      }
      const run=await store.act(id,interaction.guildId,interaction.user.id,Number(revision),action);
      await interaction.editReply(questView(run,await store.knowledge(run)));
    } catch(error) {
      console.error('Quest interaction could not complete; inspect persisted state before retrying.');
      if(interaction.deferred) await interaction.editReply(notice('That choice couldn\u2019t be confirmed','These buttons may belong to another player, or the choice is no longer available. Run `!depart` with the same quest code to bring back your saved expedition. Nothing was reset.','danger')).catch(()=>{});
    }
  });
  return store;
}
