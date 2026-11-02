# The Wickhaven Ledger — TEST review workflow

All AP and approvals remain test records. Existing balances, submissions and Tupper registrations are preserved.

## Latest changes
- Drowned Watch TEST: the departure review is now a formatted embed with a sheet link in the title, HP / passive Perception / coins side by side, skills on one line, one inventory field per carried bag (empty bags shown), known observations as a list, and an amber color when HP is low.
- Drowned Watch TEST: the departure review shows a Low HP warning when the character is at or below half maximum HP. Departure is still allowed. New departures at 0 HP remain blocked.
- Drowned Watch TEST: the landing now offers one optional paid choice, "Leave 1 gp in the tide-box (spends 1 gp)", for bag-based departures with at least 1 gp. It records the tide-rota observation, can be bought once per visit, and leaves a pending receipt. After updating Avrae, run !depart reconcile <run id>; new departures stay blocked until the exported coins match. All free paths are unchanged.
- RP samples are no longer required or displayed.
- Review post titles contain only the character name; existing titles are repaired automatically.
- Request Changes saves Changes Requested, never Approved, and sends the player a DM containing the staff note and review-post link.
- After editing their character, the submitting player clicks Resubmit Changes, or runs /ledger-character resubmit name:Character. The same post returns to Pending, Moderators are alerted, and Approve is enabled again.
- Resubmit reuses saved links and options. If those changed, run submit again with the same name to replace them.
- Only administrators and configured Moderators can approve or request changes. Only the submitting player can resubmit. Staff may explicitly return an approved record for corrections. Its original first-approval date remains historical; it does not count as currently approved until reapproved.

## Deployment
Upload the project contents to the existing GitHub repository. No environment changes for this update. Dockerfile defaults to the website endpoint; vercel.json overrides the daemon to run src/bot.js. Do not merge those entry points.

Required Production variables: DISCORD_TOKEN, DISCORD_GUILD_ID, TEST_CHANNEL_ID, TUPPERBOX_BOT_ID, AP_TEST_MODE=true, DATABASE_URL, CHARACTERS_CHANNEL_ID, MODERATOR_ROLE_IDS. Values and secrets stay in Vercel. Never commit .env.

The characters channel must be a forum. Grant the bot View Channel, Send Messages, Send Messages in Threads, Read Message History, Embed Links and Manage Threads. To ping a non-mentionable Moderator role, grant Mention @everyone, @here, and All Roles in that forum; outgoing mentions allow only the configured moderator role. Optional forum tags: Pending, Approved, Changes Requested.

## Review controls
/ledger-character submit collects name, sheet URL, stat-roll message link, selected set and resources. Stat links must point to this server. D&D Beyond share URLs are preserved. Staff must manually verify ownership, level 3, 2024/legacy eligibility, official WotC sources, stat selection and resource rules. No sheet or linked message is fetched by this bot.

/ledger-character list, slots, publish and resubmit manage existing records. /ledger-review privately shows staff the submission and latest change-request DM delivery status. Staff slash commands default to administrator-only in Discord; grant moderator command access in Server Settings > Integrations, and include their role in MODERATOR_ROLE_IDS. Buttons check that role directly. Staff notes are public on the review post.

Approving consumes an available slot. There are two initial slots; the third requires 30 elapsed days, 60 AP and 20 active days; the fourth requires 60 days, 120 AP and 40 active days. The first approval starts the clock. Later approvals do not reset it. Earned slots stay unlocked after AP corrections.

## DM delivery
Change-request notifications are queued in the same transaction as the saved review. Immediate delivery is attempted and staff are told whether the DM succeeded, was blocked or remains queued. Transient failures retry with a delay, at most five attempts. Discord privacy blocks are not retried indefinitely. The request remains in the public review post and player submission list if DMs fail. Outdated requests are skipped after resubmission or a newer decision.

Existing latest Changes Requested records receive a queued notification after deployment. No arbitrary message or old approved/replaced request is sent. DMs include the correction note only, not RP message contents. No approval DM is implemented. Database and Discord cannot commit atomically; recent duplicate sends use Discord nonce deduplication, but rare duplicates after crashes cannot be ruled out.

## AP and registration
/ledger-tupper register, list and remove manage a player's bracket settings; they do not approve a character. Matching uses the original Discord author, registered bracket normalization, original deletion and the Tupperbox webhook creator. Ambiguous evidence is held for review. Autoproxy supports unchanged text. Names displayed by webhooks are never treated as player identities.

Only matched Tupper messages in bot-testing earn test writing AP. 300 words = 1 AP; 4 AP/day across characters; unfinished words carry forward, but surplus after the cap is discarded. Chicago midnight defines days. /ledger-ap shows test balances. /ledger-adjust and /ledger-audit provide staff corrections and an audit trail. AP corrections do not adjust word totals or source eligibility.

## Limitations and checks
No live progression, directory posting, role assignment, character retirement/transfer, Avrae departure export, gathering awards, historical replay or post-credit edit/delete reconciliation yet. Proxy correlation is not a signed ownership attestation. Padding and copied prose require human review. Restart gaps may need correction.

Run npm ci and npm test using Node 24. Tests include embedded PostgreSQL, mocked Discord publishing and DMs, and the full changes-requested/resubmit/approve sequence. Hosted behavior must still be verified after deployment.
