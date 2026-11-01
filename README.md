# The Wickhaven Ledger — saved TEST AP

This update adds self-service brackets and audited staff corrections. Existing test balances are preserved. It still tracks only the test channel and does not enable real progression.

## Public review forum

Set CHARACTERS_CHANNEL_ID=1566205298870325288 and MODERATOR_ROLE_IDS=1566212934449893457 in Vercel Production. If there are multiple moderator roles, use comma-separated IDs; the first is the notification role. All listed roles pass runtime staff authorization. Administrators also pass.

Grant Ledger View Channel, Send Messages (to create forum posts), Send Messages in Threads, Read Message History, Embed Links, and Manage Threads in the characters forum. To notify a non-mentionable Moderator role, allow Mention @everyone, @here, and All Roles specifically in that forum; the code's explicit role allowlist permits only the configured moderator role and never @everyone. Alternatively, make the notification role mentionable. Required forum tags should be disabled, or provide Pending, Approved and Changes Requested tags.

Each submission publishes a public forum post containing its player, character-sheet link, selected stat-set and roll link, RP-sample link, resource selection, rules checklist, status and staff review buttons. No linked message or sheet content is copied. Review notes entered by staff are public; never include sensitive scene text. The separate approved-character directory is not touched.

The Approve button requires a public note and typing APPROVE to attest manual review. Request Changes requires a public correction note. Every button and modal rechecks staff authorization. Modal submission checks the revision, so a changed submission cannot be approved from a stale modal. Role and slot changes remain governed by the existing database review logic; no Discord roles are assigned.

Resubmitting updates the same post, increments its revision and sends a fresh moderator alert. Completed decisions update the starter message and disable its buttons. /ledger-character publish name:Character repairs or publishes an existing submission without resubmission. Existing saved records are queued automatically at startup; queued failures retry every minute. A save can succeed even if Discord publishing fails; the private reply distinguishes that case. Database row locks and stored thread IDs prevent normal duplicate posts; recovery searches bot-created active and archived posts by a stable marker after an interrupted creation. Network failure around a Discord notification may still produce a duplicate ping; Discord and Postgres cannot commit atomically.

Character commands work in bot-testing and in the configured review forum and its posts. Other commands and AP tracking remain restricted to bot-testing. No public text here earns AP. Default staff slash commands remain administrator-only in Discord; enable the Moderator role in the app's command permissions if moderators should use slash commands. The forum buttons use runtime role checks directly.

## Character submissions and slots (TEST)

/ledger-character submit collects a character name, D&D Beyond sheet URL, server message links for stats and an RP sample, chosen stat set (1–3), and equipment-or-gold selection. /ledger-character list shows your submissions and correction requests. /ledger-character slots shows approved characters, earned slots, first-approval date and remaining requirements.

Administrators use /ledger-review, /ledger-approve and /ledger-reject. Moderator access uses MODERATOR_ROLE_IDS plus Discord integration command permissions as for adjustment commands. Approval requires verified:true and a note after manually reviewing all sources. URL format is validated; linked messages, content access, sheet ownership, level, ability scores, reactions, rules and equipment are not automatically verified. No D&D Beyond data is fetched or imported. Staff must have permission to read the submitted posts.

Two slots are initially available. A first approval starts the elapsed-time clock. The third slot requires 30 full elapsed days, 60 cumulative test AP and 20 active days. The fourth requires 60 days, 120 AP and 40 active days. Slot status and approvals evaluate these requirements on demand. Earned slots persist through subsequent AP corrections. Approvals are serialized per player and cannot exceed the available slots. Duplicate review interactions are idempotent; a sheet cannot be submitted under multiple accounts within this server. Pending submissions do not consume approved slots. Rejected submissions can be edited and resubmitted under the same name.

New tables: ledger_test_character_accounts, ledger_test_characters and ledger_test_character_reviews. Decisions record staff identity, note and date. No roles are changed. Tupper registrations remain separate and do not grant approval. Current test AP still counts regardless of approval; approval-gated live activity is future work. Do not treat these test records as a launch-ready approval system. No retirement, transfer, approved-sheet edits or approval reversal is implemented yet.

## Setup
Keep existing variables unchanged. AP_TEST_MODE=true and DATABASE_URL enable test storage. MODERATOR_ROLE_IDS is optional: comma-separated role IDs allowed to moderate. Administrators are allowed automatically. Enable Message Content Intent and Manage Webhooks in the testing channel.

## Player commands
- /ledger-tupper register name:Ryder prefix:R:
- /ledger-tupper register name:Lyra prefix:L:
- /ledger-tupper list
- /ledger-tupper remove name:Ryder
- /ledger-ap

Omit suffix for a prefix-only Tupper. Paired and suffix-only brackets are also supported. Registering the same character name updates its brackets. Entries are per player and persist without a deployment. Prefixes may be shared by different players. Existing hard-coded Lyra brackets are no longer used; register Lyra once too.

Registration normalizes original-message text. It does not change Tupperbox, approve a character, grant a slot, or verify the displayed character identity. Only the initiating Discord account can manage its entries.

## Staff commands
- /ledger-adjust player:@player change:-1 reason:Correction
- Optional day:2026-10-31; defaults to today in America/Chicago.
- /ledger-audit player:@player

The commands default to administrator-only. For moderators, configure MODERATOR_ROLE_IDS and grant those roles the corresponding command permissions under Discord Server Settings > Integrations > The Wickhaven Ledger. Runtime authorization checks the actual member's administrator permission or configured roles.

Every adjustment records moderator, target, date, before/after AP, reason and interaction ID. Duplicate interactions cannot apply twice. Daily AP must stay between zero and four. Totals and active days update from daily balances. A day is active if it has at least one AP. Undo a correction with another reasoned correction; audit entries remain.

Adjustments change AP only. They do not remove unfinished words or invalidate source writing. Removing today's AP can allow later writing to earn AP again. Raw RP or adult scene text must not be put in correction reasons. Source-event and word deductions remain future work.

## Storage and attribution
Tables: ledger_test_players, ledger_test_days, ledger_test_events, ledger_test_adjustments, ledger_proxy_registrations. Store IDs, dates, counts, bracket settings and reasons, not RP text. Transactions serialize AP changes per player and unique original/proxy IDs prevent duplicate credit.

Matching needs the Tupperbox webhook creator, a unique matching original in the same channel within 15 seconds, bracket-normalized text, and observed deletion. Pending bracket lookups are awaited. Autoproxy matches unchanged text. This remains correlation evidence, not a signed Tupperbox attestation. Display names are never identities. Ambiguous or missing evidence gets no automatic credit.

Current limits: no historical backfill, edit/delete reconciliation, gathering AP, approval dates or real slot unlocks. Only matched proxy writing counts in TEST_CHANNEL_ID. Ordinary messages remain diagnostic-only. Edits or deletions after credit do not revise the test balance. Word counting is heuristic; moderators must review copied or padded prose. Registration is not approval and does not enforce character slots yet.

## Run and deploy
Use Node 24; npm ci, then npm test. Copy .env.example to .env for local private settings and run npm start. Never commit .env.

Upload this project's contents at the GitHub repository root. Dockerfile defaults to src/web.js for website traffic, while vercel.json explicitly starts src/bot.js only in the daemon. Keep them separate. Vercel Daemons run only in production and have usage quotas. The database tables initialize automatically. No secrets are included in this package. Tests use embedded PostgreSQL; hosted behavior needs live verification.
