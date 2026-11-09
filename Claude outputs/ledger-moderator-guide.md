<!-- Wickhaven Ledger — Moderator Guide. Each "POST" section is under Discord's 2,000-character limit. Paste one post at a time. -->

<!-- ===== POST 1 of 9 ===== -->
# 📒 THE WICKHAVEN LEDGER — MODERATOR GUIDE
*How the bot works, what "working" looks like, and how to help players when it doesn't.*
━━━━━━━━━━━━━━━━━━━━━━
### 🗺️ WHERE THINGS HAPPEN
• **#📝│character-submission**: players run `/ledger-character submit`, `respec`, `retire`. Each review gets a **private thread** here.
• **#🧭│solo-expeditions**: players run `!depart <quest>`.
• **#📝│ap-log** *(staff)*: AP awards, held messages, retirement notices.
• **#😍│quest-feedback**: players run `/quest` inside a quest's post.
• **#🧐│quest-feedback-users** *(staff)*: who left which review.
• **#📣│announcements**: birthday shout-outs, just after midnight Central.
• **#🤖│staff-bot-stuff** *(staff)*: safe place to test.

### 🛡️ STAFF ACCESS
• Staff buttons and commands work for **Admins** and the **Moderator** role.
• You need **Manage Threads** in #character-submission to see everyone's review threads.
• If a staff slash command is missing for you, an admin grants it in **Server Settings → Integrations → The Ledger**.

### ✅ GOLDEN RULES
• Almost every bot reply is **private** ("Only you can see this"). Ask players for a **screenshot** of the reply.
• The bot **never** edits D&D Beyond sheets or Avrae. Players apply XP, coins and items themselves.
• If the bot says something failed, it **saved nothing** unless the message says otherwise.

<!-- ===== POST 2 of 9 ===== -->
# 🧙 CHARACTER SUBMISSIONS — WHAT SHOULD HAPPEN
━━━━━━━━━━━━━━━━━━━━━━
**1. Player runs** `/ledger-character submit` in #character-submission with **name, sheet** (D&D Beyond link), **stats** (link to their roll in #birth-of-a-hero) and **set** (1, 2 or 3).
✅ They get a private "📥 Submitted" reply with a link to their review thread.

**2. The bot opens a private thread** named **"Name · Pending"**, adds the player, and pings **@Moderator**.
✅ Only that player and staff can see it. The card shows the sheet, stat link, chosen set and the staff checklist.

**3. Staff review** using the checklist on the card:
• Level 3, 2024 rules; legacy only where no 2024 option exists; official WotC only
• Sheet belongs to the player; chosen stat set matches their reaction and the sheet
• **Starting equipment, not gold**
• **One Uncommon magic item**

**4. Staff decide**: see Post 3.

### 🔢 CHARACTER SLOTS
Players start with **2**. The 3rd needs **30 days since first approval + 60 AP + 20 active days**. The 4th needs **60 days + 120 AP + 40 active days**. All three are required. Retiring frees a slot. If **Approve** says *"No available character slot"*, that's correct: the player is full.

<!-- ===== POST 3 of 9 ===== -->
# ⚖️ APPROVING & REQUESTING CHANGES
━━━━━━━━━━━━━━━━━━━━━━
### ✅ APPROVE (button in the thread)
Type a note, then type **APPROVE** to confirm.
**Should happen:**
• Thread renames to **"Name · Approved"**, card says Approved
• Player gets **Adventurer**, loses **Applicant** (only if they had it)
• Thread message: *"✅ Approved! @player now has the Adventurer role. The realm is open to you."*
⚠️ If you see *"Approved, but the Ledger couldn't change roles"*, the approval **still counts**. Swap the roles by hand and tell an admin (the Ledger needs **Manage Roles**, and its role must sit above Adventurer/Applicant).

### ✏️ REQUEST CHANGES (button)
Type what needs fixing.
**Should happen:**
• Thread renames to **"Name · Changes requested"**
• Player gets a **DM** with your note
• The **Resubmit Changes** button turns on for the player
You can also use Request Changes on an **already approved** character to reopen it. That frees their slot until re-approved.

### 🔁 RESUBMIT (player)
Player clicks **Resubmit Changes** or runs `/ledger-character resubmit name:`. The thread goes back to **Pending** and staff are pinged again.
If they changed links or stat set, they run `/ledger-character submit` again with the **same name** instead.

### 🛠️ STAFF SLASH COMMANDS (backups to the buttons)
• `/ledger-review player: name:`: private view of a submission + DM delivery status
• `/ledger-approve player: name: verified:True note:`
• `/ledger-reject player: name: reason:`
Players clicking Approve/Request Changes get *"Only administrators and configured Moderators…"*. That's correct.

<!-- ===== POST 4 of 9 ===== -->
# 🔄 RESPECS & 🕯️ RETIREMENTS
━━━━━━━━━━━━━━━━━━━━━━
### 🔄 RESPEC: `/ledger-character respec name: changes:`
Only for **approved** characters. One open request per character.
**Should happen:**
• Private thread **"Name · Respec · Pending"**, player added, **@Moderator** pinged
• Running the command again while it's open **updates** the same request and re-pings staff (no duplicates)
**Staff buttons:**
• **Approve** (note optional): thread becomes **"Respec · Approved"**, player is pinged to update D&D Beyond and run `!update`
• **Request Changes** (note required): thread becomes **"Changes requested"**, player is pinged with your note
• Player **Resubmit Changes** sends it back to Pending
The bot doesn't change the sheet. The player does, after approval.

### 🕯️ RETIRE: `/ledger-character retire name: fate: confirm:True`
• **Retired**: only after **14 days** since approval. Too early → the bot says how many days are left. That's correct.
• **Deceased**: any time (death in play).
• `confirm` must be **True**, or nothing happens.
**Should happen:** slot frees immediately, the name can't be resubmitted, and a notice posts in **#ap-log** with player, fate, days played and their note.
**Staff to-do:** change the character's directory tag from **Active** to **Retired**/**Deceased**.
Bringing a retired character back is a staff decision. Ask an admin.

<!-- ===== POST 5 of 9 ===== -->
# 📊 AP — HOW PLAYERS EARN IT
━━━━━━━━━━━━━━━━━━━━━━
**Only players with an approved character earn AP. Max 4 AP per day. Resets at midnight Central.**
• ✍️ **Writing**: 1 AP per **300 words** of Tupperbox posts in in-character channels. Words carry over between posts. Words written after hitting the cap are lost.
• 🧭 **Solo quest milestones**: 1 AP per milestone, once per character. At the cap it's **held** and paid on their next day.
• ⛏️🏹 **Gathering**: `!mine` or `!hunt end`, confirmed by Avrae, gives **1 AP per day total** (not one each).
**Not counted:** OOC/staff/help channels, posts from their own account (not Tupper), quotes (`>`), commands, code blocks, links.

### 🔍 `/ledger-ap` (player): should show
Today **x / 4 AP** · Total AP · Active days · Words toward next AP **x / 300** · Held quest AP (if any).

### 📝 WHAT #ap-log SHOWS
• **✍️ Writing saved**: a post that earned AP (+AP, today's total, words toward next)
• **🏹/⛏️ Gathering**: +1 AP, or "already used today"
• **🔎 No AP: no approved character**: they wrote but have no approved character. Correct behavior.
• **🔎 Message held for review**: see Post 6
• **🌅 Character retired / 🪦 Character deceased**: retirement notice
Small posts that don't complete an AP won't show a card. Their words still count in `/ledger-ap`.

<!-- ===== POST 6 of 9 ===== -->
# 🔎 HELD MESSAGES, TUPPERS & AP FIXES
━━━━━━━━━━━━━━━━━━━━━━
The Ledger matches each Tupper post to the player who sent it. If it can't be sure, it **holds** the post instead of guessing. **Held = 0 AP until staff fix it.**
**Reasons you'll see:**
• **ambiguous**: two players' Tuppers posted at almost the same moment
• **original-missing / deletion-missing**: Tupperbox didn't clean up the player's original message the normal way
• **already-matched**: that original was already credited (no double credit)
• Webhook/permission text: the Ledger can't verify Tupperbox in that channel. Tell an admin (it needs **Manage Webhooks** there).

### 🏷️ TUPPER BRACKETS (players)
• `/ledger-tupper register name: prefix: suffix:` must match their Tupperbox brackets exactly (e.g. `L:` or `[` … `]`). Needs an approved character.
• `/ledger-tupper list` · `/ledger-tupper remove name:`
Registering doesn't change Tupperbox or approve anything. It just helps matching.

### ⚖️ FIXING AP (staff)
• `/ledger-adjust player: change: reason: day:` adds or removes **−4 to +4** AP. `day` is optional (`YYYY-MM-DD`, defaults to today). The reason is saved with your name.
• `/ledger-audit player:` shows their recent adjustments.
Use adjust for held posts that were legit, mistakes, or abuse. Always write a clear reason.

<!-- ===== POST 7 of 9 ===== -->
# 🧭 SOLO EXPEDITIONS (`!depart`)
━━━━━━━━━━━━━━━━━━━━━━
**Player runs** `!depart <quest>` in **#🧭│solo-expeditions** (e.g. `!depart drowned-watch`). `/ledger-quests` lists quests and codes. Locked quests say how to unlock them.
**Should happen:**
1. Avrae posts a **Solo Expedition** embed (their sheet export)
2. The Ledger replies with a **Departure Review**: HP, passive Perception, coins, skills, carried bags
3. Player clicks **Confirm loadout** (or **Discard departure**), then plays through with buttons
4. At the end: **✅ Expedition Complete** or **🩸 Carried Home**, plus AP for new milestones

**Bags:** carries **Pack, Belt, Potions, Scrolls** by default. To choose: `!cvar ledger_carried_bags ["Pack","Belt"]` (names must match `!bag` exactly).

**After an expedition that changed HP, coins or items:** the bot lists the changes. The player updates Avrae, then runs `!depart reconcile <run id>`. **New expeditions stay locked until this matches.** That's on purpose.

**Common "⛔ Departure stopped" messages (all correct):**
• needs an approved character · *Recover HP* (0 HP) · *Reconcile the previous expedition* · *Unfinished expedition elsewhere* (finish that one first) · *This quest isn't open yet*

`/ledger-journal` shows a character's visits and discoveries. Staff can add `player:` to read anyone's.
Buttons belong to the player who departed. Others get *"couldn't be confirmed."*

<!-- ===== POST 8 of 9 ===== -->
# ⭐ QUEST FEEDBACK & 🎂 BIRTHDAYS
━━━━━━━━━━━━━━━━━━━━━━
### ⭐ `/quest stars:` (players)
Must be run **inside a quest's post** in #😍│quest-feedback. Anywhere else → "use this inside a quest post." Correct.
**Should happen:**
• A form opens for feedback (10–1,000 characters)
• An **anonymous** review posts in the quest post: stars, **DM:** name (from the post's "DM:" line), feedback
• The post's ⭐ tag updates to the **rounded average** (other tags stay)
• Full review **with the player's name** logs in #🧐│quest-feedback-users
• Running it again **replaces** their review (no duplicates)
For the DM name to show, the quest post needs a line like `DM: Sam`.

### 🎂 `/birthday` (players)
• `/birthday set month: day:` (month + day only, no year) · `/birthday view` · `/birthday remove`
**Should happen:** just after **midnight Central** on their birthday, one shout-out posts in #📣│announcements (everyone that day in one message), and they get the **Birthday** role, removed the next night.
Feb 29 birthdays are celebrated Feb 28 in non-leap years. A shout-out never posts twice. If posting fails, it retries every 5 minutes.
You won't be pinged by your own birthday post. That's Discord, not the bot.

<!-- ===== POST 9 of 9 ===== -->
# 🧰 QUICK TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━
**"I submitted but nothing happened."** Ask for a screenshot of their private reply. "Saved, but the review couldn't be confirmed…" = it's queued and retries every minute. Tell an admin the reason shown.
**"I can't see my review thread."** Only the submitter and staff can. Check they're on the right account. Staff can open the thread and @mention them to add them.
**"I can't type in my thread."** They're missing **Send Messages in Threads** in #character-submission for their role. Tell an admin.
**"Approved, but I didn't get Adventurer."** Look for the ⚠️ note in the thread. Swap roles by hand and tell an admin.
**"I wrote a lot but got no AP."** Check `/ledger-ap` (cap reached? words carry over?). Approved character? Posted with Tupper in an in-character channel? Look in #ap-log for a held message.
**"My !depart does nothing."** Right channel? The Avrae embed must be titled *Chronicles of Thaleryn Solo Expedition* (the server alias), not a personal alias.
**"I can't start a new expedition."** Usually needs `!depart reconcile <run id>`, or they have an unfinished one.
**Slash command missing?** Have them press **Ctrl+R**. Commands can take a minute to refresh after updates.
**Anything else:** note what they ran, the time, and the exact message, then post in #🤖│staff-bot-stuff or ping @Kettle.
