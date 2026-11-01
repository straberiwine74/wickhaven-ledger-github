// Run once from the extracted repository: node install-quest-module.cjs
// Only adds three integration hooks. Existing unrelated bot code is preserved.
const fs=require('node:fs');
const file='src/bot.js';
let text=fs.readFileSync(file,'utf8');
if(text.includes("import { installQuests } from './quest-discord.js';")) {
  console.log('Quest import already exists. Review existing integration; no files changed.');process.exit(0);
}
const patches=[
  ["import { CharacterNotifications } from './character-notifications.js';", "import { CharacterNotifications } from './character-notifications.js';\nimport { installQuests } from './quest-discord.js';"],
  ["if(ledger&&process.env.CHARACTERS_CHANNEL_ID&&process.env.MODERATOR_ROLE_IDS){", `if (process.env.QUEST_TEST_ENABLED === 'true') {
  if (!pool || !/^\\d{17,20}$/.test(process.env.AVRAE_BOT_ID??'') || !/^\\d{17,20}$/.test(process.env.QUEST_TEST_CHANNEL_ID??'')) {
    console.error('Quest test requires saved AP test mode, AVRAE_BOT_ID and QUEST_TEST_CHANNEL_ID.'); process.exit(1);
  }
  await installQuests(client,pool,{guild:DISCORD_GUILD_ID,channel:process.env.QUEST_TEST_CHANNEL_ID,avrae:process.env.AVRAE_BOT_ID});
}
if(ledger&&process.env.CHARACTERS_CHANNEL_ID&&process.env.MODERATOR_ROLE_IDS){`],
  ["client.on(Events.InteractionCreate, async interaction => {", "client.on(Events.InteractionCreate, async interaction => {\n  if(interaction.customId?.startsWith('quest:')) return;"]
];
for(const [anchor] of patches) if(text.split(anchor).length!==2) {
  console.error('This bot version differs from the inspected baseline. No bot files changed. Share the current src/bot.js for adaptation; do not share .env.');process.exit(1);
}
for(const [anchor,replacement] of patches) text=text.replace(anchor,replacement);
fs.writeFileSync(file,text);
console.log('Added quest hooks to src/bot.js. Dockerfile and vercel.json were not changed.');
