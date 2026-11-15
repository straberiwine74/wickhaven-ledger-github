// The Northern Shallows — Thaleryn quest from the Rumor Mill's "Something is Wrong with the Fish".
// Written November 15, 2026. Status 'test': runs only in the staff quest channel until changed to 'live'.
// Clues only: the cause of the pale-marked fish stays an open mystery.

export default {
  id: 'northern-shallows',
  name: 'The Northern Shallows',
  emoji: '🐟',
  status: 'test',
  start: 'harbor-chain',
  completion: {
    milestone: 'shallows-survey',
    ap: 1,
    first: ' First Northern Shallows expedition recorded.',
    repeat: ' Repeat visit recorded. No additional reward.'
  },
  journal: {
    'shallows-chain-recent': 'The chain closing the northern shallows was hung within the last few days.',
    'shallows-clerk-permit': 'The harbor master’s clerk let you through and admitted the closing order came “from above.”',
    'shallows-clerk-refused': 'The harbor master’s clerk refused you; nobody is meant to see the northern shallows.',
    'shallows-rock-path': 'A dry path runs along the harbor rocks around the chain.',
    'shallows-slipped': 'You slipped on the weed-slick harbor rocks.',
    'shallows-pattern-same': 'Every pale-marked fish carries the same mark in the same place.',
    'shallows-not-sickness': 'The pale-marked fish aren’t sick: they eat, swim and spawn normally.',
    'shallows-marked-sample': 'You studied a pale-marked fish up close: the mark is under the scales, not on them.',
    'shallows-fish-swim-north': 'The pale-marked fish all face the same way in the pools, toward the outer shallows.',
    'shallows-cold-water': 'Water far colder than the sea wells up through cracks in the shallows’ floor.',
    'shallows-cold-numbed': 'The welling water numbed your arm like a midwinter river.',
    'shallows-worked-stone': 'Under the silt of the northern shallows lies cut and fitted stone.',
    'shallows-older-than-harbor': 'The stone under the shallows is older than any part of Wickhaven’s harbor.',
    'shallows-downward-lamp': 'A lamp is carved into the drowned stone, its flame pointing down into the earth.',
    'shallows-marks-match': 'The pale fish marks match the carving under the shallows.',
    'shallows-old-chart': 'An old harbor chart marks the northern shallows “No anchor. No nets. Leave be.”',
    'shallows-master-knows': 'The harbor master has seen the drowned stone before and is afraid of it.',
    'shallows-master-silent': 'The harbor master gave you nothing but a warning to stay away.'
  },
  scenes: {
    'harbor-chain': {
      title: '⛓️ The Chain Across the Shallows',
      tone: 'shore',
      text: 'North of the Pier, a rusted chain hangs across the boat channel into the northern shallows. A board nailed to the post reads: CLOSED BY ORDER OF THE HARBOR MASTER. A clerk in an oilskin coat sits in a shed by the post, pretending not to watch you.',
      resumeText: 'You return to the chain across the northern shallows. The clerk is still in the shed.',
      passive: {
        skill: 'perception',
        dc: 12,
        note: 'Passive Perception {value} applied to the chain.',
        success: { text: 'The chain is old, but the padlock and the bright scrape marks on the post are new. This was closed in a hurry, days ago.', facts: ['shallows-chain-recent'] }
      },
      choices: [
        {
          id: 'ask-clerk', label: 'Ask the clerk to let you through', emoji: '🗣️',
          check: { skill: 'persuasion', dc: 13 },
          success: { text: 'The clerk sighs and unhooks the chain. “Orders came down from above. Not from the harbor master, from *above* him. Be back before the tide turns.”', facts: ['shallows-clerk-permit'], goto: 'tide-pools' },
          failure: { text: '“Nobody goes past the chain.” The clerk shuts the shed door. You’ll have to find another way.', facts: ['shallows-clerk-refused'] }
        },
        {
          id: 'rocks', label: 'Climb around the chain along the harbor rocks', emoji: '🪨',
          check: { skill: 'athletics', dc: 12 },
          success: { text: 'You pick your way over the weed-slick rocks and drop onto the tide flats beyond the chain. The rocks make a usable path.', facts: ['shallows-rock-path'], goto: 'tide-pools' },
          failure: { text: 'Your boot skids on the weed and you land hard on the rocks before scrambling down onto the flats.', facts: ['shallows-slipped'], damage: 2, goto: 'tide-pools' }
        },
        {
          id: 'sneak', label: 'Wait for the clerk to look away, then duck under', emoji: '🤫',
          check: { skill: 'stealth', dc: 13 },
          success: { text: 'The clerk turns to light his pipe. You’re under the chain and down on the flats before the match is out.', goto: 'tide-pools' },
          failure: { text: 'The clerk looks up just as you reach the chain. He shouts, but doesn’t leave his shed. You hurry onto the flats with his complaint ringing behind you.', facts: ['shallows-clerk-refused'], goto: 'tide-pools' }
        },
        {
          id: 'retreat', label: 'Return to Wickhaven', emoji: '↩️', style: 'secondary',
          outcome: { text: 'You leave the chain behind. Your expedition remains unfinished.', goto: '@retreat' }
        }
      ]
    },
    'tide-pools': {
      title: '🐟 The Tide Pools',
      tone: 'shore',
      text: 'The tide is out, leaving the northern shallows as a field of pools and silt. Fish crowd the pools: ordinary harbor fish, but more than half carry a pale, clean-edged mark along their sides. They don’t look dying. They look like they’re waiting.',
      resumeText: 'You return to the tide pools. The pale-marked fish are still there.',
      passive: {
        skill: 'nature',
        dc: 13,
        note: 'Passive Nature {value} applied to the pools.',
        success: { text: 'These aren’t sick fish. Sick fish drift and gasp. These swim strongly and eat, and every one carries the mark in exactly the same place.', facts: ['shallows-not-sickness', 'shallows-pattern-same'] }
      },
      choices: [
        {
          id: 'catch-fish', label: 'Catch a marked fish and study it', emoji: '🔎', once: true,
          check: { skill: 'nature', dc: 12 },
          success: { text: 'You hold a marked fish in your cupped hands. The mark isn’t on the scales. It’s beneath them, in the skin itself, and it’s shaped. Not a blotch: a figure, the same on every fish. You let it go.', facts: ['shallows-marked-sample', 'shallows-pattern-same'] },
          failure: { text: 'The fish slips out of your hands before you get a good look. You see the same pale mark on the next three that dart past.', facts: ['shallows-pattern-same'] }
        },
        {
          id: 'watch-pools', label: 'Watch which way the fish face', emoji: '👀', once: true,
          check: { skill: 'perception', dc: 12 },
          success: { text: 'The unmarked fish wander. The marked fish don’t. Every one of them holds still with its head pointed north, toward the outer shallows.', facts: ['shallows-fish-swim-north'] },
          failure: { text: 'The pools glitter and shift. You can’t make sense of the movement.' }
        },
        {
          id: 'go-north', label: 'Wade north toward the outer shallows', emoji: '🌊',
          outcome: { text: 'You wade north across the flats. The water around your ankles grows colder with every step.', goto: 'cold-seep' }
        },
        {
          id: 'retreat', label: 'Return to Wickhaven', emoji: '↩️', style: 'secondary',
          outcome: { text: 'You leave the shallows. Your discoveries are saved, but the expedition is unfinished.', goto: '@retreat' }
        }
      ]
    },
    'cold-seep': {
      title: '❄️ The Cold Seep',
      tone: 'shore',
      text: 'At the far edge of the flats, the silt is cracked in long straight lines. Water wells up through the cracks, clear and painfully cold, far colder than the sea. Marked fish gather in the current around it.',
      resumeText: 'You return to the cold seep at the edge of the flats.',
      passive: {
        skill: 'history',
        dc: 14,
        note: 'Passive History {value} applied to the seep.',
        success: { text: 'Those cracks are too straight. They’re joints: the gaps between cut stones, laid edge to edge under the silt. Whatever this is, it’s older than Wickhaven’s harbor wall.', facts: ['shallows-worked-stone', 'shallows-older-than-harbor'] }
      },
      choices: [
        {
          id: 'clear-silt', label: 'Clear the silt from the stone', emoji: '🧹',
          check: { skill: 'investigation', dc: 13 },
          success: { text: 'You scrape back the silt. Beneath it is a flat, fitted stone, and carved into it is a lamp: an old shape, but turned upside down, its flame pointing down into the earth.', facts: ['shallows-worked-stone', 'shallows-downward-lamp'], goto: 'carving' },
          failure: { text: 'You find fitted stone under the silt, but the incoming water fills your hole as fast as you dig.', facts: ['shallows-worked-stone'], goto: 'carving' }
        },
        {
          id: 'reach-in', label: 'Reach into the crack to feel where the water comes from', emoji: '🫳',
          check: { save: 'con', dc: 12 },
          success: { text: 'The cold bites to the bone, but you hold on long enough to feel the crack widen below into a hollow. Your fingers brush a carved edge before you pull your arm back.', facts: ['shallows-cold-water', 'shallows-worked-stone'], goto: 'carving' },
          failure: { text: 'The cold hits like a hammer. You yank your arm free, numb and aching to the shoulder.', facts: ['shallows-cold-water', 'shallows-cold-numbed'], damage: 2, goto: 'carving' }
        },
        {
          id: 'leave-seep', label: 'Leave it be and head back across the flats', emoji: '↩️',
          outcome: { text: 'Some things are better left under the silt. You turn back toward the harbor.', facts: ['shallows-cold-water'], goto: 'harbor-master' }
        }
      ]
    },
    carving: {
      title: '🪔 The Drowned Stone',
      tone: 'landing',
      text: 'The cold water runs over cut stone, laid by hands long gone. The tide has turned; the pools behind you are already filling.',
      resumeText: 'You return to the drowned stone. The tide is coming in.',
      choices: [
        {
          id: 'compare-marks', label: 'Compare the stone to the marks on the fish', emoji: '🐟',
          requires: { facts: ['shallows-downward-lamp'] },
          check: { skill: 'investigation', dc: 12 },
          success: { text: 'You catch a marked fish in the current and hold it against the stone. The pale figure under its scales is the downturned lamp. The same shape. The same lines.', facts: ['shallows-marks-match'], goto: 'harbor-master' },
          failure: { text: 'The marks look similar, but the fish won’t hold still long enough for you to be sure.', goto: 'harbor-master' }
        },
        {
          id: 'sketch', label: 'Sketch what you can and beat the tide back', emoji: '✍️',
          outcome: { text: 'You make a quick sketch of the stone and wade back toward the harbor ahead of the rising water.', goto: 'harbor-master' }
        }
      ]
    },
    'harbor-master': {
      title: '⚓ The Harbor Master',
      tone: 'landing',
      text: 'The harbor master is waiting by the chain when you return: a broad, weathered man with a lantern he hasn’t lit. He looks at your wet clothes, then at the shallows, then at you. “What did you see out there?”',
      resumeText: 'The harbor master is still waiting by the chain.',
      passive: {
        skill: 'insight',
        dc: 13,
        note: 'Passive Insight {value} applied to the harbor master.',
        success: { text: 'He isn’t angry. He’s frightened, and he’s been frightened for a while.', facts: ['shallows-master-knows'] }
      },
      choices: [
        {
          id: 'press-him', label: 'Tell him what you found and ask what he knows', emoji: '🗣️',
          check: { skill: 'persuasion', dc: 14 },
          success: { text: 'He’s quiet for a long moment. Then he unfolds a chart from his coat, old and brown, his grandfather’s. Over the northern shallows, in faded ink: *No anchor. No nets. Leave be.* “The fish started showing up marked a month ago. I closed it. That’s all I know, and that’s all I want to know.”', facts: ['shallows-old-chart', 'shallows-master-knows'], goto: 'report' },
          failure: { text: '“Fish get sick. Tides shift.” He hangs the chain back across the channel. “Stay off my shallows.”', facts: ['shallows-master-silent'], goto: 'report' }
        },
        {
          id: 'read-him', label: 'Watch his face and say nothing', emoji: '👁️',
          check: { skill: 'insight', dc: 12 },
          success: { text: 'He fills the silence himself. “My grandfather used to say the shallows weren’t ours. Never knew what he meant.” He catches himself and turns away.', facts: ['shallows-master-knows'], goto: 'report' },
          failure: { text: 'He waits you out, then waves you off. “Go home.”', facts: ['shallows-master-silent'], goto: 'report' }
        },
        {
          id: 'walk-past', label: 'Walk past him without answering', emoji: '🚶',
          outcome: { text: 'You leave him at the chain with his unlit lantern.', goto: 'report' }
        }
      ]
    },
    report: {
      title: '📜 Back at the Pier',
      tone: 'landing',
      text: 'You reach the Pier with salt drying on your boots. What’s under the northern shallows, and why the fish carry its mark, deserves a place in the Ledger.',
      resumeText: 'Your notes on the northern shallows are ready to record.',
      choices: [
        {
          id: 'finish', label: 'Record findings and complete the expedition', emoji: '📜', style: 'success',
          outcome: { text: 'You enter your Northern Shallows discoveries in the Ledger. This expedition is complete.', goto: '@complete' }
        },
        {
          id: 'retreat', label: 'Leave the report unfinished', emoji: '↩️', style: 'secondary',
          outcome: { text: 'Your discoveries remain saved, but the expedition is unfinished.', goto: '@retreat' }
        }
      ]
    }
  }
};
