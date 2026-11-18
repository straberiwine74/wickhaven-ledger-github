// The Recut Giant — Sam's quest, converted from his gvar.
// Converted November 18, 2026. Status 'test': runs only in the staff quest channel until changed to 'live'.
// Each rolled choice has success/failure results; guaranteed choices use outcome.
// goto names the next scene. Omit goto to remain in the current scene.
// @complete finishes the run; @retreat leaves it unfinished.

export default {
  "id": "chalk-giant",
  "name": "The Recut Giant",
  "emoji": "⛰️",
  "status": "test",
  "start": "hillside",
  "completion": {
    "milestone": "chalk-giant-investigated",
    "ap": 1,
    "first": " First investigation of the Giant recorded.",
    "repeat": " Repeat visit recorded. No additional reward."
  },
  "journal": {
    "giant-fresh-spoil": "Fresh chalk spoil has been tipped down the slope below the Giant’s head.",
    "giant-shepherd-account": "The shepherd Mags saw three lanterns on the Giant two nights ago and kept her flock away.",
    "giant-shepherd-wary": "The shepherd would say only that “the Giant’s looking somewhere new.”",
    "giant-eye-recut": "The Giant’s eye has been recut overnight so it now looks east, not out to sea.",
    "giant-eye-sightline": "Sighting along the new eye leads straight to a grassed-over barrow on the next ridge.",
    "giant-old-eye-visible": "The old eye is still faintly visible beneath fresh turf: whoever recut it knew the old line.",
    "barrow-opened": "The barrow’s entrance stones have been dug out and propped with new timber.",
    "barrow-tools": "Picks and a surveyor’s chain lie inside the barrow entrance, cleaned and oiled.",
    "barrow-collapse": "A section of the barrow passage collapsed behind you as you entered.",
    "barrow-empty-niche": "A stone niche in the burial chamber has been emptied. Its dust shows the outline of a long box.",
    "barrow-carvings": "Carvings in the chamber show a giant figure holding a lantern toward the sea.",
    "barrow-map-fragment": "You found a torn map scrap marking three barrows; two are crossed out.",
    "camp-found": "A cold camp below the ridge held bedrolls for three and a cart track toward the coast road.",
    "camp-ledger": "A diggers’ ledger records a fee “paid on delivery to the Watch.”",
    "camp-spotted": "Someone at the diggers’ camp saw you and rode away down the coast road."
  },
  "scenes": {
    "hillside": {
      "title": "⛰️ The Hillside",
      "tone": "shore",
      "text": "The chalk Giant stretches across the downs above the village, three hundred feet from head to heel. For as long as anyone remembers, its eye has looked out to sea. This morning, the shepherds say, it is looking somewhere else.",
      "resumeText": "You return to the foot of the hill. Sheep graze well clear of the Giant.",
      "passive": {
        "skill": "perception",
        "dc": 12,
        "note": "Passive Perception {value} applied to the hillside.",
        "success": {
          "text": "Below the Giant’s head, fresh white chalk spills down the turf. It has not yet been greyed by rain.",
          "facts": [
            "giant-fresh-spoil"
          ]
        }
      },
      "choices": [
        {
          "id": "shepherd",
          "label": "Ask the shepherd what she saw",
          "emoji": "🐑",
          "success": {
            "text": "Mags spits, then tells you: three lanterns on the Giant two nights ago, and the sound of picks till dawn. She kept her flock away and her mouth shut. She points you to the head.",
            "facts": [
              "giant-shepherd-account"
            ],
            "goto": "the-eye"
          },
          "check": {
            "skill": "persuasion",
            "dc": 12
          },
          "failure": {
            "text": "Mags eyes you, then the hill. “Giant’s looking somewhere new,” she says, and turns back to her sheep.",
            "facts": [
              "giant-shepherd-wary"
            ],
            "goto": "the-eye"
          }
        },
        {
          "id": "climb",
          "label": "Climb straight up to the Giant’s head",
          "emoji": "🧗",
          "success": {
            "text": "You take the steep line directly up the turf and reach the head breathing hard. The view from here takes in the whole coast.",
            "goto": "the-eye"
          },
          "check": {
            "skill": "athletics",
            "dc": 12
          },
          "failure": {
            "text": "The turf is wet and you slide twice, sending loose chalk skittering downhill. You reach the head muddy, and visible for a mile.",
            "flags": {
              "alert": true
            },
            "goto": "the-eye"
          }
        },
        {
          "id": "retreat",
          "label": "Return to town",
          "emoji": "↩️",
          "outcome": {
            "text": "You leave the downs before climbing. No roll or rest. Your expedition and supplies remain locked.",
            "goto": "@retreat"
          },
          "style": "secondary"
        }
      ]
    },
    "the-eye": {
      "title": "👁️ The Giant’s Eye",
      "tone": "landing",
      "text": "The eye is a ring of trench as wide as a cottage, cut through turf into bright chalk. The cut is new. The old eye, you think, was further to the left.",
      "resumeText": "You return to the Giant’s freshly cut eye.",
      "passive": {
        "skill": "investigation",
        "dc": 13,
        "note": "Passive Investigation {value} applied to the eye.",
        "success": {
          "text": "Beneath a patch of re-laid turf you can trace the old eye’s outline. Whoever did this knew exactly where the old line ran, and covered it carefully.",
          "facts": [
            "giant-old-eye-visible"
          ]
        }
      },
      "choices": [
        {
          "id": "sightline",
          "label": "Sight along the Giant’s new gaze",
          "emoji": "🧭",
          "success": {
            "text": "You lie in the trench and look where the Giant looks. The line runs east, across the valley, and lands squarely on a low barrow on the next ridge.",
            "facts": [
              "giant-eye-recut",
              "giant-eye-sightline"
            ],
            "goto": "barrow"
          },
          "check": {
            "skill": "survival",
            "dc": 13
          },
          "failure": {
            "text": "The eye has been turned east, that much is plain. But the land beyond is all ridges and hollows, and you have to walk them one by one until you find a barrow with its stones disturbed.",
            "facts": [
              "giant-eye-recut"
            ],
            "goto": "barrow"
          }
        },
        {
          "id": "lore",
          "once": true,
          "label": "Recall what you know of the Giant",
          "emoji": "📚",
          "success": {
            "text": "Old songs say the Giant watched for ships and that its keepers lit fires in the eye to guide them home. Turning the eye inland would have been a crime once. Someone wanted a marker that no one would dare question.",
            "facts": [
              "giant-eye-recut"
            ]
          },
          "check": {
            "skill": "history",
            "dc": 12
          },
          "failure": {
            "text": "You remember the Giant is old, and that it faces the sea. Little else comes to mind."
          }
        },
        {
          "id": "finish",
          "label": "Record the recut eye and finish this visit",
          "emoji": "📜",
          "outcome": {
            "text": "You sketch the new eye beside the old and return to Wickhaven. Where the Giant now looks remains unexplored.",
            "goto": "@complete"
          },
          "style": "success"
        }
      ]
    },
    "barrow": {
      "title": "🪨 The Barrow",
      "tone": "landing",
      "text": "The barrow is a long green mound. At its eastern end, the entrance stones have been dug clear and the passage propped with raw new timber. Cold air breathes out of the dark.",
      "resumeText": "You return to the opened barrow. The new timbers creak in the wind.",
      "passive": {
        "skill": "perception",
        "dc": 13,
        "note": "Passive Perception {value} applied to the barrow.",
        "success": {
          "text": "Inside the entrance, out of the rain, lie two picks and a surveyor’s chain, cleaned and oiled. These are not grave-robbers’ tools; they belong to someone who measures land for a living.",
          "facts": [
            "barrow-opened",
            "barrow-tools"
          ]
        }
      },
      "choices": [
        {
          "id": "enter",
          "label": "Enter the barrow passage",
          "emoji": "🕯️",
          "success": {
            "text": "You duck beneath the lintel and move carefully down the passage, testing each prop before you pass it. The air grows still.",
            "facts": [
              "barrow-opened"
            ],
            "goto": "chamber"
          },
          "check": {
            "skill": "acrobatics",
            "dc": 12
          },
          "failure": {
            "text": "Your shoulder catches a prop. Behind you, chalk and earth thunder down, filling the passage to waist height. You will have to dig your way out later.",
            "facts": [
              "barrow-opened",
              "barrow-collapse"
            ],
            "goto": "chamber"
          }
        },
        {
          "id": "track",
          "label": "Follow the diggers’ tracks away from the barrow",
          "emoji": "👣",
          "success": {
            "text": "Cart ruts and boot prints lead down off the ridge into a sheltered combe, where a camp has been left in a hurry.",
            "goto": "camp"
          },
          "check": {
            "skill": "survival",
            "dc": 13
          },
          "failure": {
            "text": "The tracks cross a sheep-walk and vanish among a thousand hoofprints. After an hour you find the camp by its smell of old woodsmoke, but you are not the only one approaching it.",
            "flags": {
              "alert": true
            },
            "goto": "camp"
          }
        }
      ]
    },
    "chamber": {
      "title": "⚱️ The Burial Chamber",
      "tone": "landing",
      "text": "The chamber is small and dry. Bones lie undisturbed on stone benches, but a deep niche in the far wall has been emptied. The walls are covered in faint carvings.",
      "resumeText": "You return to the still air of the burial chamber.",
      "choices": [
        {
          "id": "niche",
          "once": true,
          "label": "Examine the empty niche",
          "emoji": "🔎",
          "success": {
            "text": "The dust in the niche holds the clear outline of a long box, perhaps four feet long. Wedged at the back is a torn scrap of map showing three barrows. Two are crossed out. This is the third.",
            "facts": [
              "barrow-empty-niche",
              "barrow-map-fragment"
            ]
          },
          "check": {
            "skill": "investigation",
            "dc": 13
          },
          "failure": {
            "text": "Whatever was here has been taken. Your lamp shows dust, and the marks of hands.",
            "facts": [
              "barrow-empty-niche"
            ]
          }
        },
        {
          "id": "carvings",
          "once": true,
          "label": "Study the carvings",
          "emoji": "🗿",
          "success": {
            "text": "The carvings are worn but clear enough: a giant figure, holding a lantern out toward a sea full of ships. Beneath it, a long box is being carried into a mound.",
            "facts": [
              "barrow-carvings"
            ]
          },
          "check": {
            "skill": "religion",
            "dc": 13
          },
          "failure": {
            "text": "You make out figures and waves, but the meaning is lost to you."
          }
        },
        {
          "id": "leave",
          "label": "Leave the barrow and take your findings home",
          "emoji": "📜",
          "outcome": {
            "text": "You work your way back to daylight and sit on the mound to write up your notes.",
            "goto": "report"
          }
        }
      ]
    },
    "camp": {
      "title": "🔥 The Diggers’ Camp",
      "tone": "shore",
      "text": "Three bedrolls lie around a cold fire pit in the combe. Cart ruts lead away toward the coast road. A canvas satchel hangs from a thorn bush, forgotten.",
      "resumeText": "You return to the abandoned camp in the combe.",
      "choices": [
        {
          "id": "satchel",
          "label": "Quietly search the satchel",
          "emoji": "🎒",
          "success": {
            "text": "Inside is a diggers’ ledger. Most of it is wages and lamp oil. The last line reads: “Third barrow. Fee paid on delivery to the Watch.”",
            "facts": [
              "camp-found",
              "camp-ledger"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "sleightOfHand",
            "dc": 12
          },
          "failure": {
            "text": "As you lift the satchel, a horse whinnies further down the combe. A rider bolts for the coast road, glancing back once. The satchel is empty except for crumbs.",
            "facts": [
              "camp-found",
              "camp-spotted"
            ],
            "goto": "report"
          }
        },
        {
          "id": "watch-camp",
          "label": "Hide and watch to see if anyone returns",
          "emoji": "🫥",
          "success": {
            "text": "Near dusk a rider comes back for the satchel. You let them go, then check the bush. They missed a single page: “Fee paid on delivery to the Watch.”",
            "facts": [
              "camp-found",
              "camp-ledger"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "stealth",
            "dc": 13
          },
          "failure": {
            "text": "The rider comes back near dusk, sees you among the gorse, and wheels away down the coast road at a gallop.",
            "facts": [
              "camp-found",
              "camp-spotted"
            ],
            "goto": "report"
          }
        }
      ]
    },
    "report": {
      "title": "📜 Under the Giant’s Gaze",
      "tone": "shore",
      "text": "The light is going over the downs. Behind you, the Giant looks east at an empty barrow. It is time to bring your findings back to Wickhaven.",
      "resumeText": "Your findings are ready to be recorded.",
      "choices": [
        {
          "id": "finish",
          "label": "Record findings and complete the expedition",
          "emoji": "📜",
          "outcome": {
            "text": "You return to Wickhaven and enter your discoveries in the Ledger. This expedition is complete.",
            "goto": "@complete"
          },
          "style": "success"
        },
        {
          "id": "retreat",
          "label": "Leave the expedition unfinished",
          "emoji": "↩️",
          "outcome": {
            "text": "You withdraw to Wickhaven. Your discoveries remain recorded, but the expedition is unfinished.",
            "goto": "@retreat"
          },
          "style": "secondary"
        }
      ]
    }
  }
};
