import { UserError } from './admin.js';
import { characterSlots } from './activity.js';

export function messageLink(value, guildId) {
  let url;
  try { url = new URL(value); } catch { throw new UserError('Use a Discord message link for the stat rolls and RP sample.'); }
  const match = url.pathname.match(/^\/channels\/(\d{17,20})\/(\d{17,20})\/(\d{17,20})\/?$/);
  if (url.protocol !== 'https:' || !['discord.com','www.discord.com'].includes(url.hostname) || !match || match[1] !== guildId || url.username || url.password) throw new UserError('Use a Discord message link from this server.');
  return `https://discord.com/channels/${match[1]}/${match[2]}/${match[3]}`;
}
export function characterInput(input, guildId) {
  const name = input.name.trim();
  if (!name || name.length > 80 || /[\r\n]/.test(name)) throw new UserError('Use a character name of 1–80 characters on one line.');
  let sheet;
  try { sheet = new URL(input.sheet); } catch { throw new UserError('Use a D&D Beyond character-sheet link.'); }
  const match = sheet.pathname.match(/^\/(?:profile\/[^/]+\/)?characters\/(\d+)(?:\/[A-Za-z0-9_-]{1,128})?\/?$/);
  if (sheet.protocol !== 'https:' || !['www.dndbeyond.com','dndbeyond.com'].includes(sheet.hostname) || !match || sheet.username || sheet.password) throw new UserError('Use a D&D Beyond character-sheet link.');
  if (![1,2,3].includes(input.set)) throw new UserError('Choose stat set 1, 2 or 3.');
  if (!['equipment','gold'].includes(input.resources)) throw new UserError('Choose equipment for both packages, or gold for both packages.');
  return { name, nameKey:name.toLowerCase(), sheetId:match[1], sheet:sheet.href, stats:messageLink(input.stats,guildId), sample:messageLink(input.sample,guildId), set:input.set, resources:input.resources };
}
export function slotState(firstApproval, earnedSlots, totalAP, activeDays, now = new Date()) {
  const elapsedDays = firstApproval ? Math.max(0,Math.floor((new Date(now) - new Date(firstApproval)) / 86400000)) : 0;
  const unlocked = Math.max(earnedSlots, firstApproval ? characterSlots({elapsedDays,totalAP,activeDays}) : 2);
  const next = unlocked === 2 ? { days:30,ap:60,active:20 } : unlocked === 3 ? { days:60,ap:120,active:40 } : null;
  return { unlocked, elapsedDays, totalAP, activeDays, firstApproval, next };
}
