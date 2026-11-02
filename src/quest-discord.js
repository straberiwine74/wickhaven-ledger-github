import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { QuestStore, verifyExport, tideBoxOffered } from './quest.js';
import { resourceReceipt, hasResourceChanges, resourceDelta } from './quest-resources.js';
import { runClickDiagnostic } from './quest-race.js';
import { canReview } from './review-interactions.js';

export function suppliesView(run) {
  const r=resourceReceipt(run),roll=r.lastRoll;
  return {content:'**Expedition supplies and receipt**',embeds:[{description:`${run.snapshot.name.replace(/[\*_~<>@`]/g,'')} • ${r.status}\nHP ${r.starting.hp} → ${r.current.hp}; temporary HP ${r.starting.tempHp} → ${r.current.tempHp}\n${Object.keys(r.current.coins).map(k=>`${k}: ${r.starting.coins[k]} → ${r.current.coins[k]}`).join(' • ')}\n${hasResourceChanges(run)?'Resource changes are listed in the attached receipt. Update Avrae manually; automatic write-back is not enabled.':'No resource changes. Nothing to copy back to Avrae.'}\n${roll?`Last saved roll: ${roll.skill}, dice ${roll.dice.join(', ')}, modifier ${roll.modifier}, total ${roll.total}.`:'No approach roll saved.'}\nInventory source: ${r.source}. All starting/current item quantities and changes are in the receipt. This view changes nothing.`}],files:[{attachment:Buffer.from(JSON.stringify(r,null,2)),name:`expedition-${run.id}.json`}],allowedMentions:{parse:[]}};
}

export function changeSummary(run) {
  const d=resourceDelta(run),sign=n=>(n>0?'+':'')+n,clean=t=>String(t).replace(/[\*_~<>@`|]/g,''),out=[];
  if(d.hp) out.push(`HP ${sign(d.hp)}`);
  if(d.tempHp) out.push(`temporary HP ${sign(d.tempHp)}`);
  for(const [k,v] of Object.entries(d.coins)) if(v) out.push(`${sign(v)} ${k}`);
  for(const i of d.items) out.push(`${sign(i.delta)} × ${clean(i.name)}${i.bag?' ['+clean(i.bag)+']':''}`);
  return out.join(', ')||'none';
}

export function departureFailure(stage,error) {
  const safe=new Set(['Departure data was truncated or malformed.','Unsupported snapshot or quest.','Use an imported D&D Beyond character.','Invalid HP.','Declare and review actual passive Perception.','A declared loadout is required (maximum 20 entries).','Invalid loadout item.','Combine duplicate inventory entries.','Invalid coins.','Missing Avrae signature.','Snapshot too large. Reduce manifest entries.','Only configured Avrae exports are accepted.','Wrong export channel/server.','Export expired. Run departure again.','Avrae signature verification unavailable.','Use the installed server departure alias; personal aliases are not accepted.','Signed departure expired.','This imported sheet needs Ledger TEST approval first.']);
  for(const message of ['Avrae did not verify a server-alias invocation.','Avrae signature has the wrong departure marker.','Signed player does not match the export.','Signed channel does not match the export.','Signed invocation does not match the export.','Verification server does not match the export.']) safe.add(message);
  for(const message of ['Invalid carried bags.','Invalid bag item.','Too many carried item entries.','Invalid expedition coin source.','Invalid reconciliation reference.','Recover HP before starting a new expedition.','Reconcile the previous expedition receipt before a new departure.','No matching completed bag expedition receipt.','Exported bags, HP or currency do not match the ending receipt.']) safe.add(message);
  const detail=safe.has(error?.message)?error.message:'The check did not complete; staff can inspect the daemon log.';
  return `Departure stopped at **${stage}**. ${detail}\nNo reset or additional reward was applied. Existing saved progress is preserved.`;
}

export function questView(run, knowledge=[]) {
  const s=run.snapshot, state=run.state;
  let content=`**Drowned Watch — TEST • ${s.name.replace(/[\*_~<>@]/g,'')}**\n${state.text}`;
  if(state.scene==='review') {
    content+=`\nSheet: https://www.dndbeyond.com/characters/${s.character.slice(7)}\nHP ${s.hp}/${s.maxHp} (+${s.tempHp} temporary) • Passive Perception ${s.passive} (declared; verify against sheet)\n`;
    content+=Object.entries(s.skills).map(([k,v])=>`${k} ${v.mod>=0?'+':''}${v.mod}${v.adv===true?' advantage':v.adv===false?' disadvantage':''}`).join(' • ');
    content+='\n'+(s.v===2?'Carried bags inventory: ':'Declared inventory: ')+(s.loadout.items.slice(0,12).map(i=>`${i.qty} × ${i.name}${i.bag?' ['+i.bag+']':''}`).join('; ')||'none');
    if(s.loadout.items.length>12) content+='\nFull inventory is in the attached receipt; review it before confirming.';
    if(s.v===2) content+=`\nCurrency source: ${s.loadout.coinsSource}.`;
    content+='\nCoins: '+Object.entries(s.coins).map(([k,v])=>`${v} ${k}`).join(', ');
    content+='\nTools, spells, reroll features and automatic resource write-back remain unsupported. Passive Perception is declared. Do not confirm incorrect data.';
  }
  if(knowledge.length) content+='\n**Known observations:** '+knowledge.map(k=>k.replaceAll('-',' ')).join('; ');
  const choices={review:[['confirm','Confirm loadout'],['cancel','Discard unconfirmed departure']],shore:[['climb','Climb exposed stairs'],['sneak','Time the culvert crossing'],['study','Study harbor marks'],['retreat','Return to town']],landing:[['finish','Record findings & return'],...(tideBoxOffered(run)?[['tidebox','Leave 1 gp in the tide-box (spends 1 gp)']]:[]),['retreat','Retreat unfinished']],town:[['resume','Return to the Watch']],complete:[],cancelled:[]}[state.scene];
  const buttons=choices.map(([action,label])=>new ButtonBuilder().setCustomId(`quest:${run.id}:${run.revision}:${action}`).setLabel(label).setStyle(ButtonStyle.Secondary));
  const utility=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`quest:${run.id}:${run.revision}:supplies`).setLabel('View supplies & saved roll').setStyle(ButtonStyle.Secondary),new ButtonBuilder().setCustomId(`quest:${run.id}:${run.revision}:race`).setLabel('Staff: test simultaneous clicks').setStyle(ButtonStyle.Secondary));
  const payload={content:'**The Wickhaven Ledger • Expedition TEST**',embeds:[{description:content}],components:[...(buttons.length?[new ActionRowBuilder().addComponents(buttons)]:[]),utility],allowedMentions:{parse:[]}};
  if(state.scene==='review') payload.files=suppliesView(run).files;
  if(state.scene==='complete'&&hasResourceChanges(run)) {
    payload.embeds.push({description:`Changes to copy into Avrae: ${changeSummary(run)}\nUpdate your Avrae bags/HP/currency using the receipt, then verify with:\n\`!depart reconcile ${run.id}\`\nNew visits are blocked until the exported ending resources match. No automatic write-back occurs.`});
  }
  return payload;
}

export async function installQuests(client,pool,config) {
  const store=new QuestStore(pool); await store.init();
  client.on('messageCreate',async message=>{
    if(message.guildId!==config.guild || message.channelId!==config.channel || message.author.id!==config.avrae || !message.author.bot || message.webhookId) return;
    const embed=message.embeds.find(e=>e.title==='BTLL departure v1');
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
        await message.reply({...suppliesView(run),content:'**Ending resources verified.** The fresh Avrae export matches the completed expedition. You can depart again.'});return;
      }
      stage='Ledger approval and expedition save';
      const run=await store.open(s);
      stage='confirmation message';
      await message.reply(questView(run,await store.knowledge(run)));
    } catch(error) {
      const code=/^[A-Z0-9_]{1,20}$/.test(String(error?.code??''))?String(error.code):'unspecified';
      console.error(`Quest departure failed: stage=${stage}; code=${code}`);
      await message.reply({content:departureFailure(stage,error),allowedMentions:{parse:[]}}).catch(()=>console.error('Quest failure notice could not be posted.'));
    }
  });
  client.on('interactionCreate',async interaction=>{
    if(!interaction.isButton() || !interaction.customId.startsWith('quest:')) return;
    try {
      await interaction.deferReply({flags:MessageFlags.Ephemeral});
      if(interaction.guildId!==config.guild || interaction.channelId!==config.channel) throw new Error('Use these test buttons in the configured quest test channel.');
      const [,id,revision,action]=interaction.customId.split(':');
      if(!/^\d+$/.test(revision)) throw new Error('Invalid expedition button.');
      if(action==='supplies') {
        const run=await store.inspect(id,interaction.guildId,interaction.user.id);
        await interaction.editReply(suppliesView(run));return;
      }
      if(action==='race') {
        if(!canReview(interaction)) {await interaction.editReply('Only staff can run the synthetic click-protection test.');return;}
        const result=await runClickDiagnostic(pool);
        await interaction.editReply(`**Hosted simultaneous-click test passed.**\nThree separate database sessions submitted approaches: ${result.rolls} roll saved.\nThree sessions submitted completion: ${result.rewards} journal record and ${result.receipts} resource receipt saved.\nOnly synthetic records were used and then removed. No player expedition, supplies or AP was changed.`);return;
      }
      const run=await store.act(id,interaction.guildId,interaction.user.id,Number(revision),action);
      await interaction.editReply(questView(run,await store.knowledge(run)));
    } catch(error) {
      console.error('Quest interaction could not complete; inspect persisted state before retrying.');
      if(interaction.deferred) await interaction.editReply({content:'That choice could not be confirmed, or these buttons belong to another player. Run !depart drowned-watch to recover the saved expedition. No reset is offered.',allowedMentions:{parse:[]}}).catch(()=>{});
    }
  });
  return store;
}
