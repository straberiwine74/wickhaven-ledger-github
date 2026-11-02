// The Wickhaven Ledger card style. Every message the bot posts should be
// built with card() so the whole system looks and reads the same:
//   • title: short and specific, optionally with one leading emoji
//   • description: one or two sentences of story or status, key words in bold
//   • fields: short labelled facts; inline for numbers, full width for lists
//   • tone: sets the side-stripe color (see palette)
//   • footer: always starts with "The Wickhaven Ledger", then the mode
export const palette={
  info:0x2E8B9A,      // teal: default, reviews, menus
  success:0x3C9C63,   // green: completed, approved, verified
  warning:0xE0A526,   // amber: low HP, action needed, pending receipt
  danger:0xC2453D,    // red: stopped, refused, failed
  pending:0x527CBA,   // blue: waiting on staff
  neutral:0x6B7280,   // gray: cancelled, informational
  shore:0x3B6E8F,     // expedition scenes
  landing:0x4F5D75,
  town:0xC9A15B
};
export const LEDGER_MODE='TEST';
export const clean=t=>String(t??'').replace(/[\*_~<>@`|]/g,'');
export const signed=n=>(n>=0?'+':'−')+Math.abs(n);
const cut=(t,n)=>{t=String(t??'');return t.length<=n?t:t.slice(0,n-1)+'…';};
export function fitLines(lines,max=1024,more='…more not shown') {
  let out='';
  for(const line of lines){if((out+line+'\n'+more).length>max)return out+more;out+=line+'\n';}
  return out.trim()||'—';
}
export function card({title,url,description,fields=[],tone='info',color,footer,mode=LEDGER_MODE}) {
  const embed={color:color??palette[tone]??palette.info};
  if(title) embed.title=cut(title,256);
  if(url) embed.url=url;
  if(description) embed.description=cut(description,4096);
  embed.fields=fields.filter(f=>f&&f.value!==undefined&&f.value!==null&&f.value!=='').slice(0,25).map(f=>({name:cut(f.name,256),value:cut(f.value,1024),...(f.inline?{inline:true}:{})}));
  embed.footer={text:cut(['The Wickhaven Ledger',mode,footer].filter(Boolean).join(' • '),2048)};
  // Discord rejects embeds over 6000 total characters; trim the longest fields.
  const size=()=>[embed.title,embed.description,embed.footer.text,...embed.fields.flatMap(f=>[f.name,f.value])].join('').length;
  while(size()>6000){const f=[...embed.fields].sort((a,b)=>b.value.length-a.value.length)[0];if(!f||f.value.length<=40)break;f.value=cut(f.value,Math.max(40,f.value.length-(size()-6000)-1));}
  return embed;
}
export const message=(cards,extra={})=>({embeds:[cards].flat(),allowedMentions:{parse:[]},...extra});
export const notice=(title,description,tone='danger',fields=[])=>message(card({title,description,tone,fields}));
