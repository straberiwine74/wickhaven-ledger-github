// The Road That Shouldn't Be There — Thaleryn quest from the Wayfarers' example contract.
// Written November 15, 2026. Status 'test': runs only in the staff quest channel until changed to 'live'.
// Its mile-marker discovery (road-elaris-marker) unlocks The Ash-Sealed Ledger for the whole server.
// Clues only: where the road comes from stays an open mystery.

export default {
  id: 'impossible-road',
  name: 'The Road That Shouldn’t Be There',
  emoji: '🛤️',
  status: 'test',
  start: 'last-farm',
  completion: {
    milestone: 'impossible-road-survey',
    ap: 1,
    first: ' First expedition to the impossible road recorded.',
    repeat: ' Repeat visit recorded. No additional reward.'
  },
  journal: {
    'road-farmer-account': 'The last farmer northwest of Wickhaven swears the road through the woods appeared three weeks ago.',
    'road-farmer-fearful': 'The farmer won’t talk about the road and has stopped letting his animals near the woods.',
    'road-farmer-lying': 'The farmer is hiding something about the road, but he isn’t lying about when it appeared.',
    'road-entrance-found': 'The impossible road begins at the edge of the woods with no path leading to it.',
    'road-no-wear': 'The road’s paving is old in style but shows no wear, no moss and no roots.',
    'road-ancient-masonry': 'The road is laid like the oldest foundations under Wickhaven.',
    'road-forest-beneath': 'Under the paving stones lies undisturbed forest floor: the road was laid all at once.',
    'road-not-illusion': 'The road is real stone, not an illusion.',
    'road-silent-woods': 'No birds or insects make any sound near the road.',
    'road-lost-hours': 'Walking the road, you lost hours you can’t account for.',
    'road-mile-marker': 'A moss-free mile-marker stands beside the road, carved in an old script.',
    'road-elaris-marker': 'The mile-marker on the impossible road names “Elaris.”',
    'road-points-back': 'The marker’s arrow for Elaris points back the way you came, toward Wickhaven.',
    'road-marker-rubbing': 'You made a rubbing of the mile-marker’s inscription.',
    'road-fog-wall': 'Farther north, the road runs into a fog bank that doesn’t move with the wind.',
    'road-fog-chill': 'Pushing into the fog left you chilled and exhausted.',
    'road-turned-back': 'You turned back at the edge of the fog.'
  },
  scenes: {
    'last-farm': {
      title: '🏡 The Last Farm',
      tone: 'shore',
      text: 'Northwest of Wickhaven, past the last marked settlement, a single farm sits at the edge of thick woods. The farmer is mending a fence and watching the trees. When he sees you, he doesn’t ask why you’ve come. He just points.',
      resumeText: 'You return to the last farm at the edge of the woods.',
      passive: {
        skill: 'insight',
        dc: 13,
        note: 'Passive Insight {value} applied to the farmer.',
        success: { text: 'He’s hiding something, but he’s not lying about when the road appeared. That part frightens him too much to be a lie.', facts: ['road-farmer-lying'] }
      },
      choices: [
        {
          id: 'ask-farmer', label: 'Ask the farmer about the road', emoji: '🗣️', once: true,
          check: { skill: 'persuasion', dc: 12 },
          success: { text: '“Three weeks back. I walked those woods every autumn for thirty years, cutting wood. One morning there’s a road. Paved. Straight as a rule.” He spits. “Nobody built it. Nobody *could* have.”', facts: ['road-farmer-account'] },
          failure: { text: '“Go see for yourself.” He turns back to his fence. You notice his cows are penned well away from the trees.', facts: ['road-farmer-fearful'] }
        },
        {
          id: 'find-road', label: 'Search the woods for where the road begins', emoji: '🧭',
          check: { skill: 'survival', dc: 12 },
          success: { text: 'A quarter-mile into the trees, the undergrowth simply stops at a line of fitted paving stones. There’s no path leading to it. The road just begins.', facts: ['road-entrance-found'], goto: 'road-edge' },
          failure: { text: 'You wander the woods for an hour before you stumble onto the paving almost by accident.', goto: 'road-edge' }
        },
        {
          id: 'retreat', label: 'Return to Wickhaven', emoji: '↩️', style: 'secondary',
          outcome: { text: 'You leave the farm. Your expedition remains unfinished.', goto: '@retreat' }
        }
      ]
    },
    'road-edge': {
      title: '🛤️ The Road',
      tone: 'landing',
      text: 'The road runs north between the trees, straight and wide enough for two carts. The paving is pale and fitted tight. The woods press close on both sides, but not a single root has broken the stones, and not a leaf lies on them.',
      resumeText: 'You return to the impossible road.',
      passive: {
        skill: 'history',
        dc: 13,
        note: 'Passive History {value} applied to the paving.',
        success: { text: 'You’ve seen stonework like this once: in the oldest foundations under Wickhaven, the ones nobody living remembers laying.', facts: ['road-ancient-masonry'] }
      },
      choices: [
        {
          id: 'lift-stone', label: 'Pry up a paving stone', emoji: '🪨', once: true,
          check: { skill: 'athletics', dc: 13 },
          success: { text: 'The stone comes up with a grind. Beneath it is not a roadbed, but forest floor: leaf litter, moss and a beetle that scurries from the light. The road was set down on top of the woods, all at once.', facts: ['road-forest-beneath', 'road-no-wear'] },
          failure: { text: 'The stones are fitted too tightly to shift. Up close, though, you see they’re old in style, yet show no wear at all.', facts: ['road-no-wear'] }
        },
        {
          id: 'test-magic', label: 'Test whether the road is an illusion', emoji: '✨', once: true,
          check: { skill: 'arcana', dc: 13 },
          success: { text: 'You press your palm to the stone, then your senses. No illusion clings to it. The road is real stone, as solid as the city walls.', facts: ['road-not-illusion'] },
          failure: { text: 'Your senses slide off the road. You can’t tell what it is, only that it feels heavy and quiet.' }
        },
        {
          id: 'walk-north', label: 'Walk north along the road', emoji: '🚶',
          outcome: { text: 'You set off north along the paving. Behind you, the sounds of the woods fall away.', goto: 'walking' }
        }
      ]
    },
    walking: {
      title: '🌲 The Silent Woods',
      tone: 'shore',
      text: 'There are no birds here. No insects. Only your footsteps on the stone, and the trees standing very still on either side. The road runs on, straight and empty.',
      resumeText: 'You return to the silent stretch of the road.',
      passive: {
        skill: 'perception',
        dc: 12,
        note: 'Passive Perception {value} applied to the woods.',
        success: { text: 'The silence isn’t calm. The animals have all left, and the woods feel like a held breath.', facts: ['road-silent-woods'] }
      },
      choices: [
        {
          id: 'keep-pace', label: 'Keep a steady pace and count your steps', emoji: '🔢',
          check: { save: 'wis', dc: 13 },
          success: { text: 'You hold onto the count. Two miles in, a stone post stands beside the road.', goto: 'mile-marker' },
          failure: { text: 'You lose the count somewhere. When you look up, the light has changed. Hours have passed that you don’t remember walking. A stone post stands beside the road.', facts: ['road-lost-hours'], goto: 'mile-marker' }
        },
        {
          id: 'watch-sun', label: 'Track the sun through the branches', emoji: '☀️',
          check: { skill: 'survival', dc: 13 },
          success: { text: 'The sun moves as it should, until it doesn’t. You notice the moment the shadows lurch forward by hours. You hold your course, and soon a stone post comes into view.', facts: ['road-lost-hours'], goto: 'mile-marker' },
          failure: { text: 'You can’t find the sun through the canopy. You walk on until a stone post stands beside the road.', goto: 'mile-marker' }
        }
      ]
    },
    'mile-marker': {
      title: '🪧 The Mile-Marker',
      tone: 'landing',
      text: 'A waist-high stone post stands at the roadside, clean and pale like the paving. Carved into its face, in an old script, is a name and a number, with an arrow cut beneath them.',
      resumeText: 'You return to the mile-marker beside the road.',
      choices: [
        {
          id: 'read-marker', label: 'Read the inscription', emoji: '👀',
          check: { skill: 'history', dc: 14 },
          success: { text: 'The letters are old, but you can read them: **ELARIS — 4**. And the arrow beneath doesn’t point north. It points back the way you came, toward Wickhaven.', facts: ['road-mile-marker', 'road-elaris-marker', 'road-points-back'] },
          failure: { text: 'The script is too old for you to read with certainty. You make out the first letters, E-L-A, and a number: four.', facts: ['road-mile-marker'] }
        },
        {
          id: 'rubbing', label: 'Make a rubbing of the inscription', emoji: '✍️', once: true,
          outcome: { text: 'You press paper to the stone and rub it with charcoal. The name comes up clear and black on the page: **ELARIS**. Whatever else you learn out here, you can show the city this.', facts: ['road-mile-marker', 'road-marker-rubbing', 'road-elaris-marker'] }
        },
        {
          id: 'go-on', label: 'Follow the road farther north', emoji: '🌫️',
          outcome: { text: 'You leave the marker behind and keep walking north.', goto: 'fog' }
        },
        {
          id: 'turn-home', label: 'Turn back toward Wickhaven', emoji: '↩️',
          outcome: { text: 'You’ve seen enough. You turn back along the road toward the farm.', goto: 'report' }
        }
      ]
    },
    fog: {
      title: '🌫️ The Fog',
      tone: 'shore',
      text: 'A mile past the marker, the road runs into a wall of grey fog. The wind is blowing, but the fog doesn’t move. The paving disappears into it, straight as ever.',
      resumeText: 'You return to the wall of fog across the road.',
      passive: {
        skill: 'perception',
        dc: 14,
        note: 'Passive Perception {value} applied to the fog.',
        success: { text: 'The fog’s edge doesn’t drift. It holds a straight line across the road, as if it were built there too.', facts: ['road-fog-wall'] }
      },
      choices: [
        {
          id: 'push-in', label: 'Push into the fog', emoji: '💨',
          check: { save: 'con', dc: 13 },
          success: { text: 'You walk into the fog. It’s cold and wet and absolutely silent. After a hundred steps you can’t see your own hands, and you turn back while you still know which way is back.', facts: ['road-fog-wall'], goto: 'report' },
          failure: { text: 'The cold soaks straight through you. You stagger back out, shaking and exhausted.', facts: ['road-fog-wall', 'road-fog-chill'], damage: 2, goto: 'report' }
        },
        {
          id: 'turn-back', label: 'Turn back at the edge', emoji: '↩️',
          outcome: { text: 'Some roads aren’t meant to be walked to the end. Not yet. You turn back toward the farm.', facts: ['road-turned-back'], goto: 'report' }
        }
      ]
    },
    report: {
      title: '📜 The Road Report',
      tone: 'landing',
      text: 'You reach the last farm and then the city. You walked a road nobody built. Wherever it leads, the Ledger should know about it.',
      resumeText: 'Your notes on the impossible road are ready to record.',
      choices: [
        {
          id: 'finish', label: 'Record findings and complete the expedition', emoji: '📜', style: 'success',
          outcome: { text: 'You enter your discoveries from the impossible road in the Ledger. This expedition is complete.', goto: '@complete' }
        },
        {
          id: 'retreat', label: 'Leave the report unfinished', emoji: '↩️', style: 'secondary',
          outcome: { text: 'Your discoveries remain saved, but the expedition is unfinished.', goto: '@retreat' }
        }
      ]
    }
  }
};
