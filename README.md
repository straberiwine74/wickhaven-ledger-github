# The Wickhaven Ledger — TEST review workflow

All AP and approvals remain test records. Existing balances, submissions and Tupper registrations are preserved.

## Latest changes
- Live AP (`LEDGER_LIVE=true`): Tupper posts in every in-character channel and forum thread earn AP for players with an approved character. OOC, setup, rules and staff spaces are excluded (list in `src/live.js`, override with `AP_EXCLUDED_IDS`). Bracket registration now requires an approved character. Awards and held messages are logged to `AP_LOG_CHANNEL_ID`, never in the scene. Existing TEST AP and approvals carry over unchanged.
- Gameplay AP: quests marked `status:'live'` award 1 AP for each first-time milestone with `ap: 1` (including `completion.ap`). `!mine`, or `!hunt end`, confirmed by Avrae's reply in `MINING_CHANNEL_ID` / `HUNTING_CHANNEL_ID`, awards 1 AP per player per day. Everything shares the 4 AP/day cap. A quest milestone reached at the cap is held and paid on the player's next day with room (before new AP that day; an hourly sweep also pays it). Gathering AP at the cap is not held: it's a once-per-day allowance. `/ledger-ap` shows held AP.
- Fixed: the "Writing saved" report failed to post after the card update (a naming clash in bot.js).
- Quest engine: quests are now data files in `src/quests/` run by `src/quest-engine.js`. The Drowned Watch was converted with the same scene and choice ids, so unfinished runs continue. Supports skill checks, saving throws, ability checks, advantage, passives, damage (fixed or dice), going down at 0 HP, once-per-visit choices, costs, milestones, and choices unlocked by earlier discoveries.
- Full character export: `avrae/depart-alias.txt` (v3) exports all 18 skills, 6 saves, 6 ability checks, ability scores, level, HP, carried bags and coins. Passive Perception uses `ledger_passive_perception` if set, otherwise 10 + Perception (±5 for advantage/disadvantage). The bot still accepts v1/v2 exports. `!depart <quest code>` works for any registered quest.
- Every Ledger message (expeditions, supplies, departures, AP, Tupper brackets, character submissions and reviews, staff adjustments, DMs and channel reports) now uses the shared card style in `src/ui.js`. Review-post lookup still works for existing posts.
- Drowned Watch TEST: the departure review is now a formatted embed with a sheet link in the title, HP / passive Perception / coins side by side, skills on one line, one inventory field per carried bag (empty bags shown), known observations as a list, and an amber color when HP is low.
- Drowned Watch TEST: the departure review shows a Low HP warning when the character is at or below half maximum HP. Departure is still allowed. New departures at 0 HP remain blocked.
- Drowned Watch TEST: the landing now offers one optional paid choice, "Leave 1 gp in the tide-box (spends 1 gp)", for bag-based departures with at least 1 gp. It records the tide-rota observation, can be bought once per visit, and leaves a pending receipt. After updating Avrae, run !depart reconcile <run id>; new departures stay blocked until the exported coins match. All free paths are unchanged.
- RP samples are no longer required or displayed.
- Review post titles contain only the character name; existing titles are repaired automatically.
- Request Changes saves Changes Requested, never Approved, and sends the player a DM containing the staff note and review-post link.
- After editing their character, the submitting player clicks Resubmit Changes, or runs /ledger-character resubmit name:Character. The same post returns to Pending, Moderators are alerted, and Approve is enabled again.
- Resubmit reuses saved links and options. If those changed, run submit again with the same name to replace them.
- Only administrators and configured Moderators can approve or request changes. Only the submitting player can resubmit. Staff may explicitly return an approved record for corrections. Its original first-approval date remains historical; it does not count as currently approved until reapproved.

## Going live
Set these in Vercel, then redeploy: `LEDGER_LIVE=true`, `AP_LOG_CHANNEL_ID` (staff-only log), `HUNTING_CHANNEL_ID`, `MINING_CHANNEL_ID`, and optionally `QUEST_CHANNEL_ID` (where players run `!depart` for live quests). Test quests keep running only in `QUEST_TEST_CHANNEL_ID`.

## Writing a quest
1. Copy `src/quests/drowned-watch.js` to `src/quests/<quest-code>.js` and change the id, name, scenes and text.
2. Add it to the list in `src/quests/index.js`.
3. Run `npm test`. Every quest is validated; the error names the scene and choice to fix.

Scene choices (max 5 per scene) are one of:
- **Check:** `check:{skill:'stealth'|save:'dex'|ability:'str', dc:13}` with `success` and `failure` outcomes.
- **Plain:** `outcome:{...}` with no roll.

Outcomes can set `ap: 1` together with a `milestone` (and `completion.ap: 1`) to award AP once per character when the quest's status is `live`. Outcomes can also set `text`, `goto` (a scene id, `@complete` or `@retreat`), `facts` (saved to the character forever), `flags` (this visit only), `milestone`, and `damage` (number or dice like `1d6+1`; reaching 0 HP ends the visit as **Carried Home**).
Choice options: `requires:{facts:[...], notFacts:[...], flags:{...}, minLevel:3, bags:true}`, `cost:{coins:{gp:1}, items:[...], hp:2}`, `once:true`, `style`, `emoji`. A scene can add `passive:{skill, dc, success:{text, facts}}`.

## Avrae departure alias
The installed `!depart` server alias source is `avrae/depart-alias.txt`. Paste it into the Avrae workshop alias when it changes. Deploy the bot first: it accepts both the old and new export formats.

## Card style (use for every new message)
Build every bot message with `card()` / `message()` / `notice()` from `src/ui.js` so the Ledger looks like one system:
- **Title:** short and specific, one leading emoji at most (e.g. `🎒 Supplies & Receipt`).
- **Description:** one or two sentences; bold the key word or number.
- **Fields:** short labelled facts. Inline for numbers (HP, coins, AP); full width for lists and instructions.
- **Tone (side stripe):** `info` teal (default), `success` green, `warning` amber (action needed), `danger` red (stopped), `pending` blue (waiting on staff), `neutral` gray. Expedition scenes use `shore`, `landing`, `town`.
- **Footer:** added automatically as `The Wickhaven Ledger • TEST • …`. Add a run or review reference after it when useful.
- **Buttons:** green for confirm/finish, red for discard, blue for main story choices, gray for utilities; one emoji each.

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
