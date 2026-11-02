// Drowned Watch — expanded quest reference.
// Existing shore/landing and prototype choice IDs are preserved for saved runs.
// Each rolled choice has success/failure results; guaranteed choices use outcome.
// goto names the next scene. Omit goto to remain in the current scene.
// @complete finishes the run; @retreat leaves it unfinished.
// Sleight of Hand uses the engine key sleightOfHand.
// This module follows the supplied quest schema. Status options: test, live, hidden

export default {
  "id": "drowned-watch",
  "name": "Drowned Watch",
  "emoji": "🗼",
  "status": "live",
  "start": "shore",
  "completion": {
    "milestone": "watch-reconnaissance",
	"ap": 1,
    "first": " First reconnaissance recorded (journal only; no AP or gold).",
    "repeat": " Repeat visit recorded. No additional reward."
  },
  "journal": {
      "chain-anchor": "The landing chain is anchored in weak stone and could tear loose under weight.",
      "culvert-submerges": "The culvert mouth disappears beneath passing swells.",
      "maintenance-route": "A slower maintenance route leads from the shore to the landing.",
      "moon-marked-door": "Moon-shaped scratches mark a concealed side entrance near the culvert.",
      "culvert-low-tide": "Harbor marks say the lower passage is usable only at low tide.",
      "watch-fresh-mud": "Fresh mud marked the keeper’s threshold, above the reach of the waves.",
      "tide-rota": "The keeper’s tide rota: the lower passage floods two hours before high water; the culvert clears an hour after the ebb.",
      "watch-shutter-closed": "The lamp still had fuel. Its shutter had been closed deliberately, from inside.",
      "watch-room-searched": "Someone had recently searched the keeper’s shelves.",
      "watch-log-found": "You found the keeper’s oilskin log.",
      "watch-earlier-visitor": "Someone visited the Watch after the flooding, before you.",
      "watch-darkening-fragment": "A torn scrap reads: “…the order to darken…”",
      "watch-visitor-exit": "The visitor left through a narrow service door behind the cupboard.",
      "watch-visitor-coastal-trail": "The visitor’s trail climbs to the coastal path. They left on foot, carrying something wrapped in cloth.",
      "watch-visitor-trail-lost": "The visitor’s trail was lost where it met the coastal path.",
      "watch-log-inventory": "A folded inventory lists “Keeper’s log — desk drawer.” The visitor may have missed it.",
      "watch-light-deliberately-extinguished": "The keeper’s log says the light was put out on purpose: “I heard the order plainly: put it out.”",
      "watch-log-copied": "You copied the keeper’s final entry in full.",
      "watch-partial-entry": "You recovered only fragments of the final entry: “flame held,” “closed the shutter.”",
      "watch-log-recovered": "You carried the keeper’s log home, wrapped and readable.",
      "watch-log-soaked": "The log’s final pages were soaked and their ink began to run.",
      "watch-rescue-hook": "An iron hook beside the outer doorway can reach things caught in the wash.",
      "watch-log-ruined": "The keeper’s log was ruined in the surf.",
      "watch-surf-fall": "A wave knocked you onto the lower stones at the outer doorway.",
      "watch-log-lost": "You let the keeper’s log go into the surf.",
      "watch-final-entry-preserved": "You saved the final pages; they show someone ordered the light extinguished.",
      "watch-final-entry-read": "You read the last words of the entry: “I heard the order plainly: put it out.”"
  },
  "scenes": {
    "shore": {
      "title": "🌊 The Shore",
      "tone": "shore",
      "text": "The Drowned Watch leans above the surf. A chain hangs from its upper landing; each wave pulls it taut. Below, a narrow culvert breathes cold air. The stairs are slick and exposed.",
      "resumeText": "You return to the same shore approach. Earlier discoveries and resources remain.",
      "passive": {
        "skill": "perception",
        "dc": 14,
        "note": "Passive Perception {value} applied to the approach.",
        "success": {
          "text": "You notice the chain pulls away from sound stone: it could tear loose under weight.",
          "facts": [
            "chain-anchor"
          ]
        }
      },
      "choices": [
        {
          "id": "climb",
          "label": "Climb the exposed stairs",
          "emoji": "🧗",
          "success": {
            "text": "You climb the exposed stairs and secure the landing. From above, you see the culvert mouth vanish beneath a passing swell.",
            "facts": [
              "culvert-submerges"
            ],
            "goto": "landing"
          },
          "check": {
            "skill": "athletics",
            "dc": 13
          },
          "failure": {
            "text": "The chain tears free. You drop onto a lower shelf and reach the landing by a slower route. Your pack catches on the stone; the noise carries into the tower.",
            "facts": [
              "maintenance-route"
            ],
            "flags": {
              "alert": true
            },
            "goto": "landing"
          }
        },
        {
          "id": "sneak",
          "label": "Time the culvert crossing",
          "emoji": "🌊",
          "success": {
            "text": "You slip through the culvert between waves. Moon-shaped scratches mark a concealed side entrance.",
            "facts": [
              "moon-marked-door"
            ],
            "goto": "landing"
          },
          "check": {
            "skill": "stealth",
            "dc": 12
          },
          "failure": {
            "text": "A wave drives you back before you can pass. You take the long stairs; a loose shutter begins knocking above you.",
            "facts": [
              "maintenance-route"
            ],
            "flags": {
              "alert": true
            },
            "goto": "landing"
          }
        },
        {
          "id": "study",
          "label": "Study the harbor marks",
          "emoji": "🔎",
          "success": {
            "text": "You read the surviving harbor marks: the lower passage is usable only at low tide. You follow a marked maintenance route to the landing.",
            "facts": [
              "culvert-low-tide"
            ],
            "goto": "landing"
          },
          "check": {
            "skill": "investigation",
            "dc": 14
          },
          "failure": {
            "text": "Salt has eaten the key markings. Working slowly, you find a stable maintenance route, but darkness overtakes the outer yard.",
            "facts": [
              "maintenance-route"
            ],
            "goto": "landing"
          }
        },
        {
          "id": "retreat",
          "label": "Return to town",
          "emoji": "↩️",
          "outcome": {
            "text": "You withdraw along the clear shore path. No roll or rest. Your expedition and supplies remain locked.",
            "goto": "@retreat"
          },
          "style": "secondary"
        }
      ]
    },
    "landing": {
      "title": "🗼 The Landing",
      "tone": "landing",
      "text": "Beyond the landing, a swollen wooden door hangs partly open. Water runs beneath it from the keeper’s room. An old tide-box remains fixed to the wall beside the stairs.",
      "resumeText": "You return to the secured landing; the recovered observation remains in your journal.",
      "passive": {
        "skill": "perception",
        "dc": 12,
        "note": "Passive Perception {value} applied to the landing.",
        "success": {
          "text": "Fresh mud marks the keeper’s threshold above the reach of the waves.",
          "facts": [
            "watch-fresh-mud"
          ]
        }
      },
      "choices": [
        {
          "id": "enter",
          "label": "Enter the keeper’s room",
          "emoji": "🚪",
          "outcome": {
            "text": "You push through the swollen doorway. Inside, seawater washes around an overturned chair.",
            "goto": "keepers-room"
          }
        },
        {
          "id": "tidebox",
          "label": "Leave 1 gp in the tide-box (spends 1 gp)",
          "emoji": "🪙",
          "outcome": {
            "text": "You drop 1 gp through the slot of the old keeper’s tide-box. The lid clicks open on a waxed slip: the Watch’s last tide rota. The lower passage floods two hours before high water; the culvert clears an hour after the ebb.\n1 gp spent. It is listed in your supplies receipt.",
            "facts": [
              "tide-rota"
            ]
          },
          "style": "secondary",
          "once": true,
          "legacyFlag": "tidebox",
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
          "label": "Record the approach and finish this visit",
          "emoji": "📜",
          "outcome": {
            "text": "You copy the surviving harbor marks and return to Wickhaven. Your reconnaissance is recorded, though the keeper’s room remains unexplored.",
            "goto": "@complete"
          },
          "style": "success"
        },
        {
          "id": "retreat",
          "label": "Retreat unfinished",
          "emoji": "↩️",
          "outcome": {
            "text": "You withdraw along the clear shore path. No roll or rest. Your expedition and supplies remain locked.",
            "goto": "@retreat"
          },
          "style": "secondary"
        }
      ]
    },
    "keepers-room": {
      "title": "🕯️ The Keeper’s Room",
      "tone": "landing",
      "text": "A desk lies crooked beneath an extinguished lamp. Its shutter is fastened from inside. Seawater moves between the floorboards, lifting scraps of paper whenever a wave strikes below.",
      "resumeText": "You return to the keeper’s room. Water still washes beneath the desk.",
      "passive": {
        "skill": "investigation",
        "dc": 13,
        "note": "Passive Investigation {value} applied to the room.",
        "success": {
          "text": "The lamp still has fuel. Its shutter was deliberately closed, and someone has recently searched the shelves.",
          "facts": [
            "watch-shutter-closed",
            "watch-room-searched"
          ]
        }
      },
      "choices": [
        {
          "id": "search-desk",
          "label": "Search the damaged desk",
          "emoji": "🔎",
          "success": {
            "text": "You free an oilskin book from the collapsed drawer. The keeper’s final entry is still partly readable.",
            "facts": [
              "watch-log-found"
            ],
            "goto": "logbook"
          },
          "check": {
            "skill": "investigation",
            "dc": 12
          },
          "failure": {
            "text": "The drawer gives way. An oilskin book drops into the wash and slides toward the outer doorway.",
            "goto": "surf"
          }
        },
        {
          "id": "follow-water",
          "label": "Follow the debris caught beneath the furniture",
          "emoji": "🌊",
          "success": {
            "text": "The scattered paper leads you to a bundle trapped beneath the desk. You ease the keeper’s log out of the water.",
            "facts": [
              "watch-log-found"
            ],
            "goto": "logbook"
          },
          "check": {
            "skill": "survival",
            "dc": 13
          },
          "failure": {
            "text": "You lift the desk, but the trapped book slips free and catches the outgoing water.",
            "goto": "surf"
          }
        },
        {
          "id": "trace-visitor",
          "label": "Examine the signs of another visitor",
          "emoji": "👣",
          "success": {
            "text": "Fresh bootprints stop beside an empty shelf. A torn scrap beneath it reads: “…the order to darken…” Someone searched here before you.",
            "facts": [
              "watch-earlier-visitor",
              "watch-darkening-fragment"
            ],
            "goto": "visitor-traces"
          },
          "check": {
            "skill": "investigation",
            "dc": 13
          },
          "failure": {
            "text": "Water has blurred the footprints. An open cupboard contains dry cord and fresh lamp soot, but you cannot tell what the visitor wanted.",
            "facts": [
              "watch-earlier-visitor"
            ],
            "goto": "visitor-traces"
          }
        },
        {
          "id": "leave",
          "label": "Return to the landing",
          "emoji": "↩️",
          "outcome": {
            "text": "You step back through the keeper’s doorway.",
            "goto": "landing"
          }
        }
      ]
    },
    "visitor-traces": {
      "title": "👣 The Earlier Visitor",
      "tone": "landing",
      "text": "Someone entered this room after the flooding. The shelves have been searched, and a cupboard stands open. Whatever they wanted may already be gone.",
      "resumeText": "You return to the disturbed cupboard and the traces of the earlier visitor.",
      "passive": {
        "skill": "perception",
        "dc": 13,
        "note": "Passive Perception {value} applied to the visitor’s traces.",
        "success": {
          "text": "A smear of fresh mud continues behind the cupboard toward a narrow service door.",
          "facts": [
            "watch-visitor-exit"
          ]
        }
      },
      "choices": [
        {
          "id": "follow-trail",
          "label": "Follow the visitor’s trail outside",
          "emoji": "👀",
          "success": {
            "text": "The trail passes through a service door and climbs toward the coastal path. Whoever came here left on foot, carrying something wrapped in cloth.",
            "facts": [
              "watch-visitor-coastal-trail"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "perception",
            "dc": 13
          },
          "failure": {
            "text": "Beyond the service door, spray has washed the stones clean. The visitor’s trail ends at the coastal path.",
            "facts": [
              "watch-visitor-trail-lost"
            ],
            "goto": "report"
          }
        },
        {
          "id": "search-missed",
          "label": "Search for anything the visitor missed",
          "emoji": "🔎",
          "success": {
            "text": "Behind the cupboard, you find a folded inventory: “Keeper’s log — desk drawer.” The visitor searched the shelves, but may have missed the book.",
            "facts": [
              "watch-log-inventory"
            ],
            "goto": "log-recovery"
          },
          "check": {
            "skill": "investigation",
            "dc": 12
          },
          "failure": {
            "text": "The cupboard holds nothing more. You can still examine the damaged desk or leave with evidence of the earlier visitor.",
            "goto": "log-recovery"
          }
        },
        {
          "id": "report-visitor",
          "label": "Return with evidence of the earlier visitor",
          "emoji": "📜",
          "outcome": {
            "text": "You record the disturbed shelves, fresh traces, and signs of a recent search.",
            "facts": [
              "watch-earlier-visitor"
            ],
            "goto": "report"
          }
        }
      ]
    },
    "log-recovery": {
      "title": "🗄️ The Remaining Search",
      "tone": "landing",
      "text": "The desk’s lower drawer sits partly beneath the water. If the keeper’s log is still here, this is the likeliest place to find it.",
      "resumeText": "You return to the desk’s submerged lower drawer.",
      "choices": [
        {
          "id": "dismantle-drawer",
          "label": "Carefully dismantle the drawer",
          "emoji": "🔎",
          "success": {
            "text": "You lift away the broken drawer front and recover an oilskin book.",
            "facts": [
              "watch-log-found"
            ],
            "goto": "logbook"
          },
          "check": {
            "skill": "investigation",
            "dc": 12
          },
          "failure": {
            "text": "The drawer collapses, releasing the book into the outgoing wash.",
            "goto": "surf"
          }
        },
        {
          "id": "lift-desk",
          "label": "Lift the desk clear of the water",
          "emoji": "💪",
          "success": {
            "text": "You brace the desk against the wall and pull the log from beneath it.",
            "facts": [
              "watch-log-found"
            ],
            "goto": "logbook"
          },
          "check": {
            "skill": "athletics",
            "dc": 13
          },
          "failure": {
            "text": "The desk shifts sideways. The book slips from its drawer and slides toward the outer doorway.",
            "goto": "surf"
          }
        },
        {
          "id": "leave",
          "label": "Leave the desk and report your findings",
          "emoji": "↩️",
          "outcome": {
            "text": "You leave the waterlogged desk and gather your notes about the earlier visitor.",
            "goto": "report"
          }
        }
      ]
    },
    "logbook": {
      "title": "📖 The Keeper’s Log",
      "tone": "landing",
      "text": "The keeper’s log rests in torn oilskin. Its final pages are damp. A line near the bottom reads: “The flame held through the gale.” Water is beginning to reach the binding.",
      "resumeText": "The damaged log remains where you secured it. Your recorded discoveries remain available.",
      "choices": [
        {
          "id": "read-copy",
          "label": "Decipher and copy the final entry",
          "emoji": "✍️",
          "success": {
            "text": "You copy the final entry: “The flame held through the gale. At the second bell, someone closed the shutter. I heard the order plainly: put it out.”",
            "facts": [
              "watch-light-deliberately-extinguished",
              "watch-log-copied"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "investigation",
            "dc": 12
          },
          "failure": {
            "text": "The ink has spread through several lines. You recover “flame held” and “closed the shutter,” but cannot decipher the rest.",
            "facts": [
              "watch-partial-entry"
            ],
            "goto": "damaged-log"
          }
        },
        {
          "id": "wrap-log",
          "label": "Wrap the log for the journey",
          "emoji": "🎒",
          "success": {
            "text": "You secure the oilskin around the binding. The final entry remains readable: the light was put out on purpose.",
            "facts": [
              "watch-log-recovered",
              "watch-light-deliberately-extinguished"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "survival",
            "dc": 12
          },
          "failure": {
            "text": "A wave reaches the desk before the wrapping is secure. The final pages soak through, and their ink begins to run.",
            "facts": [
              "watch-log-soaked",
              "watch-partial-entry"
            ],
            "goto": "damaged-log"
          }
        },
        {
          "id": "report-fragment",
          "label": "Leave the book and report the readable fragment",
          "emoji": "📜",
          "outcome": {
            "text": "You record the words “The flame held through the gale.” They suggest the storm did not extinguish the light, but the rest remains uncertain.",
            "facts": [
              "watch-partial-entry"
            ],
            "goto": "report"
          }
        }
      ]
    },
    "surf": {
      "title": "🌊 The Outgoing Wash",
      "tone": "shore",
      "text": "The oilskin book slides toward the broken outer doorway. Beyond it, the surf draws back from the rocks. The next wave is already gathering.",
      "resumeText": "You return to the broken doorway, where the surf washes across the stone.",
      "passive": {
        "skill": "perception",
        "dc": 13,
        "note": "Passive Perception {value} applied to the surf.",
        "success": {
          "text": "A loose iron hook beside the doorway could reach the book without entering the water.",
          "facts": [
            "watch-rescue-hook"
          ]
        }
      },
      "choices": [
        {
          "id": "catch-log",
          "label": "Wade out and catch the book",
          "emoji": "💪",
          "success": {
            "text": "You catch the oilskin strap against the doorframe and lift the book clear of the wash.",
            "facts": [
              "watch-log-found"
            ],
            "goto": "logbook"
          },
          "check": {
            "skill": "athletics",
            "dc": 14
          },
          "failure": {
            "text": "The wave knocks you onto the lower stones. By the time you regain your footing, the book has broken apart in the surf.",
            "facts": [
              "watch-log-ruined",
              "watch-surf-fall"
            ],
            "goto": "report"
          }
        },
        {
          "id": "hook-log",
          "label": "Use the doorway hook to retrieve it",
          "emoji": "🪝",
          "success": {
            "text": "You snag the oilskin strap and draw the book clear without entering the surf.",
            "facts": [
              "watch-log-found"
            ],
            "goto": "logbook"
          },
          "check": {
            "skill": "sleightOfHand",
            "dc": 12
          },
          "failure": {
            "text": "The hook catches a loose page. It tears free as the book disappears. The scrap reads: “…put out…”",
            "facts": [
              "watch-log-ruined",
              "watch-darkening-fragment"
            ],
            "goto": "report"
          }
        },
        {
          "id": "let-go",
          "label": "Step back and let it go",
          "emoji": "↩️",
          "outcome": {
            "text": "You retreat from the doorway. The next wave carries the keeper’s log into the surf.",
            "facts": [
              "watch-log-lost"
            ],
            "goto": "report"
          }
        }
      ]
    },
    "damaged-log": {
      "title": "💧 The Damaged Log",
      "tone": "landing",
      "text": "The final pages are soaked. Some words remain visible, but handling the paper may destroy what is left.",
      "resumeText": "The soaked pages remain fragile. Your earlier notes are preserved.",
      "choices": [
        {
          "id": "dry-pages",
          "label": "Separate and dry the pages carefully",
          "emoji": "🌿",
          "success": {
            "text": "You lift the pages apart without tearing them. Enough of the final entry survives to establish that someone ordered the light extinguished.",
            "facts": [
              "watch-final-entry-preserved",
              "watch-light-deliberately-extinguished"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "survival",
            "dc": 14
          },
          "failure": {
            "text": "The softened paper tears beneath its own weight. The final entry is lost, leaving only the fragments you already recorded.",
            "facts": [
              "watch-log-ruined"
            ],
            "goto": "report"
          }
        },
        {
          "id": "read-ink",
          "label": "Read the remaining ink without moving the pages",
          "emoji": "🔎",
          "success": {
            "text": "Holding the book toward the doorway, you make out the remaining words: “I heard the order plainly: put it out.”",
            "facts": [
              "watch-light-deliberately-extinguished",
              "watch-final-entry-read"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "investigation",
            "dc": 14
          },
          "failure": {
            "text": "The ink has spread too far. You cannot confidently distinguish another word.",
            "facts": [
              "watch-partial-entry"
            ],
            "goto": "report"
          }
        },
        {
          "id": "keep-fragments",
          "label": "Keep the fragments you already have",
          "emoji": "📜",
          "outcome": {
            "text": "You stop handling the book and record only what you could read with certainty.",
            "facts": [
              "watch-partial-entry"
            ],
            "goto": "report"
          }
        }
      ]
    },
    "report": {
      "title": "📜 What Remains",
      "tone": "landing",
      "text": "You gather your notes and anything recovered from the Watch. The tower is still dark. It is time to bring your findings back to Wickhaven.",
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
