# Drowned Watch prototype — November 1, 2026

Target: https://github.com/straberiwine74/wickhaven-ledger-github — main.

## Status and scope

Implemented locally: structured export validation, signature checks, TEST-approved sheet matching, explicit loadout confirmation, three skill approaches, visible passive Perception, saved choices/rolls, owner-only revision buttons, pause/resume, safe retreat, persistent character observations, fresh completed visits and one reconnaissance journal record per character. No AP or gold is awarded. Existing AP and approval data are not rewritten.

Not live-tested: the Draconic alias, the Avrae verification endpoint, Discord permissions and click behavior, Neon migrations/concurrency, or Vercel deployment. Local integration tests use PostgreSQL-compatible PGlite and mocked signature verification. The alias is a delivered draft pending an actual Avrae run. This is a solo test encounter in one configured text channel, not the full expedition-thread system. World state changes, tide/night selection, tools, spells, class-feature checks, gathering/AP integration and automatic reconciliation are not implemented.

The GitHub repository was identified by Sheri but could not be fetched in this session. The update ZIP deliberately excludes a replacement bot.js: its installer adds only the hooks to a freshly downloaded copy of main, and stops if expected integration points differ. A private or inaccessible repository does not prove the local files match the deployment.

## What Avrae exposes, and the inventory decision

Checked primary documentation and source on November 1, 2026:

- [Aliasing API](https://avrae.readthedocs.io/en/stable/aliasing/api.html): character(), JSON serialization, invocation context and signature verification.
- [Character API source](https://github.com/avrae/avrae/blob/master/aliasing/api/character.py): stable upstream identity, coinpurse, current custom counters and character variables. Counters are accessible, but not all character abilities are necessarily represented by counters. This prototype exports coins but offers no counter expenditure.
- [Stat block API source](https://github.com/avrae/avrae/blob/master/aliasing/api/statblock.py): HP and skill modifiers/advantage. The prototype exports only its four relevant skills. Proficiency and expertise are already included in final modifiers; do not add them again. General tools, conditional bonuses, special rerolls, minimum-die features and spells are unsupported here.
- [D&D Beyond importer](https://github.com/avrae/avrae/blob/master/cogs5e/sheets/beyond.py): inspected importer does not provide an inventory export or an explicit passive-score field. Do not equate an inventory alias's bags with D&D Beyond inventory. No bag format has been validated for this server.
- [Avrae message processing](https://github.com/avrae/avrae/blob/master/dbot.py): bot-authored commands are ignored. The Ledger rolls its own d20 from the confirmed snapshot.

For this test, an explicit character variable named ledger_loadout declares carried items and the character's actual passive Perception. It is player-declared data, not an automatically verified sheet/bag import. Review it against the sheet before confirming. The prototype never substitutes a guessed passive score. Skills/HP/coins come from the active Avrae character; the test confirmation lists everything it supports.

The confirmed Ledger snapshot controls the unfinished test visit. External !update, new bags or later exports cannot replace it. Pausing and retreating replenish nothing. This encounter does not spend HP, equipment or coins; failed approaches add noise or delay and different observations, with no damage/death subsystem. All three approaches resolve to a safe landing and an opportunity to finish or retreat. No resting button exists.

No automatic Avrae/D&D Beyond write-back exists. Before this is used for a resource-spending adventure, add an end-of-expedition reconciliation receipt and decide how staff verify it. Do not treat the prototype as the live inventory authority for other server activities.

## Install without replacing existing features

1. Download main from GitHub: green **Code → Download ZIP**. Extract it to a new local folder. Keep your existing deployment copy as a backup.
2. Extract `wickhaven-quest-update.zip`. Copy its contents into the repository folder that contains package.json, merging src and test. This ZIP contains no bot.js, Dockerfile, vercel.json, .env, secrets or node_modules.
3. Open a terminal in that repository folder. Run `node install-quest-module.cjs`. It edits only src/bot.js at three checked integration points. If it reports a different version, stop; do not replace the repository's bot.js with an older local file. The installer makes no changes when anchors do not match.
4. Optionally run `npm ci` and `npm test` locally. These use the repository's existing dependency versions.
5. On GitHub main, upload the modified src/bot.js, new src/quest.js and src/quest-discord.js. Also upload test/quest.test.js, depart-alias.txt and QUEST-SETUP.md for the test and setup record. Keep the existing package files and all other source files. Do not upload node_modules or .env.
6. Commit with `feat: add test departure snapshots and Drowned Watch encounter`.
7. In Vercel, preserve existing variables, then add the three quest settings below. Redeploy main after saving them.
8. Preserve Dockerfile's website command and vercel.json's explicit daemon command `node src/bot.js`. This update requires no changes to either file. Only the daemon should connect to Discord.

New Vercel settings:

```text
QUEST_TEST_ENABLED=true
QUEST_TEST_CHANNEL_ID=<copy the Discord channel ID for a dedicated quest test text channel>
AVRAE_BOT_ID=<copy the application/user ID of the genuine Avrae bot already installed>
```

Existing requirements remain: AP_TEST_MODE=true, DATABASE_URL, DISCORD_TOKEN, DISCORD_GUILD_ID and TEST_CHANNEL_ID. Do not paste credential values into chat. QUEST_TEST_CHANNEL_ID can be the current bot-testing channel, but a separate staff-only quest test text channel avoids AP diagnostic chatter. No server-wide AP expansion occurs. The bot needs View Channel, Read Message History, Send Messages and Embed Links in the quest test channel; the existing Message Content intent remains necessary. Avrae also needs access there.

New database tables are additive and begin `ledger_quest_test_`. They initialize automatically at daemon startup. Disable this feature by setting QUEST_TEST_ENABLED=false and redeploying; keep the tables to preserve unfinished tests.

## Install the server departure alias

Use a server administrator/Server Aliaser account. Copy the entire contents of depart-alias.txt into a Discord message in a channel Avrae can read. It starts with `!servalias depart ...`. This creates a server alias; a personal depart alias will be rejected by the Ledger's signature check. Remove or rename a conflicting personal alias on the test account.

On the test player's account, select the correct active character and run !update. It must already have a TEST-approved Ledger submission for that D&D Beyond sheet ID.

Set a small, accurate declared manifest. This is EXAMPLE DATA ONLY: replace 15 and the items with the character's actual passive Perception and carried inventory, including quantities. It does not grant equipment.

```text
!cvar ledger_loadout {"passivePerception":15,"items":[{"name":"Rope (50 feet)","qty":1},{"name":"Rations","qty":3}]}
```

Then run in the configured quest test channel:

```text
!depart drowned-watch
```

Avrae should send an embed titled BTLL departure v1 with machine-readable JSON and a readable footer. The Ledger then shows the character, actual exported HP/skills/coins, declared passive/inventory and confirmation controls. Review that information, then click Confirm loadout. If incorrect, click Discard unconfirmed departure, correct the source and export again. Discard is available only before confirmation.

After confirmation, play uses buttons. Run !depart drowned-watch again only to recover missing controls or start a new visit after completion. An unfinished visit always returns its original snapshot and saved scene. Repeated stale clicks return the current saved state; they do not reroll. An OOC break needs no action. Return to town is a safe in-character retreat along the known shore path; returning resumes at the shore or secured landing without resetting the earlier check.

If no Ledger response appears, check channel IDs, permissions, enable flag and daemon logs. If the export is rejected, check server-vs-personal alias, approval sheet ID, active character, manifest and payload size. Signature-service failures fail closed. No credentials are needed to investigate these checks.

## Snapshot and security boundary

Version 1 includes quest, guild/channel/player/invocation IDs as strings, beyond-<sheet-id>, name, HP/max/temp HP, four {mod,adv} skill entries, declared passive Perception, declared item names/quantities, five coin denominations and signature. Maximum 3,800 serialized characters and 20 inventory entries. Oversized exports are rejected rather than truncated. Normal item names are permitted; markup/control text is rejected in item names.

Accepted messages must come directly from the configured Avrae bot, in the configured server/channel, without a webhook. The public Avrae verification endpoint must confirm a fresh SERVER_ALIAS invocation with matching player, channel, guild, invocation ID and the alias marker 7. Numeric API snowflake IDs are preserved without JavaScript precision loss.

Avrae signatures authenticate invocation context; they do NOT cryptographically bind arbitrary snapshot JSON or the alias's source code. The installed server alias and people allowed to edit server aliases remain trusted. Player-editable manifests and Avrae overrides remain subject to staff review. This is not an anti-cheat attestation from D&D Beyond.

Each accepted choice is committed in a transaction under a row lock, with an incrementing revision and audit event, before Discord is told it succeeded. A later delivery failure leaves the committed result available on recovery. Database failure rolls back the change. This is not a claim of live Neon concurrency testing.

Location reset rule for this prototype: after completion, the next visit begins at the shore with fresh rolls and a fresh confirmed snapshot. Personal observations persist. The tower is treated as unchanged scenery; no shared-world alterations are modeled. One journal reward key is allowed per character across visits. There are no tangible repeatable rewards. Knowledge-dependent night/low-tide entry remains future work.

## Live acceptance checks — still pending

- Alias executes in Avrae without syntax/quoting errors, and declared/exported values match the selected sheet. Test disadvantage as well as ordinary checks.
- Fresh server alias accepted; personal alias, user-pasted JSON and webhook copies rejected.
- Only the owner can confirm/play. A player-only second account cannot advance someone else's expedition.
- Repeated/rapid approach clicks produce one saved check; stale controls show the saved result. Test simultaneous clicks against Neon.
- Restart/redeploy after a roll, export again and recover the same result, inventory and scene.
- Retreat/return before and after the check preserves state. Closing Discord grants no rest.
- Complete, revisit, and verify fresh rolls with old knowledge and one journal reward record total.
- Existing character-review buttons, TEST AP and moderator flows still work. Confirm website visits do not create extra Discord startup messages.

Do not announce this as live until these checks pass. No adventure library is included.
