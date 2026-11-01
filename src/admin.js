export class UserError extends Error {}

export function registrationInput(name, prefix, suffix = '') {
  name = name.trim();
  if (!name || name.length > 80) throw new UserError('Use a character name of 1–80 characters.');
  if (prefix.length > 32 || suffix.length > 32 || (!prefix.trim() && !suffix.trim())) throw new UserError('Provide at least one nonempty bracket; each bracket may have at most 32 characters.');
  if (/[\r\n]/.test(prefix + suffix)) throw new UserError('Brackets cannot contain line breaks.');
  return { name, prefix, suffix };
}

export function adjustmentInput(delta, day, reason, today) {
  if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 4) throw new UserError('Change AP by -4 to +4, excluding zero.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(Date.parse(day + 'T12:00:00Z')) || new Date(day + 'T12:00:00Z').toISOString().slice(0, 10) !== day || day > today) throw new UserError('Use a valid date YYYY-MM-DD, today or earlier.');
  reason = reason.trim();
  if (reason.length < 5 || reason.length > 300) throw new UserError('Provide a reason of 5–300 characters.');
  return { delta, day, reason };
}

export function staffAllowed(member, configuredRoleIds = []) {
  return member.permissions.has(8n) || configuredRoleIds.some(id => member.roles.cache.has(id));
}
