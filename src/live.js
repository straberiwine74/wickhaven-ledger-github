// Live AP settings. Everything is read from environment variables so staff
// can change channels in Vercel without a code change.
//
// LEDGER_LIVE=true          real AP everywhere in-character; TEST labels off
// AP_LOG_CHANNEL_ID         staff-only channel for AP award / held-message cards
// AP_EXCLUDED_IDS           comma list of channel, forum or category IDs that never
//                           earn AP (defaults below: OOC, setup, rules and staff spaces)
// HUNTING_CHANNEL_ID, MINING_CHANNEL_ID   gathering channels (1 AP/day total)
export const DEFAULT_EXCLUDED=[
  '1566204441198203080', // START HERE category: welcome, rules, how-to-play, announcements, bot-testing, change-log
  '1566206327448010752', // STAFF ONLY category
  '1566205089633534093', // general (OOC)
  '1566463751274758184', // help-and-questions
  '1566233195110989874', // roll-stats
  '1566205298870325288', // character-approval
  '1566468759835910244', // character-directory (player reference, not scenes)
  '1566205610595455027', // looking-for-company (OOC planning)
  '1566205563644416201', // quest-board
  '1566205702832263271', // departures (commands)
  '1566206194090246295', // the-map-room (staff maintained)
  '1566217493419266211', // adult-rp-guidelines
  '1566217524041875648', // adult-ooc
  '1566217708754829392'  // optional-access
];
const ids=v=>String(v??'').split(',').map(s=>s.trim()).filter(s=>/^\d{17,20}$/.test(s));
export function liveConfig(env=process.env) {
  const excluded=new Set(env.AP_EXCLUDED_IDS!==undefined&&env.AP_EXCLUDED_IDS.trim()!==''?ids(env.AP_EXCLUDED_IDS):DEFAULT_EXCLUDED);
  return {live:env.LEDGER_LIVE==='true',excluded,log:ids(env.AP_LOG_CHANNEL_ID)[0]??null,hunting:ids(env.HUNTING_CHANNEL_ID)[0]??null,mining:ids(env.MINING_CHANNEL_ID)[0]??null};
}
// A message's channel, its parent (forum or text channel for threads, or the
// category) and the grandparent (category of a thread's forum).
export function channelChain(message) {
  const ch=message.channel;
  return [message.channelId,ch?.parentId,ch?.parent?.parentId].filter(Boolean);
}
export function earnsWritingAP(message,cfg,guildId) {
  if(message.guildId!==guildId) return false;
  const chain=channelChain(message);
  if(chain.some(id=>cfg.excluded.has(id))) return false;
  // Gathering channels earn gathering AP only; Tupper posts there still count as writing.
  return true;
}
export const gatheringKind=(message,cfg)=>message.channelId===cfg.hunting?'hunting':message.channelId===cfg.mining?'mining':null;
// Commands that use a daily gathering attempt (pinned rules): !mine, and
// !hunt end which concludes a hunt and claims its rewards.
export function gatheringCommand(content,kind) {
  const c=String(content??'').trim().toLowerCase().replace(/\s+/g,' ');
  if(kind==='mining') return c==='!mine'||c.startsWith('!mine ');
  if(kind==='hunting') return c==='!hunt end';
  return false;
}
// Avrae reports alias failures in plain text like "Error evaluating expression: ...".
export const avraeError=message=>/^(error|an error occurred|❌)/i.test(String(message.content??'').trim())||/error evaluating/i.test(String(message.content??''));
