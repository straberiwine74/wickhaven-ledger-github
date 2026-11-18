// The Empty Ferry — Sam's quest, converted from his gvar.
// Converted November 18, 2026. Status 'test': runs only in the staff quest channel until changed to 'live'.
// Each rolled choice has success/failure results; guaranteed choices use outcome.
// goto names the next scene. Omit goto to remain in the current scene.
// @complete finishes the run; @retreat leaves it unfinished.

export default {
  "id": "empty-ferry",
  "name": "The Empty Ferry",
  "emoji": "⛴️",
  "status": "test",
  "start": "quay",
  "completion": {
    "milestone": "empty-ferry-investigated",
    "ap": 1,
    "first": " First investigation of the Marigold recorded.",
    "repeat": " Repeat visit recorded. No additional reward."
  },
  "journal": {
    "ferry-lines-cut": "The Marigold’s mooring lines were cut, not slipped.",
    "ferry-boat-missing": "The ferry’s ship’s boat is missing from its davits.",
    "ferry-boarded-quietly": "You boarded the Marigold before the harbour watch arrived.",
    "ferry-watch-noticed": "The harbour watch saw you board the Marigold.",
    "deck-supper-warm": "Supper was laid in the saloon and the pot was still warm when the ferry drifted in.",
    "deck-scuffs": "Boot scuffs and a dropped glove by the rail show passengers were hurried over the side.",
    "cabin-log-entry": "The ferryman’s log: “Signalled to heave to off Gull Point. Cutter shows no colours.”",
    "cabin-log-torn": "The final page of the ferryman’s log has been torn out.",
    "cabin-passenger-list": "The passenger list names nine travellers. One name, “Mr Vell,” is underlined.",
    "cabin-letter": "A passenger’s unsent letter says they saw a shuttered lamp on the clifftop before the cutter came alongside.",
    "hold-crate-missing": "One crate is missing from the hold. Its manifest line reads “survey instruments — for the Watch.”",
    "hold-stowaway": "A ship’s boy, Pip, hid in the hold through it all.",
    "hold-pip-account": "Pip says the passengers were put ashore at Gull Point unharmed. Mr Vell went with the cutter willingly.",
    "hold-pip-silent": "The ship’s boy was too frightened to say more than “they’re at the Point.”",
    "hold-pip-fled": "A small figure fled the hold and vanished into the harbour crowd."
  },
  "scenes": {
    "quay": {
      "title": "⚓ Wickhaven Quay",
      "tone": "shore",
      "text": "At first light the ferry Marigold drifts into Wickhaven harbour with her lamps still lit and no one at the helm. She bumps against the quay and stays there. A crowd is gathering, and the harbour watch has been sent for.",
      "resumeText": "You return to the quay. The Marigold rocks gently against the stones.",
      "passive": {
        "skill": "perception",
        "dc": 12,
        "note": "Passive Perception {value} applied to the quay.",
        "success": {
          "text": "Her trailing mooring lines end in clean, angled cuts. And the davits at her stern hang empty: her boat is gone.",
          "facts": [
            "ferry-lines-cut",
            "ferry-boat-missing"
          ]
        }
      },
      "choices": [
        {
          "id": "board-quick",
          "label": "Slip aboard before the watch arrives",
          "emoji": "🏃",
          "success": {
            "text": "You step across onto the deck while the crowd is still arguing. No one stops you.",
            "facts": [
              "ferry-boarded-quietly"
            ],
            "goto": "deck"
          },
          "check": {
            "skill": "stealth",
            "dc": 12
          },
          "failure": {
            "text": "A watchman shouts as you cross the gap. You are aboard, but every eye on the quay is now on you.",
            "facts": [
              "ferry-watch-noticed"
            ],
            "flags": {
              "alert": true
            },
            "goto": "deck"
          }
        },
        {
          "id": "talk-watch",
          "label": "Wait for the watch and talk your way aboard",
          "emoji": "🗣️",
          "success": {
            "text": "The sergeant is glad of someone willing to go first. She waves you aboard and keeps the crowd back.",
            "goto": "deck"
          },
          "check": {
            "skill": "persuasion",
            "dc": 13
          },
          "failure": {
            "text": "The sergeant refuses, then gets called away to a fight in the crowd. You board anyway, and she sees you do it.",
            "facts": [
              "ferry-watch-noticed"
            ],
            "goto": "deck"
          }
        },
        {
          "id": "retreat",
          "label": "Return to town",
          "emoji": "↩️",
          "outcome": {
            "text": "You leave the matter to the watch. No roll or rest. Your expedition and supplies remain locked.",
            "goto": "@retreat"
          },
          "style": "secondary"
        }
      ]
    },
    "deck": {
      "title": "⛴️ The Deck",
      "tone": "landing",
      "text": "The Marigold’s deck is tidy. Lamps burn in the saloon, where supper has been laid for nine. A door aft leads to the ferryman’s cabin; a hatch forward opens on the hold.",
      "resumeText": "You return to the Marigold’s silent deck.",
      "passive": {
        "skill": "investigation",
        "dc": 13,
        "note": "Passive Investigation {value} applied to the deck.",
        "success": {
          "text": "The stew pot in the saloon is still warm. By the starboard rail, a lady’s glove lies beside fresh boot scuffs. The passengers left in a hurry, and not long ago.",
          "facts": [
            "deck-supper-warm",
            "deck-scuffs"
          ]
        }
      },
      "choices": [
        {
          "id": "cabin",
          "label": "Search the ferryman’s cabin",
          "emoji": "🚪",
          "outcome": {
            "text": "You open the cabin door. Charts and papers are scattered across the bunk.",
            "goto": "cabin"
          }
        },
        {
          "id": "hold",
          "label": "Go down into the hold",
          "emoji": "🪜",
          "outcome": {
            "text": "You lift the hatch and climb down into the cargo hold.",
            "goto": "hold"
          }
        },
        {
          "id": "finish",
          "label": "Record what you’ve seen and finish this visit",
          "emoji": "📜",
          "outcome": {
            "text": "You note the warm supper and empty boat-davits, then step back onto the quay. The rest of the ship you leave to the watch.",
            "goto": "@complete"
          },
          "style": "success"
        }
      ]
    },
    "cabin": {
      "title": "🗺️ The Ferryman’s Cabin",
      "tone": "landing",
      "text": "The cabin has been searched in haste. Drawers hang open, charts lie on the floor, and the ferryman’s log sits on the bunk with its last page torn away.",
      "resumeText": "You return to the ransacked cabin.",
      "choices": [
        {
          "id": "log",
          "once": true,
          "label": "Recover the torn log entry",
          "emoji": "✍️",
          "success": {
            "text": "You shade the next page with a pencil stub, and the pressed lines of the missing entry rise out of the paper: “Signalled to heave to off Gull Point. Cutter shows no colours.”",
            "facts": [
              "cabin-log-torn",
              "cabin-log-entry"
            ]
          },
          "check": {
            "skill": "investigation",
            "dc": 13
          },
          "failure": {
            "text": "The final page is gone, and the one beneath it shows nothing you can read.",
            "facts": [
              "cabin-log-torn"
            ]
          }
        },
        {
          "id": "papers",
          "once": true,
          "label": "Sort through the scattered papers",
          "emoji": "📄",
          "success": {
            "text": "Among the charts you find the passenger list, nine names, one underlined twice: Mr Vell. Folded inside it is a passenger’s unsent letter, describing a shuttered lamp flashing on the clifftop just before a cutter came alongside.",
            "facts": [
              "cabin-passenger-list",
              "cabin-letter"
            ]
          },
          "check": {
            "skill": "perception",
            "dc": 12
          },
          "failure": {
            "text": "You find the passenger list, nine names with one underlined, but the rest of the papers are only tide tables and old bills.",
            "facts": [
              "cabin-passenger-list"
            ]
          }
        },
        {
          "id": "hold",
          "label": "Head forward to the hold",
          "emoji": "🪜",
          "outcome": {
            "text": "You cross the deck and climb down through the forward hatch.",
            "goto": "hold"
          }
        },
        {
          "id": "leave",
          "label": "Take your findings ashore",
          "emoji": "📜",
          "outcome": {
            "text": "You gather what you have and return to the quay.",
            "goto": "report"
          }
        }
      ]
    },
    "hold": {
      "title": "📦 The Hold",
      "tone": "landing",
      "text": "The hold smells of tar and wet rope. Crates are lashed in neat rows, but one space near the hatch stands empty, its lashings cut. Something shifts behind the furthest crates.",
      "resumeText": "You return to the dim hold. The empty space near the hatch remains.",
      "passive": {
        "skill": "investigation",
        "dc": 12,
        "note": "Passive Investigation {value} applied to the hold.",
        "success": {
          "text": "A manifest is nailed to the bulkhead. The empty space matches one line: “survey instruments — for the Watch.”",
          "facts": [
            "hold-crate-missing"
          ]
        }
      },
      "choices": [
        {
          "id": "coax",
          "label": "Speak softly to whoever is hiding",
          "emoji": "🤲",
          "success": {
            "text": "A ship’s boy, perhaps twelve, creeps out. His name is Pip. The cutter’s crew put the passengers ashore at Gull Point, he says, unhurt, and cut the ferry loose. Mr Vell went with them willingly, and so did a crate from the hold.",
            "facts": [
              "hold-stowaway",
              "hold-pip-account"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "insight",
            "dc": 12
          },
          "failure": {
            "text": "A ship’s boy creeps out, shaking. All he will say, over and over, is “They’re at the Point.”",
            "facts": [
              "hold-stowaway",
              "hold-pip-silent"
            ],
            "goto": "report"
          }
        },
        {
          "id": "grab",
          "label": "Move fast and catch them before they run",
          "emoji": "💪",
          "success": {
            "text": "You get between the crates and the hatch. A ship’s boy, Pip, gives up at once and, once he has caught his breath, tells you about the cutter, the passengers left at Gull Point, and Mr Vell, who went with the cutter willingly.",
            "facts": [
              "hold-stowaway",
              "hold-pip-account"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "acrobatics",
            "dc": 13
          },
          "failure": {
            "text": "A small figure darts past you, up the ladder, and over the rail onto the quay. By the time you reach the deck, they are lost in the crowd.",
            "facts": [
              "hold-pip-fled"
            ],
            "goto": "report"
          }
        },
        {
          "id": "leave",
          "label": "Leave them be and take your findings ashore",
          "emoji": "📜",
          "outcome": {
            "text": "You climb back to the deck and leave whoever it is in peace.",
            "goto": "report"
          }
        }
      ]
    },
    "report": {
      "title": "📜 Back on the Quay",
      "tone": "shore",
      "text": "The watch is boarding the Marigold behind you. Somewhere along the coast, nine passengers are walking home from Gull Point. It is time to record what you found.",
      "resumeText": "Your findings are ready to be recorded.",
      "choices": [
        {
          "id": "finish",
          "label": "Record findings and complete the expedition",
          "emoji": "📜",
          "outcome": {
            "text": "You enter your discoveries in the Ledger at Wickhaven. This expedition is complete.",
            "goto": "@complete"
          },
          "style": "success"
        },
        {
          "id": "retreat",
          "label": "Leave the expedition unfinished",
          "emoji": "↩️",
          "outcome": {
            "text": "You step away from the quay. Your discoveries remain recorded, but the expedition is unfinished.",
            "goto": "@retreat"
          },
          "style": "secondary"
        }
      ]
    }
  }
};
