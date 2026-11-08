// Applicant → Adventurer promotion when staff approve a character.
// Role IDs come from Vercel (APPLICANT_ROLE_ID / ADVENTURER_ROLE_ID), with
// Thaleryn's roles as defaults. The Ledger needs Manage Roles, and its own role
// must sit above both of these in Server Settings → Roles.
export const APPLICANT_ROLE_ID = process.env.APPLICANT_ROLE_ID || '1553525639661752390';
export const ADVENTURER_ROLE_ID = process.env.ADVENTURER_ROLE_ID || '1553524532873134210';

// Runs after an approval is saved. Never throws: the approval stays saved even
// if the role swap or the thread message fails.
export async function promoteApplicant({ client, pool, guildId, playerId, nameKey, roles = { applicant: APPLICANT_ROLE_ID, adventurer: ADVENTURER_ROLE_ID } }) {
  let thread = null;
  try {
    const post = (await pool.query('SELECT thread_id FROM ledger_test_review_posts WHERE guild_id=$1 AND player_id=$2 AND name_key=$3', [guildId, playerId, nameKey])).rows[0];
    if (post) thread = await client.channels.fetch(post.thread_id).catch(() => null);
  } catch {}
  const say = content => thread?.send({ content, allowedMentions: { parse: [], users: [playerId] } }).catch(() => console.error('Promotion note could not be posted in the review thread.'));
  let member;
  try {
    const guild = await client.guilds.fetch(guildId);
    member = await guild.members.fetch(playerId);
  } catch (e) {
    if (e?.code === 10007 || e?.code === 10013) { console.log(`Promotion skipped: player ${playerId} is no longer in the server.`); return 'left'; }
    console.error(`Promotion failed: could not fetch player ${playerId} (Discord ${e?.code ?? 'unknown'} ${e?.message ?? ''}).`);
    await say(`⚠️ Approved, but the Ledger couldn't look up <@${playerId}> to change roles. Staff: please add **Adventurer** and remove **Applicant** by hand.`);
    return 'failed';
  }
  try {
    if (!member.roles.cache.has(roles.adventurer)) await member.roles.add(roles.adventurer, 'Character approved');
    if (member.roles.cache.has(roles.applicant)) await member.roles.remove(roles.applicant, 'Character approved');
  } catch (e) {
    console.error(`Promotion failed for ${playerId}: Discord ${e?.code ?? 'unknown'} ${e?.message ?? ''}. Check Manage Roles and that the Ledger's role is above Adventurer and Applicant.`);
    await say(`⚠️ Approved, but the Ledger couldn't change <@${playerId}>'s roles (${e?.code === 50013 ? 'missing Manage Roles, or the Ledger’s role is below Adventurer/Applicant' : `Discord ${e?.code ?? 'error'}`}). Staff: please add **Adventurer** and remove **Applicant** by hand.`);
    return 'failed';
  }
  await say(`✅ Approved! <@${playerId}> now has the Adventurer role. The realm is open to you.`);
  return 'promoted';
}
