// Only a counting aid: moderators decide whether prose is eligible.
export function countWords(text) {
  const prose = text.split(/\r?\n/).filter(line => !/^\s*(>|[!/])/.test(line)).join('\n')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/<[^>]+>/g, ' ');
  return (prose.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) ?? []).length;
}

export function serverDay(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

// Pure calculation. Persistence must lock the player's record and deduplicate events.
export function creditWriting({ remainder = 0, dailyAP = 0 }, words) {
  if (!Number.isInteger(words) || words < 0 || !Number.isInteger(remainder) || remainder < 0 || remainder >= 300 || !Number.isInteger(dailyAP) || dailyAP < 0 || dailyAP > 4) throw new Error('Invalid activity input');
  if (dailyAP === 4) return { remainder, dailyAP, awarded: 0 };
  const total = remainder + words;
  const awarded = Math.min(Math.floor(total / 300), 4 - dailyAP);
  // Discard surplus written after reaching the cap, not unfinished prior progress.
  return { remainder: dailyAP + awarded === 4 ? 0 : total % 300, dailyAP: dailyAP + awarded, awarded };
}

export function characterSlots({ elapsedDays, totalAP, activeDays }) {
  if (elapsedDays >= 60 && totalAP >= 120 && activeDays >= 40) return 4;
  if (elapsedDays >= 30 && totalAP >= 60 && activeDays >= 20) return 3;
  return 2;
}
