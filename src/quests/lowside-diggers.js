// The Diggers Beneath Lowside — Thaleryn quest about who dug the tunnel to the Hollow Sanctum.
// Written November 15, 2026. Status 'hidden': held until THE RUINS has been played, then revised to match it.
// Stays in the tunnel and stops at the Sanctum's threshold so it can't contradict THE RUINS.

export default {
  id: 'lowside-diggers',
  name: 'The Diggers Beneath Lowside',
  emoji: '⛏️',
  status: 'hidden',
  start: 'collapsed-wall',
  completion: {
    milestone: 'lowside-tunnel-survey',
    ap: 1,
    first: ' First expedition beneath Lowside recorded.',
    repeat: ' Repeat visit recorded. No additional reward.'
  },
  journal: {
    'diggers-wall-pushed': 'The Lowside wall didn’t collapse on its own; it was knocked in from the inside.',
    'diggers-locals-saw-carts': 'Lowside locals saw handcarts of dirt leaving the alley at night.',
    'diggers-locals-silent': 'Nobody in Lowside will talk about the hole in the wall.',
    'diggers-fresh-picks': 'The tunnel was dug with picks within the last few months.',
    'diggers-skilled-work': 'Whoever dug the tunnel knew mining: it’s braced and drained properly.',
    'diggers-tunnel-fall': 'Loose earth fell on you in the tunnel.',
    'diggers-snuffed-lamps': 'The diggers left their lamps behind with the wicks cut.',
    'diggers-quarry-tools': 'The diggers’ abandoned tools carry Quarry tally marks.',
    'diggers-cart-tracks': 'Cart tracks from the tunnel lead back toward Lowside’s business district.',
    'diggers-cold-draft': 'A cold draft blows up the tunnel from the Hollow Sanctum.',
    'diggers-threshold-seen': 'The tunnel ends at a carved threshold: the edge of the Hollow Sanctum.',
    'diggers-heard-digging': 'Beyond the threshold, you heard someone still digging.',
    'diggers-turned-back': 'You turned back at the Hollow Sanctum’s threshold.'
  },
  scenes: {
    'collapsed-wall': {
      title: '🧱 The Collapsed Wall',
      tone: 'shore',
      text: 'In a narrow Lowside alley, a section of old wall has fallen in, leaving a hole just wide enough to crawl through. Beyond it, a tunnel slopes down into the dark. Someone has hung a scrap of canvas over the hole, as if that would keep anyone out.',
      resumeText: 'You return to the hole in the Lowside wall.',
      passive: {
        skill: 'investigation',
        dc: 13,
        note: 'Passive Investigation {value} applied to the wall.',
        success: { text: 'The rubble lies in the alley, not in the tunnel. This wall didn’t collapse. It was knocked out from the inside.', facts: ['diggers-wall-pushed'] }
      },
      choices: [
        {
          id: 'ask-locals', label: 'Ask the locals what they’ve seen', emoji: '🗣️', once: true,
          check: { skill: 'persuasion', dc: 13 },
          success: { text: 'An old woman on a doorstep finally talks. “Carts. Handcarts full of dirt, late at night, for weeks. Quiet folk. Paid well for nobody noticing.”', facts: ['diggers-locals-saw-carts'] },
          failure: { text: 'Doors close as you walk up. In Lowside, nobody saw anything.', facts: ['diggers-locals-silent'] }
        },
        {
          id: 'crawl-in', label: 'Crawl through into the tunnel', emoji: '🕳️',
          outcome: { text: 'You push past the canvas and crawl into the tunnel. The air is cool and smells of turned earth.', goto: 'tunnel' }
        },
        {
          id: 'retreat', label: 'Return to Wickhaven’s streets', emoji: '↩️', style: 'secondary',
          outcome: { text: 'You leave the alley. Your expedition remains unfinished.', goto: '@retreat' }
        }
      ]
    },
    tunnel: {
      title: '⛏️ The Tunnel',
      tone: 'landing',
      text: 'The tunnel slopes steadily down, braced with timber every few yards. The walls are scarred with pick marks. Water trickles along a channel cut in the floor.',
      resumeText: 'You return to the braced tunnel beneath Lowside.',
      passive: {
        skill: 'perception',
        dc: 12,
        note: 'Passive Perception {value} applied to the tunnel.',
        success: { text: 'The pick marks are sharp-edged, not worn. This was dug in the last few months.', facts: ['diggers-fresh-picks'] }
      },
      choices: [
        {
          id: 'judge-work', label: 'Judge how the tunnel was dug', emoji: '🔎', once: true,
          check: { skill: 'investigation', dc: 12 },
          success: { text: 'The bracing is sound, the drainage channel slopes properly, and the cuts are even. This wasn’t dug by desperate amateurs. These were miners.', facts: ['diggers-skilled-work', 'diggers-fresh-picks'] },
          failure: { text: 'It’s a tunnel. It holds. That’s as much as you can tell.' }
        },
        {
          id: 'press-on', label: 'Follow the tunnel down', emoji: '⬇️',
          check: { skill: 'athletics', dc: 12 },
          success: { text: 'You squeeze past a narrow stretch where the bracing sags and reach a wider chamber.', goto: 'abandoned-camp' },
          failure: { text: 'A brace shifts as you pass, and a shower of loose earth and stone comes down on your shoulders.', facts: ['diggers-tunnel-fall'], damage: 2, goto: 'abandoned-camp' }
        }
      ]
    },
    'abandoned-camp': {
      title: '🏚️ The Diggers’ Camp',
      tone: 'landing',
      text: 'The tunnel widens into a rough chamber. Someone worked from here: a broken barrow, a heap of spoil, a pile of picks and shovels, and a row of small lamps on a shelf of rock. None of the lamps are lit.',
      resumeText: 'You return to the abandoned diggers’ camp.',
      choices: [
        {
          id: 'check-lamps', label: 'Look at the lamps', emoji: '🪔', once: true,
          check: { skill: 'perception', dc: 12 },
          success: { text: 'Every lamp still has oil. Every wick has been cut short, deliberately, right at the burner. They put out their lights on purpose and left them here.', facts: ['diggers-snuffed-lamps'] },
          failure: { text: 'Cheap tin lamps. Nothing remarkable that you can see.' }
        },
        {
          id: 'check-tools', label: 'Search the tools', emoji: '🛠️', once: true,
          check: { skill: 'investigation', dc: 13 },
          success: { text: 'Scratched into each pick handle is a tally mark you’ve seen before: the marks Quarry crews use to count out tools at the start of a shift.', facts: ['diggers-quarry-tools'] },
          failure: { text: 'Worn tools, well used. You can’t tell where they came from.' }
        },
        {
          id: 'follow-tracks', label: 'Follow the barrow tracks back', emoji: '👣', once: true,
          check: { skill: 'survival', dc: 13 },
          success: { text: 'The barrow ruts lead back up the tunnel and out the alley. Faint wheel marks continue through Lowside toward the business district before you lose them on the cobbles.', facts: ['diggers-cart-tracks'] },
          failure: { text: 'Too many feet have crossed the ruts. You can’t follow them.' }
        },
        {
          id: 'go-deeper', label: 'Go deeper', emoji: '⬇️',
          outcome: { text: 'Past the camp, the tunnel narrows again and runs on, colder with every step.', goto: 'threshold' }
        }
      ]
    },
    threshold: {
      title: '🕳️ The Threshold',
      tone: 'shore',
      text: 'The rough tunnel ends against carved stone: a threshold, old and smooth, framed by worn pillars. Beyond it lies the dark of the Hollow Sanctum. A cold draft blows up from below, steady as breath.',
      resumeText: 'You return to the threshold of the Hollow Sanctum.',
      passive: {
        skill: 'perception',
        dc: 14,
        note: 'Passive Perception {value} applied to the dark.',
        success: { text: 'Far below, faint and regular, you hear the sound of a pick striking stone. Someone is still digging.', facts: ['diggers-heard-digging'] }
      },
      choices: [
        {
          id: 'listen', label: 'Hold your breath and listen', emoji: '👂',
          check: { skill: 'perception', dc: 13 },
          success: { text: 'There. Below you, somewhere in the Sanctum, a pick strikes stone, pauses, strikes again.', facts: ['diggers-heard-digging', 'diggers-threshold-seen', 'diggers-cold-draft'], goto: 'report' },
          failure: { text: 'Only the draft, and your own heartbeat. You don’t go farther.', facts: ['diggers-threshold-seen', 'diggers-cold-draft'], goto: 'report' }
        },
        {
          id: 'turn-back', label: 'Turn back before you cross', emoji: '↩️',
          outcome: { text: 'You don’t cross the threshold. Not alone. You climb back toward Lowside.', facts: ['diggers-threshold-seen', 'diggers-turned-back'], goto: 'report' }
        }
      ]
    },
    report: {
      title: '📜 Back in Lowside',
      tone: 'landing',
      text: 'You crawl back out into the alley, earth on your clothes and cold in your bones. Someone dug their way to the Hollow Sanctum, and the Ledger should know what you found.',
      resumeText: 'Your notes from beneath Lowside are ready to record.',
      choices: [
        {
          id: 'finish', label: 'Record findings and complete the expedition', emoji: '📜', style: 'success',
          outcome: { text: 'You enter your discoveries from beneath Lowside in the Ledger. This expedition is complete.', goto: '@complete' }
        },
        {
          id: 'retreat', label: 'Leave the report unfinished', emoji: '↩️', style: 'secondary',
          outcome: { text: 'Your discoveries remain saved, but the expedition is unfinished.', goto: '@retreat' }
        }
      ]
    }
  }
};
