// Saint Orra’s Orchard — built from Wickhaven-Ledger-Quest-Compendium.md (exact engine fields), November 2, 2026.
// Status 'test': runs only in the staff quest channel until changed to 'live'.

export default {
  "id": "saint-orras-orchard",
  "name": "Saint Orra’s Orchard",
  "emoji": "🍎",
  "status": "live",
  "start": "orchard-gate",
  "completion": {
    "milestone": "orra-orchard-discovery",
    "ap": 1,
    "first": " First orchard visit recorded (journal only; no AP or gold).",
    "repeat": " Repeat visit recorded. No additional reward."
  },
  "journal": {
      "orra-untended-fruit": "The orchard has been untended for decades, yet its fruit is healthy and plentiful.",
      "orra-house-candle-connection": "The shrine niches hold the same pale wax used at the House of Returning.",
      "orra-homecoming-saint": "Saint Orra watched over those traveling home.",
      "orra-paired-flames": "Orra’s verse calls for paired flames: one for the traveler, one where they are awaited.",
      "orra-two-flame-carving": "A worn carving shows a doorway and two small flames.",
      "orra-offering-left": "You left fruit as an offering in Orra’s cup.",
      "orra-shrine-tended": "You reset the shrine’s offering cup.",
      "orra-offering-accepted": "The old candle stub glowed briefly when the cup was restored.",
      "orra-niche-repair-needed": "The shrine’s offering cup is broken and needs repair.",
      "orra-homeward-sign": "The candle stub lit on its own, its flame leaning toward Wickhaven.",
      "orra-prayer-offered": "You offered a prayer at Orra’s shrine.",
      "orra-wax-in-fruit": "Some fallen fruit has split around pieces of old wax.",
      "orra-fruit-taken": "You took fruit that grew warm and drew your attention toward Wickhaven.",
      "orra-spoiled-fruit": "A spoiled fruit held a small wax object.",
      "orra-doorway-seal": "The wax doorway seal is a homecoming symbol also used at the House of Returning.",
      "orra-unidentified-seal": "You found a devotional seal you could not identify.",
      "orra-fruit-grown-around-offering": "The fruit grew around part of an old candle offering.",
      "orra-seal-returned": "You returned the wax seal to the offering cup.",
      "orra-root-cache": "Pottery lies in a hollow beside a keeper’s burial.",
      "orra-keeper-tablet": "A keeper’s tablet reads: “For those still walking home, tend the paired flames,” with flames marked for Orra and Wickhaven.",
      "orra-cache-slipped": "The pottery tube slipped deeper beneath the roots.",
      "orra-grave-disturbed": "Recovering the tablet exposed the edge of a keeper’s burial.",
      "orra-tablet-fragment": "A broken tablet shows two candles joined by a line.",
      "orra-cache-left-undisturbed": "You chose to leave the keeper’s burial closed.",
      "orra-grave-restored": "You covered the burial and secured its marker.",
      "orra-restoration-needed": "A keeper’s burial needs proper repairs from Wickhaven."
  },
  "scenes": {
    "orchard-gate": {
      "title": "🍎 The Orchard Gate",
      "tone": "landing",
      "text": "Beyond a fallen gate, old trees bend beneath fresh fruit. The orchard has stood untended for seventy years. A small shrine waits among the trunks, and low keeper stones line the rising ground behind it.",
      "resumeText": "You return to the orchard gate. Fruit still hangs among the leaves.",
      "passive": {
        "skill": "nature",
        "dc": 12,
        "note": "Passive Nature {value} applied to the orchard.",
        "success": {
          "text": "The trees show decades of neglect, yet their fruit is healthy and plentiful.",
          "facts": [
            "orra-untended-fruit"
          ]
        }
      },
      "choices": [
        {
          "id": "shrine",
          "label": "Visit the shrine",
          "emoji": "🕯️",
          "outcome": {
            "text": "You follow the old path toward the shrine.",
            "goto": "shrine"
          }
        },
        {
          "id": "fruit",
          "label": "Examine the fruit trees",
          "emoji": "🍎",
          "outcome": {
            "text": "You step beneath the laden branches.",
            "goto": "fruit-trees"
          }
        },
        {
          "id": "keepers",
          "label": "Visit the keeper stones",
          "emoji": "🪦",
          "outcome": {
            "text": "You follow the rising ground toward the burial markers.",
            "goto": "keeper-stones"
          }
        },
        {
          "id": "retreat",
          "label": "Return to Wickhaven",
          "emoji": "↩️",
          "outcome": {
            "text": "You leave the orchard unexplored. Your expedition remains unfinished.",
            "goto": "@retreat"
          },
          "style": "secondary"
        }
      ]
    },
    "shrine": {
      "title": "🕯️ The Homeward Shrine",
      "tone": "landing",
      "text": "Candle niches surround a doorway carved into the shrine. Beneath it, the inscription begins: “Saint Orra, Keeper of the Homeward Door.” A shallow offering cup rests on the step.",
      "resumeText": "You return to Orra’s shrine. The candle niches face the path toward Wickhaven.",
      "passive": {
        "skill": "perception",
        "dc": 12,
        "note": "Passive Perception {value} applied to the shrine.",
        "success": {
          "text": "The niches hold traces of the same pale wax used at the House of Returning.",
          "facts": [
            "orra-house-candle-connection"
          ]
        }
      },
      "choices": [
        {
          "id": "interpret-faith",
          "label": "Interpret the homecoming observance",
          "emoji": "📖",
          "success": {
            "text": "Orra watched over those traveling home. The verse calls for paired flames: one kept for the traveler, another at the place awaiting their return.",
            "facts": [
              "orra-homecoming-saint",
              "orra-paired-flames"
            ]
          },
          "check": {
            "skill": "religion",
            "dc": 12
          },
          "failure": {
            "text": "You recover Orra’s title and a prayer for safe homecoming, but the instructions beneath it remain unclear.",
            "facts": [
              "orra-homecoming-saint"
            ]
          },
          "once": true
        },
        {
          "id": "reconstruct-inscription",
          "label": "Reconstruct the worn inscription",
          "emoji": "🔎",
          "success": {
            "text": "Using repeated letters and sheltered grooves, you recover: “A light kept here, a door kept there.” A small carving links the orchard shrine to Wickhaven.",
            "facts": [
              "orra-paired-flames",
              "orra-house-candle-connection"
            ]
          },
          "check": {
            "skill": "investigation",
            "dc": 13
          },
          "failure": {
            "text": "Most of the inscription is too worn to recover. You identify a doorway and two small flames, but cannot determine their meaning.",
            "facts": [
              "orra-two-flame-carving"
            ]
          },
          "once": true
        },
        {
          "id": "offering",
          "label": "Prepare an offering",
          "emoji": "🎁",
          "outcome": {
            "text": "You kneel beside the offering cup.",
            "goto": "offering"
          }
        },
        {
          "id": "back",
          "label": "Return to the orchard paths",
          "emoji": "↩️",
          "outcome": {
            "text": "You step away from the shrine.",
            "goto": "orchard-gate"
          }
        }
      ]
    },
    "offering": {
      "title": "🎁 An Offering for Orra",
      "tone": "landing",
      "text": "A fallen fruit lies beside the shrine. An empty stone cup and an old candle stub remain on the step. You could leave something for the saint—or set the neglected shrine in order.",
      "resumeText": "The offering cup waits beside the shrine’s worn step.",
      "choices": [
        {
          "id": "leave-fruit",
          "label": "Place the fallen fruit in the offering cup",
          "emoji": "🍎",
          "outcome": {
            "text": "You brush the dirt from the fruit and place it in the cup. The scent of warm candle wax passes through the shrine, familiar from the House of Returning.",
            "facts": [
              "orra-offering-left",
              "orra-house-candle-connection"
            ],
            "goto": "report"
          }
        },
        {
          "id": "restore-niche",
          "label": "Restore a fallen candle niche",
          "emoji": "🕯️",
          "success": {
            "text": "You lift the small stone cup back into its setting. A warm draft passes your hands, and the old candle stub briefly glows.",
            "facts": [
              "orra-shrine-tended",
              "orra-offering-accepted"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "athletics",
            "dc": 10
          },
          "failure": {
            "text": "The cup is too fractured to reset. You gather its pieces on the step, leaving the shrine tidier but still in need of repair.",
            "facts": [
              "orra-shrine-tended",
              "orra-niche-repair-needed"
            ],
            "goto": "report"
          }
        },
        {
          "id": "speak-prayer",
          "label": "Speak a homecoming prayer",
          "emoji": "🙏",
          "success": {
            "text": "As you finish, the candle stub kindles without a spark. Its flame leans toward Wickhaven before fading.",
            "facts": [
              "orra-offering-accepted",
              "orra-homeward-sign"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "religion",
            "dc": 12
          },
          "failure": {
            "text": "The words come awkwardly, and no flame answers. As you rise, you catch the smell of the House of Returning’s candles.",
            "facts": [
              "orra-prayer-offered",
              "orra-house-candle-connection"
            ],
            "goto": "report"
          }
        },
        {
          "id": "leave",
          "label": "Leave the offering cup untouched",
          "emoji": "↩️",
          "outcome": {
            "text": "You step away without disturbing the cup.",
            "goto": "orchard-gate"
          }
        }
      ]
    },
    "fruit-trees": {
      "title": "🌳 Beneath the Branches",
      "tone": "landing",
      "text": "Ripe fruit hangs within reach. Small offerings rest between the roots: a ribbon, a cracked cup, and the remains of candles. Fallen fruit lies untouched beneath the trees.",
      "resumeText": "You return beneath the fruit-laden branches.",
      "passive": {
        "skill": "perception",
        "dc": 12,
        "note": "Passive Perception {value} applied to the fruit trees.",
        "success": {
          "text": "Several fallen fruits have split around small pieces of old wax.",
          "facts": [
            "orra-wax-in-fruit"
          ]
        }
      },
      "choices": [
        {
          "id": "choose-fruit",
          "label": "Choose a sound fruit to take",
          "emoji": "🍎",
          "success": {
            "text": "You select a sound fruit. As its stem parts, warmth gathers beneath its skin and draws your attention toward the Wickhaven path.",
            "facts": [
              "orra-fruit-taken",
              "orra-homeward-sign"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "nature",
            "dc": 12
          },
          "failure": {
            "text": "The fruit opens in your hand, spoiled around the stone. A small wax object lies inside.",
            "facts": [
              "orra-spoiled-fruit"
            ],
            "goto": "fruit-seal"
          }
        },
        {
          "id": "harvest-carefully",
          "label": "Harvest without damaging the tree",
          "emoji": "🌿",
          "success": {
            "text": "You ease the stem free without bending the branch. The fruit smells faintly of candle wax; the path home seems unusually clear.",
            "facts": [
              "orra-fruit-taken",
              "orra-homeward-sign"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "survival",
            "dc": 12
          },
          "failure": {
            "text": "The branch twists and drops an overripe fruit. Its split flesh reveals a small wax object.",
            "facts": [
              "orra-spoiled-fruit"
            ],
            "goto": "fruit-seal"
          }
        },
        {
          "id": "leave-fruit",
          "label": "Leave the fruit and visit the shrine",
          "emoji": "🕯️",
          "outcome": {
            "text": "You leave the branches undisturbed and follow the path to the shrine.",
            "goto": "shrine"
          }
        },
        {
          "id": "back",
          "label": "Return to the orchard gate",
          "emoji": "↩️",
          "outcome": {
            "text": "You step out from beneath the branches.",
            "goto": "orchard-gate"
          }
        }
      ]
    },
    "fruit-seal": {
      "title": "🚪 The Wax Seal",
      "tone": "landing",
      "text": "Inside the spoiled fruit lies a wax seal marked with an open doorway. The tree appears to have grown the fruit around it.",
      "resumeText": "The doorway seal remains wrapped in the fruit’s split skin.",
      "choices": [
        {
          "id": "identify-seal",
          "label": "Identify the seal’s religious meaning",
          "emoji": "📖",
          "success": {
            "text": "The doorway is a homecoming symbol. The same mark appears on candles kept for absent travelers at the House of Returning.",
            "facts": [
              "orra-doorway-seal",
              "orra-house-candle-connection"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "religion",
            "dc": 12
          },
          "failure": {
            "text": "You recognize a devotional seal but cannot identify its observance. Someone at the House of Returning may know it.",
            "facts": [
              "orra-unidentified-seal"
            ],
            "goto": "report"
          }
        },
        {
          "id": "examine-seal",
          "label": "Examine how the seal entered the fruit",
          "emoji": "🔎",
          "success": {
            "text": "There is no cut in the skin. Old wick fibers remain inside the wax: the fruit grew around part of a candle offering.",
            "facts": [
              "orra-doorway-seal",
              "orra-fruit-grown-around-offering"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "investigation",
            "dc": 13
          },
          "failure": {
            "text": "The fruit is too spoiled to establish how the wax entered it. You preserve the seal for examination in Wickhaven.",
            "facts": [
              "orra-unidentified-seal"
            ],
            "goto": "report"
          }
        },
        {
          "id": "return-seal",
          "label": "Return the seal to the shrine",
          "emoji": "🎁",
          "outcome": {
            "text": "You place the seal in the offering cup. For a moment, the air smells of a freshly extinguished candle.",
            "facts": [
              "orra-seal-returned",
              "orra-offering-left"
            ],
            "goto": "report"
          }
        }
      ]
    },
    "keeper-stones": {
      "title": "🪦 The Keeper Stones",
      "tone": "landing",
      "text": "Low burial markers stand among the roots. One leans beside a narrow hollow beneath an old tree. A piece of pottery is barely visible inside.",
      "resumeText": "You return to the keeper stones. Roots cover the edges of the burials.",
      "passive": {
        "skill": "perception",
        "dc": 13,
        "note": "Passive Perception {value} applied to the keeper stones.",
        "success": {
          "text": "The pottery lies beside the burial, in a separate hollow. It might be retrieved without opening the grave.",
          "facts": [
            "orra-root-cache"
          ]
        }
      },
      "choices": [
        {
          "id": "reach-hollow",
          "label": "Reach into the root hollow",
          "emoji": "🤏",
          "success": {
            "text": "You recover a pottery tube without disturbing the grave. Its tablet reads: “For those still walking home, tend the paired flames.” One flame is marked with Orra’s doorway; the other with Wickhaven.",
            "facts": [
              "orra-keeper-tablet",
              "orra-paired-flames",
              "orra-house-candle-connection"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "sleightOfHand",
            "dc": 13
          },
          "failure": {
            "text": "The tube rolls deeper beneath the roots. Retrieving it will now require opening the earth beside the marker.",
            "facts": [
              "orra-cache-slipped"
            ],
            "goto": "burial-decision"
          }
        },
        {
          "id": "careful-dig",
          "label": "Excavate carefully beside the marker",
          "emoji": "🔎",
          "success": {
            "text": "You recover a tablet describing paired homeward flames, but the excavation exposes the edge of the keeper’s burial.",
            "facts": [
              "orra-keeper-tablet",
              "orra-paired-flames",
              "orra-grave-disturbed"
            ],
            "goto": "disturbed-grave"
          },
          "check": {
            "skill": "investigation",
            "dc": 13
          },
          "failure": {
            "text": "Loose soil collapses into the burial. A broken tablet emerges, showing two candles joined by a line.",
            "facts": [
              "orra-tablet-fragment",
              "orra-grave-disturbed"
            ],
            "goto": "disturbed-grave"
          }
        },
        {
          "id": "lift-stone",
          "label": "Lift the leaning marker to reach beneath it",
          "emoji": "💪",
          "success": {
            "text": "You raise the marker enough to recover the pottery tube. Inside is an instruction to tend paired flames for those coming home. The marker’s movement leaves the burial exposed.",
            "facts": [
              "orra-keeper-tablet",
              "orra-paired-flames",
              "orra-grave-disturbed"
            ],
            "goto": "disturbed-grave"
          },
          "check": {
            "skill": "athletics",
            "dc": 14
          },
          "failure": {
            "text": "The marker slips sideways, breaking the tube and opening the burial’s edge. Only a fragment showing two candles survives.",
            "facts": [
              "orra-tablet-fragment",
              "orra-grave-disturbed"
            ],
            "goto": "disturbed-grave"
          }
        },
        {
          "id": "leave",
          "label": "Leave the burials undisturbed",
          "emoji": "↩️",
          "outcome": {
            "text": "You leave the keeper stones as you found them.",
            "goto": "report"
          }
        }
      ]
    },
    "burial-decision": {
      "title": "🌱 Beneath the Roots",
      "tone": "landing",
      "text": "The pottery tube lies beyond your reach. Recovering it will require disturbing the earth beside the keeper’s burial.",
      "resumeText": "The tube remains beneath the roots. The burial is still closed.",
      "choices": [
        {
          "id": "excavate",
          "label": "Carefully open the earth beside the roots",
          "emoji": "🔎",
          "success": {
            "text": "You recover the tube and its instruction to tend paired homeward flames. The excavation exposes part of the burial.",
            "facts": [
              "orra-keeper-tablet",
              "orra-paired-flames",
              "orra-grave-disturbed"
            ],
            "goto": "disturbed-grave"
          },
          "check": {
            "skill": "investigation",
            "dc": 13
          },
          "failure": {
            "text": "The hollow collapses into the burial. You recover only a tablet fragment showing two candles.",
            "facts": [
              "orra-tablet-fragment",
              "orra-grave-disturbed"
            ],
            "goto": "disturbed-grave"
          }
        },
        {
          "id": "leave",
          "label": "Leave the tube where it rests",
          "emoji": "↩️",
          "outcome": {
            "text": "You withdraw your hands and leave the burial closed.",
            "facts": [
              "orra-cache-left-undisturbed"
            ],
            "goto": "report"
          }
        }
      ]
    },
    "disturbed-grave": {
      "title": "🌿 The Disturbed Burial",
      "tone": "landing",
      "text": "The keeper’s burial is exposed. Loose earth surrounds the marker, and the roots no longer hold its base securely.",
      "resumeText": "The burial still needs covering and its marker needs support.",
      "choices": [
        {
          "id": "restore-earth",
          "label": "Rebuild the earth around the burial",
          "emoji": "🌱",
          "success": {
            "text": "You cover the burial and restore the drainage around the roots. The marker settles securely.",
            "facts": [
              "orra-grave-restored"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "survival",
            "dc": 10
          },
          "failure": {
            "text": "You cover the remains, but the loosened ground will not support the marker. Proper repairs will need help from Wickhaven.",
            "facts": [
              "orra-restoration-needed"
            ],
            "goto": "report"
          }
        },
        {
          "id": "reset-stone",
          "label": "Reset and brace the keeper stone",
          "emoji": "💪",
          "success": {
            "text": "You lift the marker into place and brace it while packing the earth. The burial is covered again.",
            "facts": [
              "orra-grave-restored"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "athletics",
            "dc": 10
          },
          "failure": {
            "text": "The marker will not hold in the soft ground. You cover the burial, but further repairs are needed.",
            "facts": [
              "orra-restoration-needed"
            ],
            "goto": "report"
          }
        },
        {
          "id": "seek-help",
          "label": "Leave and report the damage",
          "emoji": "↩️",
          "outcome": {
            "text": "You cover the exposed earth as best you can and mark the location for a repair party.",
            "facts": [
              "orra-restoration-needed"
            ],
            "goto": "report"
          }
        }
      ]
    },
    "report": {
      "title": "📜 Leaving the Orchard",
      "tone": "landing",
      "text": "The path to Wickhaven lies beyond the gate. You gather your orchard discoveries before leaving.",
      "resumeText": "Your orchard findings are ready for the Ledger.",
      "choices": [
        {
          "id": "finish",
          "label": "Record findings and complete the visit",
          "emoji": "📜",
          "outcome": {
            "text": "You return to Wickhaven and record what you found in Saint Orra’s orchard.",
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
