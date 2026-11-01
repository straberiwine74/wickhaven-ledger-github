import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { QuestStore, verifyExport } from './quest.js';

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
    try {
      const match=/^```json\n([\s\S]+)\n```$/.exec(embed.description??'');
      if(!match) throw new Error('Departure data was truncated or malformed.');
      const s=JSON.parse(match[1]); await verifyExport(s,message,config);
      const run=await store.open(s);
      await message.reply(questView(run,await store.knowledge(run)));
    } catch { await message.reply({content:'Departure could not be accepted. Check the installed server alias, TEST-approved sheet, declared manifest/passive, and export size; then run !depart drowned-watch again. No expedition reset or reward was applied.',allowedMentions:{parse:[]}}).catch(()=>{}); }
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
