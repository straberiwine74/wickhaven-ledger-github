// Lights Past the Eastern Road — Thaleryn quest from Mara Vey's Rumor Mill post "Strange Lights on the Old Road".
// Written November 15, 2026. Status 'test': runs only in the staff quest channel until changed to 'live'.
// Clues only: what the blue lights are stays an open mystery.

export default {
  id: 'eastern-lights',
  name: 'Lights Past the Eastern Road',
  emoji: '🔵',
  status: 'test',
  start: 'last-lantern',
  completion: {
    milestone: 'eastern-lights-watch',
    ap: 1,
    first: ' First Eastern Road expedition recorded.',
    repeat: ' Repeat visit recorded. No additional reward.'
  },
  journal: {
    'lights-lantern-cut': 'The last Lamplighter lantern on the eastern road was put out on purpose; its wick was cut.',
    'lights-mara-account': 'Mara Vey says the lights move in a line, slowly, “like people walking,” and always head east.',
    'lights-mara-scared': 'Mara Vey was too shaken to say much more than her Rumor Mill post did.',
    'lights-seen': 'You saw the blue lights yourself, moving between the trees past the eastern road.',
    'lights-no-heat': 'The blue lights give no heat; frost forms where they pass.',
    'lights-not-spell': 'The blue lights aren’t a spell you recognize, and they aren’t will-o’-wisps.',
    'lights-vanished': 'The lights went out the moment you called to them.',
    'lights-lost-time': 'Following the lights, you lost track of where you were, and of an hour.',
    'lights-frost-trail': 'The lights leave a trail of frost on the grass, even on a mild night.',
    'lights-no-tracks': 'Whatever carries the blue lights leaves no footprints.',
    'lights-hollow-found': 'The lights gather each night at a grassy hollow east of the road.',
    'lights-blue-glass': 'You found a shard of old blue glass in the hollow, cold as ice and very old.',
    'lights-glass-lamp': 'The blue glass shard is part of a lamp chimney, made in a style nobody in Wickhaven uses.',
    'lights-hollow-stone': 'A flat cut stone lies under the turf of the hollow.',
    'lights-lantern-relit': 'You relit the cut Lamplighter lantern on the eastern road.',
    'lights-lantern-left': 'You left the eastern road’s last lantern dark.'
  },
  scenes: {
    'last-lantern': {
      title: '🏮 The Last Lantern',
      tone: 'shore',
      text: 'Past the city’s eastern gate, the road runs between dark fields toward the trees. The Lamplighters keep a lantern on a post at the last bend before the woods, but tonight it’s dark. Mara Vey is waiting beside it, wrapped in a shawl, and she looks relieved to see you.',
      resumeText: 'You return to the dark lantern at the last bend of the eastern road.',
      passive: {
        skill: 'perception',
        dc: 12,
        note: 'Passive Perception {value} applied to the lantern.',
        success: { text: 'The lantern isn’t out of oil. Its wick has been cut clean through, close to the burner.', facts: ['lights-lantern-cut'] }
      },
      choices: [
        {
          id: 'ask-mara', label: 'Ask Mara exactly what she saw', emoji: '🗣️', once: true,
          check: { skill: 'persuasion', dc: 11 },
          success: { text: '“They come after midnight. Six or seven of them, in a line, slow. Like people walking. They always go east, deeper into the trees.” She swallows. “And they don’t flicker. Fire flickers.”', facts: ['lights-mara-account'] },
          failure: { text: 'Mara only shakes her head. “It’s all in my post. I just want someone else to see them.”', facts: ['lights-mara-scared'] }
        },
        {
          id: 'hide-wait', label: 'Hide by the road and wait for midnight', emoji: '🤫',
          check: { skill: 'stealth', dc: 12 },
          success: { text: 'You settle into the ditch, still and quiet. Near midnight, blue lights appear between the trees: seven of them, moving in a slow line.', facts: ['lights-seen'], goto: 'tree-line' },
          failure: { text: 'You shift and rustle through the long wait. Near midnight, the lights appear, but they’re farther off than Mara described, as if keeping their distance.', facts: ['lights-seen'], goto: 'tree-line' }
        },
        {
          id: 'into-trees', label: 'Go straight into the trees to meet them', emoji: '🌲',
          outcome: { text: 'You leave Mara at the lantern and walk into the dark. An hour later, blue lights move between the trunks ahead of you.', facts: ['lights-seen'], goto: 'tree-line' }
        },
        {
          id: 'retreat', label: 'Return to Wickhaven', emoji: '↩️', style: 'secondary',
          outcome: { text: 'You walk Mara home instead. Your expedition remains unfinished.', goto: '@retreat' }
        }
      ]
    },
    'tree-line': {
      title: '🔵 Lights in the Trees',
      tone: 'landing',
      text: 'The lights drift between the trunks, pale blue and perfectly steady. They make no sound. The night is mild, but your breath fogs as they pass.',
      resumeText: 'You return to the trees past the eastern road. The lights are moving again.',
      passive: {
        skill: 'arcana',
        dc: 13,
        note: 'Passive Arcana {value} applied to the lights.',
        success: { text: 'This is no spell you know, and these aren’t will-o’-wisps. Wisps hunt. These are going somewhere.', facts: ['lights-not-spell'] }
      },
      choices: [
        {
          id: 'follow', label: 'Follow the lights at a distance', emoji: '👣',
          check: { skill: 'stealth', dc: 13 },
          success: { text: 'You keep to the shadows and follow them east. They lead you to a grassy hollow in the woods and stop there, hanging in a ring.', facts: ['lights-hollow-found'], goto: 'hollow' },
          failure: { text: 'A branch cracks under your boot. The lights stop. When they move again, you follow, but the woods twist around you.', goto: 'lost' }
        },
        {
          id: 'study', label: 'Get close enough to study one', emoji: '🔎',
          check: { skill: 'arcana', dc: 13 },
          success: { text: 'One light passes an arm’s length from you. It gives no heat at all, and frost spreads across the leaves beneath it. It isn’t burning. It’s just *there*.', facts: ['lights-no-heat', 'lights-frost-trail'], goto: 'hollow' },
          failure: { text: 'You step closer and the cold hits your face like a winter wind. You flinch back, and the lights move on without you.', facts: ['lights-no-heat'], goto: 'lost' }
        },
        {
          id: 'call-out', label: 'Call out to them', emoji: '📣',
          outcome: { text: 'Your voice carries through the trees. Every light goes out at once. In the dark, you find a line of frost on the grass where they were, leading east.', facts: ['lights-vanished', 'lights-frost-trail'], goto: 'hollow' }
        }
      ]
    },
    lost: {
      title: '🌫️ Turned Around',
      tone: 'shore',
      text: 'The trees all look the same. The lights are gone. You can’t see the road, and you aren’t sure how long you’ve been walking.',
      resumeText: 'You’re still turned around in the woods east of the road.',
      choices: [
        {
          id: 'find-way', label: 'Find your bearings from the stars', emoji: '✨',
          check: { skill: 'survival', dc: 12 },
          success: { text: 'You find the north star through a gap in the branches and work out where you are. The lights went east. So do you.', facts: ['lights-lost-time'], goto: 'hollow' },
          failure: { text: 'You blunder through brambles for what feels like hours before you stumble into a clearing.', facts: ['lights-lost-time'], damage: 2, goto: 'hollow' }
        },
        {
          id: 'clear-head', label: 'Stop, breathe, and clear your head', emoji: '🧘',
          check: { save: 'wis', dc: 12 },
          success: { text: 'The panic fades. You were never lost, only pulled along. You turn east on purpose this time and find a hollow in the trees.', goto: 'hollow' },
          failure: { text: 'When you come back to yourself, the moon has moved a long way across the sky. You’re standing at the edge of a grassy hollow.', facts: ['lights-lost-time'], goto: 'hollow' }
        }
      ]
    },
    hollow: {
      title: '🌑 The Hollow',
      tone: 'landing',
      text: 'A round, grassy hollow sits in the woods, too even to be natural. The grass at its center is white with frost. Whatever the lights were, they’re gone now.',
      resumeText: 'You return to the frost-covered hollow in the woods.',
      passive: {
        skill: 'investigation',
        dc: 13,
        note: 'Passive Investigation {value} applied to the hollow.',
        success: { text: 'There are no footprints anywhere: not in the frost, not in the soft ground at the edge. Nothing walked here.', facts: ['lights-no-tracks'] }
      },
      choices: [
        {
          id: 'search-frost', label: 'Search the frost at the center', emoji: '🔎', once: true,
          check: { skill: 'investigation', dc: 12 },
          success: { text: 'Under the frost, your fingers close on something sharp: a curved shard of blue glass, so cold it aches to hold. Beneath it, the turf is thin over a flat cut stone.', facts: ['lights-blue-glass', 'lights-hollow-stone'] },
          failure: { text: 'You find a shard of blue glass in the grass, painfully cold, before the frost numbs your fingers and you have to stop.', facts: ['lights-blue-glass'] }
        },
        {
          id: 'study-glass', label: 'Study the blue glass', emoji: '🔷',
          requires: { facts: ['lights-blue-glass'] }, once: true,
          check: { skill: 'history', dc: 13 },
          success: { text: 'It’s part of a lamp chimney, the glass tube that sits around a flame. The curve and the color are like nothing made in Wickhaven, and the edges are worn smooth with age.', facts: ['lights-glass-lamp'] },
          failure: { text: 'It might be from a bottle, or a window. You can’t tell, only that it’s very old.' }
        },
        {
          id: 'head-back', label: 'Head back to the road', emoji: '🛤️',
          outcome: { text: 'You leave the hollow and make your way west, back toward the dark lantern.', goto: 'relight' }
        }
      ]
    },
    relight: {
      title: '🔥 The Dark Lantern',
      tone: 'shore',
      text: 'Dawn is close when you reach the road. Mara has gone home. The Lamplighters’ lantern still hangs dark on its post, its wick cut short.',
      resumeText: 'You return to the dark lantern on the eastern road.',
      choices: [
        {
          id: 'relight', label: 'Trim the wick and relight the lantern', emoji: '🔥',
          check: { skill: 'religion', dc: 11 },
          success: { text: 'You remember the Lamplighters’ words, “One flame in the dark,” and trim what’s left of the wick. It catches on the first try and burns steady.', facts: ['lights-lantern-relit'], goto: 'report' },
          failure: { text: 'The stub of wick won’t take. You leave the lantern dark and make a note for the Lamplighters at the Hall of the First Flame.', facts: ['lights-lantern-left'], goto: 'report' }
        },
        {
          id: 'leave-dark', label: 'Leave it for the Lamplighters', emoji: '🚶',
          outcome: { text: 'This is the Lamplighters’ work. You’ll tell them at the Hall.', facts: ['lights-lantern-left'], goto: 'report' }
        }
      ]
    },
    report: {
      title: '📜 Back Through the Eastern Gate',
      tone: 'landing',
      text: 'You walk back through the eastern gate as the city wakes. Mara Vey asked for someone else to see the lights. Now someone has.',
      resumeText: 'Your notes on the eastern lights are ready to record.',
      choices: [
        {
          id: 'finish', label: 'Record findings and complete the expedition', emoji: '📜', style: 'success',
          outcome: { text: 'You enter your Eastern Road discoveries in the Ledger. This expedition is complete.', goto: '@complete' }
        },
        {
          id: 'retreat', label: 'Leave the report unfinished', emoji: '↩️', style: 'secondary',
          outcome: { text: 'Your discoveries remain saved, but the expedition is unfinished.', goto: '@retreat' }
        }
      ]
    }
  }
};
