import { quests } from './quests/index.js';
import { card, message, clean } from './ui.js';

export const questsCommand={name:'ledger-quests',description:'Browse quests, departure commands, and availability',options:[
  {type:4,name:'page',description:'Page of quests to display',required:false,min_value:1}
]};

// Read the registry on every invocation so new quests and status changes appear automatically.
export function questCatalogue(interaction, registry=quests, env=process.env) {
  const entries=Object.values(registry).filter(q=>q.status==='live'||q.status==='test')
    .sort((a,b)=>(a.status==='test')-(b.status==='test')||a.name.localeCompare(b.name));
  const pages=Math.max(1,Math.ceil(entries.length/5));
  const page=Math.min(Math.max(1,interaction.options.getInteger('page')??1),pages);
  const channel=id=>/^\d{17,20}$/.test(id??'')?`<#${id}>`:null;
  const enabled=env.QUEST_TEST_ENABLED==='true'||env.LEDGER_LIVE==='true';
  return message(card({title:'🧭 Wickhaven Quests',description:entries.length
    ?'Choose a quest below and use its departure command with your active Avrae character. Prerequisites and character approval are checked when you depart.'
    :'No quests are listed yet. Check back later.',fields:[
      ...(!enabled?[{name:'Expeditions disabled',value:'Quest departures are currently turned off in this deployment.'}]:[]),
      ...entries.slice((page-1)*5,page*5).map(q=>({name:`${clean(q.name)} — ${q.status==='live'?'Live':'Testing'}`,value:[
        `\`!depart ${q.id}\``,
        q.status==='test'?`Testing only • ${channel(env.QUEST_TEST_CHANNEL_ID)??'ask staff for the quest test channel'}`
          :`Depart in ${channel(env.QUEST_CHANNEL_ID)??channel(env.QUEST_TEST_CHANNEL_ID)??'the configured quest channel (ask staff)'}.`,
        ...(q.requires?[`Prerequisite (${q.requires.scope==='server'?'server discovery':'character discovery'}): ${clean(q.requires.hint??'A prior discovery is required. Departure checks whether it has been found.')}`]:[])
      ].join('\n')}))
    ],footer:`Page ${page} of ${pages} • ${entries.length} quests • Use /ledger-quests page to browse` }));
}
