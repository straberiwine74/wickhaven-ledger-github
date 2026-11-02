import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { QuestStore, verifyExport } from './quest.js';

export function departureFailure(stage,error) {
  const safe=new Set(['Departure data was truncated or malformed.','Unsupported snapshot or quest.','Use an imported D&D Beyond character.','Invalid HP.','Declare and review actual passive Perception.','A declared loadout is required (maximum 20 entries).','Invalid loadout item.','Combine duplicate inventory entries.','Invalid coins.','Missing Avrae signature.','Snapshot too large. Reduce manifest entries.','Only configured Avrae exports are accepted.','Wrong export channel/server.','Export expired. Run departure again.','Avrae signature verification unavailable.','Use the installed server departure alias; personal aliases are not accepted.','Signed departure expired.','This imported sheet needs Ledger TEST approval first.']);
  for(const message of ['Avrae did not verify a server-alias invocation.','Avrae signature has the wrong departure marker.','Signed player does not match the export.','Signed channel does not match the export.','Signed invocation does not match the export.','Verification server does not match the export.']) safe.add(message);
  const detail=safe.has(error?.message)?error.message:'The check did not complete; staff can inspect the daemon log.';
  return `Departure stopped at **${stage}**. ${detail}\nNo reset or additional reward was applied. Existing saved progress is preserved.`;
}

export function questView(run, knowledge=[]) {
  const s=run.snapshot, state=run.state;
  let content=`**Drowned Watch — TEST • ${s.name.replace(/[\*_~<>@]/g,'')}**\n${state.text}`;
  if(state.scene==='review') {
    content+=`\nSheet: https://www.dndbeyond.com/characters/${s.character.slice(7)}\nHP ${s.hp}/${s.maxHp} (+${s.tempHp} temporary) • Passive Perception ${s.passive} (declared; verify against sheet)\n`;
    content+=Object.entries(s.skills).map(([k,v])=>`${k} ${v.mod>=0?'+':''}${v.mod}${v.adv===true?' advantage':v.adv===false?' disadvantage':''}`).join(' • ');
    content+='\nDeclared inventory: '+(s.loadout.items.map(i=>`${i.qty} × ${i.name}`).join('; ')||'none');
    content+='\nCoins: '+Object.entries(s.coins).map(([k,v])=>`${v} ${k}`).join(', ');
    content+='\nNo imported bags, tools, spells, reroll features, or resource write-back are supported in this prototype. Test only with a character whose checks need no additional features. Do not confirm incorrect data.';
  }
  if(knowledge.length) content+='\n**Known observations:** '+knowledge.map(k=>k.replaceAll('-',' ')).join('; ');
  const choices={review:[['confirm','Confirm loadout'],['cancel','Discard unconfirmed departure']],shore:[['climb','Climb exposed stairs'],['sneak','Time the culvert crossing'],['study','Study harbor marks'],['retreat','Return to town']],landing:[['finish','Record findings & return'],['retreat','Retreat unfinished']],town:[['resume','Return to the Watch']],complete:[],cancelled:[]}[state.scene];
  const buttons=choices.map(([action,label])=>new ButtonBuilder().setCustomId(`quest:${run.id}:${run.revision}:${action}`).setLabel(label).setStyle(ButtonStyle.Secondary));
  return {content:'**The Wickhaven Ledger • Expedition TEST**',embeds:[{description:content}],components:buttons.length?[new ActionRowBuilder().addComponents(buttons)]:[],allowedMentions:{parse:[]}};
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
      const run=await store.act(id,interaction.guildId,interaction.user.id,Number(revision),action);
      await interaction.editReply(questView(run,await store.knowledge(run)));
    } catch(error) {
      console.error('Quest interaction could not complete; inspect persisted state before retrying.');
      if(interaction.deferred) await interaction.editReply({content:'That choice could not be confirmed, or these buttons belong to another player. Run !depart drowned-watch to recover the saved expedition. No reset is offered.',allowedMentions:{parse:[]}}).catch(()=>{});
    }
  });
  return store;
}
