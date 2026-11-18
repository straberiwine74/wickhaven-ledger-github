// The Bell in the Mire — Sam's quest, converted from his gvar.
// Converted November 18, 2026. Status 'test': runs only in the staff quest channel until changed to 'live'.
// Each rolled choice has success/failure results; guaranteed choices use outcome.
// goto names the next scene. Omit goto to remain in the current scene.
// @complete finishes the run; @retreat leaves it unfinished.

export default {
  "id": "bellmire",
  "name": "The Bell in the Mire",
  "emoji": "🔔",
  "status": "test",
  "start": "causeway",
  "completion": {
    "milestone": "bellmire-investigated",
    "ap": 1,
    "first": " First investigation of Bellmire recorded.",
    "repeat": " Repeat visit recorded. No additional reward."
  },
  "journal": {
    "causeway-markers-moved": "Someone has moved the causeway marker posts toward the deep mire.",
    "causeway-safe-line": "The true causeway follows the old willow stumps, not the marker posts.",
    "causeway-soaked": "You strayed off the causeway and sank to the thigh before scrambling clear.",
    "mire-lantern-figure": "A hooded figure with a shuttered lantern crossed from the chapel toward the posts.",
    "chapel-rope-new": "The belfry rope is new hemp, recently tarred.",
    "chapel-alms-note": "A note in the alms box, in a shaky hand: “Don’t follow the bell. Follow the willows.”",
    "chapel-bell-cracked": "The chapel’s great bell is split through. It cannot have rung in years.",
    "chapel-belfry-fall": "A rotten belfry board gave way and dropped you onto the ladder below.",
    "undercroft-lamp-oil": "Fresh lamp oil is spilled on the undercroft steps.",
    "undercroft-handbell": "A brass handbell hangs from a beam in the undercroft, its clapper wrapped in rag for carrying.",
    "undercroft-salvage": "Crates in the undercroft hold carters’ goods: cloth, salt, and a merchant’s seal from Wickhaven.",
    "undercroft-tally": "A chalk tally on the wall counts seven carts.",
    "ringer-frightened": "The ringer was more afraid of whoever pays him than of you.",
    "ringer-sexton": "The ringer is Odo, the old sexton’s grandson. He says men from Wickhaven pay him to ring.",
    "ringer-name-given": "Odo named the man who pays him: a carter called Brannock, who “knows the posts.”",
    "ringer-fled": "The ringer fled into the mist before you could speak with them.",
    "ringer-followed": "You followed the ringer to a punt moored at the mire’s edge, loaded for Wickhaven.",
    "ringer-trail-lost": "The ringer’s lantern went dark among the reeds and you lost the trail."
  },
  "scenes": {
    "causeway": {
      "title": "🌫️ The Causeway",
      "tone": "shore",
      "text": "Mist lies flat across Bellmire. The old causeway runs toward a sunken chapel, marked by a line of tarred posts. Somewhere ahead, a bell rings three times and falls silent. The chapel has no bell that should still ring.",
      "resumeText": "You return to the head of the causeway. The mist has not lifted.",
      "passive": {
        "skill": "perception",
        "dc": 13,
        "note": "Passive Perception {value} applied to the causeway.",
        "success": {
          "text": "The nearest marker posts stand in fresh-turned mud. Someone has moved them recently, and not toward firmer ground.",
          "facts": [
            "causeway-markers-moved"
          ]
        }
      },
      "choices": [
        {
          "id": "read-willows",
          "label": "Read the ground and find the true path",
          "emoji": "🌿",
          "success": {
            "text": "The posts lead left, but the willow stumps run straight. You keep to the stumps and the ground stays firm beneath you all the way to the chapel yard.",
            "facts": [
              "causeway-safe-line"
            ],
            "goto": "chapel-yard"
          },
          "check": {
            "skill": "nature",
            "dc": 13
          },
          "failure": {
            "text": "You trust the posts. Halfway across, the mire takes you to the thigh. You drag yourself clear and reach the chapel yard cold, muddy, and loud.",
            "facts": [
              "causeway-soaked",
              "causeway-markers-moved"
            ],
            "flags": {
              "alert": true
            },
            "goto": "chapel-yard"
          }
        },
        {
          "id": "wait-reeds",
          "label": "Wait in the reeds for the bell to ring again",
          "emoji": "🫥",
          "success": {
            "text": "You crouch in the reeds until the bell sounds again. A hooded figure with a shuttered lantern slips from the chapel, adjusts a marker post, and returns. You follow their footsteps exactly.",
            "facts": [
              "mire-lantern-figure",
              "causeway-safe-line"
            ],
            "goto": "chapel-yard"
          },
          "check": {
            "skill": "stealth",
            "dc": 12
          },
          "failure": {
            "text": "A heron bursts from the reeds beside you. Out in the mist, a lantern shutter snaps closed. You make your way to the chapel slowly, testing every step.",
            "flags": {
              "alert": true
            },
            "goto": "chapel-yard"
          }
        },
        {
          "id": "retreat",
          "label": "Return to town",
          "emoji": "↩️",
          "outcome": {
            "text": "You turn back before the mist thickens. No roll or rest. Your expedition and supplies remain locked.",
            "goto": "@retreat"
          },
          "style": "secondary"
        }
      ]
    },
    "chapel-yard": {
      "title": "⛪ The Sunken Chapel",
      "tone": "landing",
      "text": "The chapel has settled into the mire up to its window sills. A belfry ladder climbs inside the tower. Beside the door, a flight of stone steps descends into the undercroft. An iron alms box is bolted to the porch.",
      "resumeText": "You return to the chapel porch. The bell is quiet for now.",
      "passive": {
        "skill": "investigation",
        "dc": 12,
        "note": "Passive Investigation {value} applied to the chapel.",
        "success": {
          "text": "The bell rope hanging in the tower is new hemp, still sticky with tar. Someone tends this place.",
          "facts": [
            "chapel-rope-new"
          ]
        }
      },
      "choices": [
        {
          "id": "belfry",
          "label": "Climb to the belfry",
          "emoji": "🪜",
          "outcome": {
            "text": "You test the first rung and begin to climb.",
            "goto": "belfry"
          }
        },
        {
          "id": "undercroft",
          "label": "Descend into the undercroft",
          "emoji": "🕯️",
          "outcome": {
            "text": "You take the slick steps down into the dark.",
            "goto": "undercroft"
          }
        },
        {
          "id": "alms",
          "label": "Leave 1 gp in the alms box (spends 1 gp)",
          "emoji": "🪙",
          "outcome": {
            "text": "The coin rattles into the box. The lid, unlocked, lifts slightly, and a folded note slides out from beneath it. In a shaky hand: “Don’t follow the bell. Follow the willows.”\n1 gp spent. It is listed in your supplies receipt.",
            "facts": [
              "chapel-alms-note",
              "causeway-safe-line"
            ]
          },
          "style": "secondary",
          "once": true,
          "requires": {
            "bags": true
          },
          "cost": {
            "coins": {
              "gp": 1
            }
          }
        },
        {
          "id": "finish",
          "label": "Record the moved posts and finish this visit",
          "emoji": "📜",
          "outcome": {
            "text": "You sketch the line of the marker posts and return to Wickhaven. The chapel itself remains unexplored.",
            "goto": "@complete"
          },
          "style": "success"
        },
        {
          "id": "retreat",
          "label": "Retreat unfinished",
          "emoji": "↩️",
          "outcome": {
            "text": "You withdraw across the mire. No roll or rest. Your expedition and supplies remain locked.",
            "goto": "@retreat"
          },
          "style": "secondary"
        }
      ]
    },
    "belfry": {
      "title": "🔔 The Belfry",
      "tone": "landing",
      "text": "The great bell hangs above you, green with age. The new rope does not reach its wheel. Instead it runs down through a hole in the floor, toward the undercroft.",
      "resumeText": "You return to the belfry. The rope still runs down through the floor.",
      "choices": [
        {
          "id": "inspect-bell",
          "label": "Inspect the great bell",
          "emoji": "🔎",
          "success": {
            "text": "You run your hand along the bronze and find a crack wide enough to take a fingertip. This bell has not rung in years. Whatever you heard came from below.",
            "facts": [
              "chapel-bell-cracked"
            ],
            "goto": "undercroft"
          },
          "check": {
            "skill": "investigation",
            "dc": 12
          },
          "failure": {
            "text": "You lean out to reach the bell and a rotten board gives way. You drop onto the ladder, bruised, and decide to follow the rope downward.",
            "facts": [
              "chapel-belfry-fall"
            ],
            "flags": {
              "alert": true
            },
            "goto": "undercroft"
          }
        },
        {
          "id": "slide-rope",
          "label": "Climb down the rope through the floor",
          "emoji": "🧗",
          "success": {
            "text": "You lower yourself hand over hand and land softly on the undercroft floor, beside a brass handbell hanging from a beam. The rope is tied to its handle.",
            "facts": [
              "undercroft-handbell"
            ],
            "goto": "undercroft"
          },
          "check": {
            "skill": "athletics",
            "dc": 13
          },
          "failure": {
            "text": "The tarred rope burns through your grip and you drop the last few feet. Something brass clangs sharply in the dark beside you.",
            "flags": {
              "alert": true
            },
            "goto": "undercroft"
          }
        },
        {
          "id": "leave",
          "label": "Climb back down to the porch",
          "emoji": "↩️",
          "outcome": {
            "text": "You descend the ladder carefully.",
            "goto": "chapel-yard"
          }
        }
      ]
    },
    "undercroft": {
      "title": "🕯️ The Undercroft",
      "tone": "landing",
      "text": "Water stands ankle-deep across the undercroft. Crates are stacked on a raised stone shelf, out of the wet. Mist leaks in through a low arch that opens onto the mire.",
      "resumeText": "You return to the flooded undercroft. The crates remain on their shelf.",
      "passive": {
        "skill": "perception",
        "dc": 13,
        "note": "Passive Perception {value} applied to the undercroft.",
        "success": {
          "text": "Lamp oil glistens on the steps, still fresh. Whoever rings the bell was here within the hour.",
          "facts": [
            "undercroft-lamp-oil"
          ]
        }
      },
      "choices": [
        {
          "id": "search-crates",
          "once": true,
          "label": "Search the crates",
          "emoji": "📦",
          "success": {
            "text": "Bolts of cloth, sacks of salt, and a strongbox stamped with a Wickhaven merchant’s seal. On the wall above, someone has chalked a tally: seven strokes. Seven carts.",
            "facts": [
              "undercroft-salvage",
              "undercroft-tally"
            ]
          },
          "check": {
            "skill": "investigation",
            "dc": 13
          },
          "failure": {
            "text": "The crates are nailed shut and swollen with damp. You learn only that they are heavy, and that someone wanted them kept dry."
          }
        },
        {
          "id": "find-bell",
          "once": true,
          "label": "Look for the source of the ringing",
          "emoji": "🔔",
          "success": {
            "text": "A brass handbell hangs from a low beam, its clapper wrapped in rag for carrying. A cord runs from it up through the ceiling to the belfry.",
            "facts": [
              "undercroft-handbell"
            ]
          },
          "check": {
            "skill": "perception",
            "dc": 12
          },
          "failure": {
            "text": "You wade from corner to corner, but the dark and the water defeat you."
          }
        },
        {
          "id": "wait-ringer",
          "label": "Hide and wait for the ringer to return",
          "emoji": "🫥",
          "outcome": {
            "text": "You settle behind the crates and wait. After a long while, a lantern glow appears beneath the arch.",
            "goto": "ringer"
          }
        },
        {
          "id": "leave",
          "label": "Take what you’ve found and go",
          "emoji": "📜",
          "outcome": {
            "text": "You climb back to the porch and fix your notes before the mist can soak them.",
            "goto": "report"
          }
        }
      ]
    },
    "ringer": {
      "title": "🏮 The Ringer",
      "tone": "shore",
      "text": "A thin youth ducks in under the arch, a shuttered lantern in one hand. He reaches for the handbell, then freezes. He has seen you.",
      "resumeText": "The youth stands frozen beneath the arch, lantern raised.",
      "passive": {
        "skill": "insight",
        "dc": 12,
        "note": "Passive Insight {value} applied to the ringer.",
        "success": {
          "text": "He is not ready to fight. He is ready to run, and more frightened of someone else than of you.",
          "facts": [
            "ringer-frightened"
          ]
        }
      },
      "choices": [
        {
          "id": "talk",
          "label": "Lower your hands and talk to him",
          "emoji": "🗣️",
          "success": {
            "text": "He says his name is Odo, the old sexton’s grandson. Men pay him a silver piece a night to ring when the mist is thick. He did not ask what for. When you mention the carts, he goes pale and gives you a name: Brannock, a carter, “who knows the posts.”",
            "facts": [
              "ringer-sexton",
              "ringer-name-given"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "persuasion",
            "dc": 13
          },
          "failure": {
            "text": "He tells you he is the sexton’s grandson, Odo, and that he rings for the dead. Then he will say nothing more, and he will not meet your eye.",
            "facts": [
              "ringer-sexton"
            ],
            "goto": "report"
          }
        },
        {
          "id": "block",
          "label": "Step in front of the arch and demand answers",
          "emoji": "✋",
          "success": {
            "text": "He backs against the wall. “Brannock pays me! He moves the posts, I ring, that’s all!” He is the sexton’s grandson, Odo, and he is terrified.",
            "facts": [
              "ringer-sexton",
              "ringer-name-given"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "intimidation",
            "dc": 13
          },
          "failure": {
            "text": "He throws the lantern into the water and is through the arch before you can stop him. The handbell is still swinging.",
            "facts": [
              "ringer-fled"
            ],
            "goto": "report"
          }
        },
        {
          "id": "follow",
          "label": "Let him go, then follow",
          "emoji": "👣",
          "success": {
            "text": "You let him bolt, then trail his lantern through the reeds. It leads to a punt at the mire’s edge, already loaded with crates and pointed toward Wickhaven.",
            "facts": [
              "ringer-fled",
              "ringer-followed"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "stealth",
            "dc": 14
          },
          "failure": {
            "text": "His lantern winks out among the reeds. You stand in the mist, listening, and hear nothing but water.",
            "facts": [
              "ringer-fled",
              "ringer-trail-lost"
            ],
            "goto": "report"
          }
        }
      ]
    },
    "report": {
      "title": "📜 Out of the Mire",
      "tone": "shore",
      "text": "You reach firm ground as the mist begins to thin. Behind you, Bellmire is silent. It is time to take what you know back to Wickhaven.",
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
