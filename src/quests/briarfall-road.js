// Briarfall Road — built from Wickhaven-Ledger-Quest-Compendium.md (exact engine fields), November 2, 2026.
// Status 'test': runs only in the staff quest channel until changed to 'live'.

export default {
  "id": "briarfall-road",
  "name": "Briarfall Road",
  "emoji": "🪧",
  "status": "live",
  "start": "north-road",
  "completion": {
    "milestone": "briarfall-reconnaissance",
    "ap": 1,
    "first": " First Briarfall Road expedition recorded (journal only; no AP or gold).",
    "repeat": " Repeat visit recorded. No additional reward."
  },
  "journal": {
      "briarfall-tide-warning": "The tide can cover the whole north road approach.",
      "briarfall-tide-cutoff": "The flooded road closed behind you on the way in.",
      "briarfall-high-route": "A usable route runs along the embankment, above the flood.",
      "briarfall-embankment-fall": "The embankment crumbles in places; you slid into the shallows.",
      "briarfall-return-expected": "The waystation travelers packed for a short absence and expected to return.",
      "briarfall-harrowmere-tag": "A luggage tag reads “Harrowmere.” A note asks, “Keep our beds until we return.”",
      "briarfall-packed-belongings": "The packs were left behind on purpose, but their papers were unreadable.",
      "briarfall-travelers-went-north": "The travelers left together through the north door, taking walking sticks and leaving their packs.",
      "briarfall-tracks-obscured": "Flood mud has erased the travelers’ tracks.",
      "briarfall-weak-beam": "The surviving bridge beam is split; the upstream supports are firmer.",
      "briarfall-harrowmere-discovered": "A road sign beyond the bridge reads “HARROWMERE — 6 MILES.”",
      "briarfall-bridge-injury": "You were hurt falling at the washed-out bridge.",
      "briarfall-lantern-emblem": "The Harrowmere sign carries a carved lantern.",
      "briarfall-unmapped-settlement": "Harrowmere does not appear on any current Wickhaven road map.",
      "briarfall-sign-recorded": "You copied the sign: Harrowmere’s name, its distance, and the lantern emblem.",
      "briarfall-sign-recovered": "You brought the Harrowmere sign plank back to Wickhaven.",
      "briarfall-sign-fragment": "You kept a fragment of the sign bearing the name “Harrowmere.”",
      "briarfall-established-road": "Old wheel ruts show the road to Harrowmere was regularly traveled.",
      "briarfall-safe-ebb": "Waiting out the high water at the waystation leaves a safe road home.",
      "briarfall-delayed-return": "Deep water forced you to wait at the waystation before returning."
  },
  "scenes": {
    "north-road": {
      "title": "🌾 The North Road",
      "tone": "shore",
      "text": "The old north road disappears beneath shallow water. Beyond the flooded stretch stands a stone waystation. A broken embankment offers a higher approach, though several sections have slipped into the marsh.",
      "resumeText": "You return to the flooded north road. The waystation stands beyond the water.",
      "passive": {
        "skill": "perception",
        "dc": 12,
        "note": "Passive Perception {value} applied to the road.",
        "success": {
          "text": "Fresh weed hangs above the present waterline. The tide can cover this entire approach.",
          "facts": [
            "briarfall-tide-warning"
          ]
        }
      },
      "choices": [
        {
          "id": "read-tide",
          "label": "Time your crossing along the road",
          "emoji": "🌊",
          "success": {
            "text": "You follow the exposed paving between the deeper channels and reach the waystation before the water rises.",
            "goto": "waystation"
          },
          "check": {
            "skill": "survival",
            "dc": 12
          },
          "failure": {
            "text": "The channels fill faster than expected. You reach the waystation, but the road disappears behind you.",
            "facts": [
              "briarfall-tide-cutoff"
            ],
            "goto": "waystation"
          }
        },
        {
          "id": "embankment",
          "label": "Climb along the higher embankment",
          "emoji": "🧗",
          "success": {
            "text": "You climb over the fallen sections and reach the rear of the waystation. You mark a usable route above the flood.",
            "facts": [
              "briarfall-high-route"
            ],
            "goto": "waystation"
          },
          "check": {
            "skill": "athletics",
            "dc": 13
          },
          "failure": {
            "text": "The bank crumbles beneath your foot. You slide into the muddy shallows and finish the approach along the road as the tide closes behind you.",
            "facts": [
              "briarfall-embankment-fall"
            ],
            "goto": "waystation"
          }
        },
        {
          "id": "retreat",
          "label": "Return to Wickhaven",
          "emoji": "↩️",
          "outcome": {
            "text": "You turn back before entering the flooded road. Your expedition remains unfinished.",
            "goto": "@retreat"
          },
          "style": "secondary"
        }
      ]
    },
    "waystation": {
      "title": "🎒 The Waystation",
      "tone": "landing",
      "text": "Travelers’ packs stand beside cold beds. Boots have been tucked beneath a bench, and a kettle waits beside the hearth. Through the rear doorway, the road continues toward a washed-out bridge.",
      "resumeText": "You return to the abandoned waystation. Nobody has come back for the belongings.",
      "passive": {
        "skill": "investigation",
        "dc": 12,
        "note": "Passive Investigation {value} applied to the waystation.",
        "success": {
          "text": "The packs contain supplies for a short absence. Their owners expected to return.",
          "facts": [
            "briarfall-return-expected"
          ]
        }
      },
      "choices": [
        {
          "id": "search-packs",
          "label": "Examine the travelers’ belongings",
          "emoji": "🔎",
          "success": {
            "text": "You find food for two days and a luggage tag marked “Harrowmere.” A folded note says, “Keep our beds until we return.”",
            "facts": [
              "briarfall-harrowmere-tag",
              "briarfall-return-expected"
            ]
          },
          "check": {
            "skill": "investigation",
            "dc": 12
          },
          "failure": {
            "text": "Damp papers cling together and tear when separated. The packs were deliberately left behind, but you recover no readable destination.",
            "facts": [
              "briarfall-packed-belongings"
            ]
          },
          "once": true
        },
        {
          "id": "read-tracks",
          "label": "Look for signs of where the travelers went",
          "emoji": "👣",
          "success": {
            "text": "Old wear marks lead from the beds to the north doorway. Several travelers left together, taking walking sticks but leaving their heavy packs.",
            "facts": [
              "briarfall-travelers-went-north"
            ]
          },
          "check": {
            "skill": "survival",
            "dc": 13
          },
          "failure": {
            "text": "Floodwater has carried mud through every doorway. You cannot separate the travelers’ traces from later animal tracks.",
            "facts": [
              "briarfall-tracks-obscured"
            ]
          },
          "once": true
        },
        {
          "id": "bridge",
          "label": "Follow the road to the bridge",
          "emoji": "🌉",
          "outcome": {
            "text": "You follow the surviving paving toward the broken crossing.",
            "goto": "bridge"
          }
        },
        {
          "id": "return",
          "label": "Begin the return journey",
          "emoji": "↩️",
          "outcome": {
            "text": "You leave the belongings where you found them and head toward the flooded approach.",
            "goto": "return-route"
          }
        }
      ]
    },
    "bridge": {
      "title": "🌉 The Washed-Out Bridge",
      "tone": "shore",
      "text": "Most of the bridge lies in the channel. One beam still reaches the far bank. Beyond it, reeds and branches partly hide an old road sign.",
      "resumeText": "You return to the near bank of the washed-out bridge.",
      "passive": {
        "skill": "perception",
        "dc": 13,
        "note": "Passive Perception {value} applied to the bridge.",
        "success": {
          "text": "A dark split runs through the beam. The upstream supports offer firmer handholds.",
          "facts": [
            "briarfall-weak-beam"
          ]
        }
      },
      "choices": [
        {
          "id": "read-sign",
          "label": "Read the sign without crossing",
          "emoji": "👀",
          "success": {
            "text": "Through a gap in the branches, you read: “HARROWMERE — 6 MILES.” You copy the name before leaving the crossing.",
            "facts": [
              "briarfall-harrowmere-discovered"
            ],
            "goto": "return-route"
          },
          "check": {
            "skill": "perception",
            "dc": 14
          },
          "failure": {
            "text": "You can distinguish a settlement name, but branches hide its middle letters.",
            "goto": "near-bank"
          }
        },
        {
          "id": "balance",
          "label": "Balance across the surviving beam",
          "emoji": "⚖️",
          "success": {
            "text": "You cross the beam and step onto the far bank beside the sign.",
            "goto": "road-sign"
          },
          "check": {
            "skill": "acrobatics",
            "dc": 14
          },
          "failure": {
            "text": "The beam twists beneath you. You catch a broken crosspiece and hang above the channel.",
            "goto": "bridge-slip"
          }
        },
        {
          "id": "climb-supports",
          "label": "Climb along the bridge supports",
          "emoji": "💪",
          "success": {
            "text": "You work along the upstream supports and climb onto the far bank.",
            "goto": "road-sign"
          },
          "check": {
            "skill": "athletics",
            "dc": 14
          },
          "failure": {
            "text": "A support pulls free. You catch the edge of the bridge as your feet drop toward the water.",
            "goto": "bridge-slip"
          }
        },
        {
          "id": "turn-back",
          "label": "Leave the crossing alone",
          "emoji": "↩️",
          "outcome": {
            "text": "You turn back toward the waystation.",
            "goto": "return-route"
          }
        }
      ]
    },
    "bridge-slip": {
      "title": "🪵 A Failing Handhold",
      "tone": "shore",
      "text": "Your handhold shifts beneath your weight. The near bank is close, but broken stone and timber lie in the shallow water below.",
      "resumeText": "You remain caught above the channel, with the near bank within reach.",
      "choices": [
        {
          "id": "pull-up",
          "label": "Pull yourself onto the near bank",
          "emoji": "💪",
          "success": {
            "text": "You haul yourself over the broken edge and roll onto solid ground.",
            "goto": "near-bank"
          },
          "check": {
            "skill": "athletics",
            "dc": 12
          },
          "failure": {
            "text": "The timber tears loose. You fall into the channel, striking your leg against a submerged stone before crawling onto the bank.",
            "facts": [
              "briarfall-bridge-injury"
            ],
            "goto": "near-bank"
          }
        },
        {
          "id": "swing-clear",
          "label": "Swing toward the muddy bank",
          "emoji": "🤸",
          "success": {
            "text": "You swing clear of the broken supports and land on the muddy bank.",
            "goto": "near-bank"
          },
          "check": {
            "skill": "acrobatics",
            "dc": 12
          },
          "failure": {
            "text": "Your grip slips before the swing carries you clear. You strike the shallows hard and drag yourself out with a painful shoulder.",
            "facts": [
              "briarfall-bridge-injury"
            ],
            "goto": "near-bank"
          }
        }
      ]
    },
    "near-bank": {
      "title": "🌿 The Near Bank",
      "tone": "shore",
      "text": "The damaged crossing is no longer worth trusting. Farther downstream, the reeds thin enough to offer another view of the sign.",
      "resumeText": "You return to the near bank. The sign remains partly hidden across the channel.",
      "choices": [
        {
          "id": "downstream-view",
          "label": "Move downstream for a clearer view",
          "emoji": "👀",
          "success": {
            "text": "From downstream, the lettering clears the branches: “HARROWMERE — 6 MILES.” Beneath it is a carved lantern.",
            "facts": [
              "briarfall-harrowmere-discovered",
              "briarfall-lantern-emblem"
            ],
            "goto": "return-route"
          },
          "check": {
            "skill": "perception",
            "dc": 12
          },
          "failure": {
            "text": "You see a lantern carved beneath the lettering, but cannot recover the settlement’s full name.",
            "facts": [
              "briarfall-lantern-emblem"
            ],
            "goto": "return-route"
          }
        },
        {
          "id": "leave",
          "label": "Return with what you have learned",
          "emoji": "↩️",
          "outcome": {
            "text": "You leave the crossing and head back toward the waystation.",
            "goto": "return-route"
          }
        }
      ]
    },
    "road-sign": {
      "title": "🪧 The Forgotten Destination",
      "tone": "landing",
      "text": "The sign reads “HARROWMERE — 6 MILES.” Beneath the lettering is a lantern like those used around Wickhaven’s harbor. The northward road disappears beneath standing water. A shallow gravel bank offers a longer way back around the broken bridge.",
      "resumeText": "You return to the Harrowmere sign and its carved lantern.",
      "passive": {
        "skill": "history",
        "dc": 12,
        "note": "Passive History {value} applied to the road sign.",
        "success": {
          "text": "You have seen no mention of Harrowmere on Wickhaven’s current road maps.",
          "facts": [
            "briarfall-unmapped-settlement"
          ]
        }
      },
      "choices": [
        {
          "id": "copy-sign",
          "label": "Copy the name and lantern carving",
          "emoji": "✍️",
          "outcome": {
            "text": "You copy Harrowmere’s name, its distance, and the lantern emblem, then follow the gravel bank back.",
            "facts": [
              "briarfall-harrowmere-discovered",
              "briarfall-sign-recorded",
              "briarfall-lantern-emblem"
            ],
            "goto": "return-route"
          }
        },
        {
          "id": "take-plank",
          "label": "Remove the destination plank as evidence",
          "emoji": "🪵",
          "success": {
            "text": "The rusted nails pull free. You carry the named plank back along the gravel bank.",
            "facts": [
              "briarfall-harrowmere-discovered",
              "briarfall-sign-recovered",
              "briarfall-lantern-emblem"
            ],
            "goto": "return-route"
          },
          "check": {
            "skill": "athletics",
            "dc": 12
          },
          "failure": {
            "text": "The plank splits around its nails. You save a fragment bearing “Harrowmere” and leave the remaining sign standing.",
            "facts": [
              "briarfall-harrowmere-discovered",
              "briarfall-sign-fragment"
            ],
            "goto": "return-route"
          }
        },
        {
          "id": "inspect-road",
          "label": "Examine where the north road continues",
          "emoji": "👣",
          "success": {
            "text": "Beyond the sign, the paving continues beneath the flood. Old wheel ruts show this was a regularly traveled road, not a forgotten footpath.",
            "facts": [
              "briarfall-harrowmere-discovered",
              "briarfall-established-road"
            ],
            "goto": "return-route"
          },
          "check": {
            "skill": "survival",
            "dc": 13
          },
          "failure": {
            "text": "The water hides the road after a few yards. You record the destination but cannot determine whether the route remains passable.",
            "facts": [
              "briarfall-harrowmere-discovered"
            ],
            "goto": "return-route"
          }
        }
      ]
    },
    "return-route": {
      "title": "🌊 The Return Route",
      "tone": "shore",
      "text": "Water covers the lowest stretch of road. A drainage ditch follows the fields uphill, while the higher embankment offers a rougher route. The waystation’s upper floor provides shelter until the ebb.",
      "resumeText": "You return to the flooded approach. You can seek higher ground or wait for the tide to fall.",
      "passive": {
        "skill": "survival",
        "dc": 12,
        "note": "Passive Survival {value} applied to the return route.",
        "success": {
          "text": "The water has nearly reached its highest mark. Waiting upstairs should leave a safe road home.",
          "facts": [
            "briarfall-safe-ebb"
          ]
        }
      },
      "choices": [
        {
          "id": "ditch",
          "label": "Follow the drainage ditch uphill",
          "emoji": "🌾",
          "success": {
            "text": "The ditch leads to a dry field path. You reach Wickhaven’s outskirts safely.",
            "goto": "report"
          },
          "check": {
            "skill": "survival",
            "dc": 13
          },
          "failure": {
            "text": "The ditch ends in deep water. You retreat to the waystation and wait upstairs until the road clears.",
            "facts": [
              "briarfall-delayed-return"
            ],
            "goto": "report"
          }
        },
        {
          "id": "high-ground",
          "label": "Climb back along the embankment",
          "emoji": "🧗",
          "success": {
            "text": "You cross the broken sections and reach dry ground above the road.",
            "goto": "report"
          },
          "check": {
            "skill": "athletics",
            "dc": 13
          },
          "failure": {
            "text": "Loose earth gives way beneath you. You return to the waystation rather than risk another fall and wait for the ebb.",
            "facts": [
              "briarfall-delayed-return"
            ],
            "goto": "report"
          }
        },
        {
          "id": "wait",
          "label": "Wait upstairs for the ebb",
          "emoji": "⏳",
          "outcome": {
            "text": "You wait above the flood until the road reappears, then return safely.",
            "facts": [
              "briarfall-delayed-return"
            ],
            "goto": "report"
          }
        }
      ]
    },
    "report": {
      "title": "📜 The Road Report",
      "tone": "landing",
      "text": "You reach Wickhaven with your notes from Briarfall Road. The abandoned belongings and the road beyond the bridge deserve a place in the Ledger.",
      "resumeText": "Your road discoveries are ready to record.",
      "choices": [
        {
          "id": "finish",
          "label": "Record findings and complete the expedition",
          "emoji": "📜",
          "outcome": {
            "text": "You enter your Briarfall Road discoveries in the Ledger. This expedition is complete.",
            "goto": "@complete"
          },
          "style": "success"
        },
        {
          "id": "retreat",
          "label": "Leave the report unfinished",
          "emoji": "↩️",
          "outcome": {
            "text": "Your discoveries remain saved, but the expedition is unfinished.",
            "goto": "@retreat"
          },
          "style": "secondary"
        }
      ]
    }
  }
};
