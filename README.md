# The Wickhaven Ledger — diagnostic prototype

## Saved TEST AP stage

Set AP_TEST_MODE=true and provide the Neon DATABASE_URL in Production environment variables. Existing Discord/Tupper settings remain required. Startup creates only ledger_test_players, ledger_test_days and ledger_test_events. These tables never count toward real progression. They store IDs, dates, word counts and AP, not message content.

Only successfully matched Tupper messages in TEST_CHANNEL_ID are credited. Ordinary messages and ambiguous proxies remain diagnostic-only. /ledger-ap shows the invoking player's private test balance in that channel. Grant Use Application Commands where needed. Database failures do not produce a successful saved-credit report. Restarting preserves committed balances; messages missed during downtime are not backfilled.

Test sequence: send 300 words of original sample prose through Lyra, run /ledger-ap, redeploy, and run /ledger-ap again. Check that the balance survives. Test the remainder with shorter messages. Do not repeatedly send identical sample posts within 15 seconds: ambiguous matches are intentionally held.

Current limitations before production: no moderation adjustments, approval dates, real slot unlocks, other channels, gathering awards, historical replay or edit/delete reconciliation. Edits or deletions after credit do not change this disposable test balance. Proxy correlation is not authoritative Tupperbox attestation. Commands and obvious quotes are excluded heuristically; copied or padded prose needs human review. Concurrent deployment overlap is deduplicated by unique original/proxy IDs and serialized player records in transactions. These constraints have local embedded-Postgres tests; hosted Neon connectivity still needs deployment validation.

This version observes only the configured test channel. It does not award AP, store RP text, associate proxy names with players, or implement quests. Do not enable real awards until ownership, deduplication and persistence are validated.

## Run locally

1. Install Node.js 24.
2. In this folder run `npm ci`.
3. Copy `.env.example` to `.env` and fill in the three settings locally. Never share or commit `.env`.
4. Enable Discord Developer Mode to copy server and channel IDs. The token comes from the application's Bot page.
5. Run `npm start`.
6. Send a normal message, a manually bracketed Tupper message, and an autoproxy message in the test channel. Confirm reports and original-message deletion observations.

The bot never logs message text. Test counts are posted only to the test channel. Test with non-sensitive sample writing.

## Vercel

The Dockerfile's default command runs only a small HTTP endpoint. The daemon command in vercel.json explicitly starts src/bot.js. Keep these entry points separate: otherwise website requests can launch extra Discord clients. Website success does not indicate the Discord daemon is healthy.

The included Dockerfile and vercel.json target a single Vercel Daemon, currently a beta feature. Create a project using this directory as its root. Add DISCORD_TOKEN, DISCORD_GUILD_ID and TEST_CHANNEL_ID as production environment variables in Vercel. Deploy to production. No local .env is copied into the image. Verify daemon availability and quota on your account first. This is not a conventional request-only Vercel Function. No database is needed for this diagnostic stage.

## Next stages

- Verify proxy attribution; never trust a display name or count original and proxy twice. Missing or ambiguous attribution must be held for review, not guessed.
- Add Postgres transactions, unique source-event IDs, daily player totals, word remainder, approval dates and an immutable adjustment ledger.
- Add moderator controls and private progress commands.
- Persist 300 words/AP, combined 4 AP/day, Chicago dates, one repeatable gathering AP/day, and designated expedition milestones.
- Unlock slots at 30 elapsed days + 60 AP + 20 active days, then 60 + 120 + 40. AP is not spent.
- Handle edits, deletions, reconnect gaps and moderator corrections before enabling real awards.

## Ownership diagnostic update

Set TUPPERBOX_BOT_ID to Tupperbox's actual bot user ID. Grant Ledger Manage Webhooks in the test channel so it can read the creator of incoming webhooks. Only creators matching that configured bot ID are trusted for this test. No webhook tokens are logged or persisted.

src/brackets.json registers per-player wrappers. Lyra's L: wrapper is registered for the owner's supplied player ID. Autoproxy is tested by exact unchanged content. Matching requires a unique original in the same channel within 15 seconds, an observed deletion, and a trusted webhook creator. Reports wait 2.5 seconds for events to arrive. Missing or ambiguous evidence is held for review. Only content hashes and identifiers are retained transiently, for at most roughly 150 seconds including cleanup scheduling.

This is correlation evidence, not a signed ownership response from Tupperbox. Do not enable awards based solely on this diagnostic. A busy server, delayed events, split messages, attachments, edits, transformations, missed originals, or restart gaps may require review. Display names are never treated as player identities. Character-specific autoproxy identity is not established by this test.

Known limitations: counting is heuristic and cannot detect copied or padded prose. Ordinary-message diagnostic counts still include manually typed Tupper prefixes; final matched-proxy counts do not. There is no persistent storage, historical backfill, authoritative ownership attestation, or production AP tracking in this prototype.
