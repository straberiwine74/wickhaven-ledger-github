// The Second Beacon — built from Wickhaven-Ledger-Quest-Compendium.md (exact engine fields), November 2, 2026.
// Status 'test': runs only in the staff quest channel until changed to 'live'.
// Locked until anyone on the server has the discovery second-beacon-route (Brinehook Undercroft).

export default {
  "id": "second-beacon",
  "name": "The Second Beacon",
  "emoji": "🔥",
  "status": "live",
  "start": "split-headland",
  "requires": {
    "facts": ["second-beacon-route"],
    "scope": "server",
    "hint": "Someone must first find the maintenance route to Station Two in the Brinehook Undercroft."
  },
  "completion": {
    "milestone": "second-beacon-survey",
    "ap": 1,
    "first": " First Second Beacon expedition recorded (journal only; no AP or gold).",
    "repeat": " Repeat visit recorded. No additional reward."
  },
  "journal": {
      "second-beacon-wave-pattern": "Waves at the split headland come in groups; the low approach clears between them.",
      "second-beacon-climbing-fall": "You fell on the high ascent at the split headland.",
      "second-beacon-loose-ladder": "The shelf ladder’s upper brackets are pulling out of the stone.",
      "second-beacon-approach-blocked": "The ladder approach was unsafe; you turned back.",
      "second-beacon-jammed-weight": "The service door is unlocked, held shut by a jammed counterweight.",
      "second-beacon-hatch-brace": "An iron brace inside the inspection hatch offers a safe hold.",
      "second-beacon-hatch-fall": "You fell at the inspection hatch.",
      "second-beacon-deliberate-removal": "A part was deliberately unbolted from the beacon’s cradle and removed.",
      "second-beacon-missing-prism": "The missing part is a returning prism that directed the flame into the lens.",
      "second-beacon-alignment-link": "The returning prism linked this beacon to the others.",
      "second-beacon-empty-cradle": "The beacon’s light path breaks at an empty fitting.",
      "second-beacon-mara-note": "Mara Venn’s note: the prism was gone before she arrived; a replacement must match the first beacon’s alignment.",
      "second-beacon-ignition-warning": "Forcing ignition vents fire through the service chamber.",
      "second-beacon-further-survey-needed": "The empty cradle needs further inspection.",
      "second-beacon-network-confirmed": "For a heartbeat the beam pointed at the Last Light: the beacons were once a coastal network.",
      "beacon-restoration-goal": "Relighting the Second Beacon needs its prism replaced and aligned with the Last Light.",
      "second-beacon-test-flare": "A test flash showed the light path can’t work until the prism is replaced.",
      "second-beacon-burner-working": "The Second Beacon’s fuel and burner still work.",
      "second-beacon-heat-burst": "Testing the burner caused a dangerous heat burst. Further attempts are unsafe.",
      "second-beacon-two-part-specification": "The cradle marks record both the prism’s size and its alignment toward the Last Light.",
      "second-beacon-repair-specifications": "You recorded a full specification for a replacement prism.",
      "second-beacon-specialist-needed": "A specialist must survey the prism fitting’s alignment."
  },
  "scenes": {
    "split-headland": {
      "title": "🌊 The Split Headland",
      "tone": "shore",
      "text": "The Second Beacon rises beyond a cleft in the headland. The maintenance chart marks a tidal path below the cliffs and an older ascent above it. Spray reaches both.",
      "resumeText": "You return to the split headland with the maintenance route recorded in your journal.",
      "passive": {
        "skill": "perception",
        "dc": 14,
        "note": "Passive Perception {value} applied to the headland.",
        "success": {
          "text": "The largest waves strike in groups. Between them, the lower approach briefly clears.",
          "facts": [
            "second-beacon-wave-pattern"
          ]
        }
      },
      "choices": [
        {
          "id": "tidal-path",
          "label": "Time the crossing below the cliffs",
          "emoji": "🌊",
          "success": {
            "text": "You cross between the larger waves and reach the service landing.",
            "goto": "service-door"
          },
          "check": {
            "skill": "survival",
            "dc": 15
          },
          "failure": {
            "text": "A surge closes the final stretch. You retreat onto a sheltered shelf beneath the beacon.",
            "goto": "sheltered-shelf"
          }
        },
        {
          "id": "high-ascent",
          "label": "Climb the maintenance ascent",
          "emoji": "🧗",
          "success": {
            "text": "You climb above the cleft and descend onto the service landing.",
            "goto": "service-door"
          },
          "check": {
            "skill": "athletics",
            "dc": 16
          },
          "failure": {
            "text": "A handhold breaks. You slide onto a lower shelf, bruised but clear of the waves.",
            "facts": [
              "second-beacon-climbing-fall"
            ],
            "goto": "sheltered-shelf"
          }
        },
        {
          "id": "retreat",
          "label": "Return to Wickhaven",
          "emoji": "↩️",
          "outcome": {
            "text": "You withdraw before attempting the headland. Your expedition remains unfinished.",
            "goto": "@retreat"
          },
          "style": "secondary"
        }
      ]
    },
    "sheltered-shelf": {
      "title": "🪨 The Sheltered Shelf",
      "tone": "shore",
      "text": "The cliff shelters this narrow shelf from the worst of the surf. An old maintenance ladder rises toward the service landing. The lower path should clear again when the tide falls.",
      "resumeText": "You remain on the sheltered shelf below the beacon.",
      "passive": {
        "skill": "perception",
        "dc": 13,
        "note": "Passive Perception {value} applied to the sheltered shelf.",
        "success": {
          "text": "The ladder’s lower rungs are sound, but its upper brackets have pulled partly out of the stone.",
          "facts": [
            "second-beacon-loose-ladder"
          ]
        }
      },
      "choices": [
        {
          "id": "ladder",
          "label": "Climb the ladder carefully",
          "emoji": "💪",
          "success": {
            "text": "You keep your weight close to the wall and climb onto the service landing.",
            "goto": "service-door"
          },
          "check": {
            "skill": "athletics",
            "dc": 14
          },
          "failure": {
            "text": "The upper brackets shift. You climb down before they tear free and wait for a safe route home.",
            "facts": [
              "second-beacon-approach-blocked"
            ],
            "goto": "@retreat"
          },
          "style": "secondary"
        },
        {
          "id": "wave-window",
          "label": "Find another opening between the waves",
          "emoji": "🌊",
          "success": {
            "text": "You recognize a longer lull and cross the remaining ledge before the next surge.",
            "goto": "service-door"
          },
          "check": {
            "skill": "survival",
            "dc": 16
          },
          "failure": {
            "text": "The lull closes before you can move. You remain sheltered until the tide falls, then return to Wickhaven.",
            "facts": [
              "second-beacon-approach-blocked"
            ],
            "goto": "@retreat"
          },
          "style": "secondary"
        },
        {
          "id": "withdraw",
          "label": "Wait for the ebb and withdraw",
          "emoji": "↩️",
          "outcome": {
            "text": "You wait until the lower path clears, then return safely. The expedition remains unfinished.",
            "goto": "@retreat"
          },
          "style": "secondary"
        }
      ]
    },
    "service-door": {
      "title": "🚪 The Service Entrance",
      "tone": "landing",
      "text": "A counterweighted door closes the entrance. Its handle moves, but the door does not. An inspection hatch stands above the lintel.",
      "resumeText": "You return to the jammed service entrance.",
      "passive": {
        "skill": "investigation",
        "dc": 14,
        "note": "Passive Investigation {value} applied to the entrance.",
        "success": {
          "text": "The lock is open. A jammed counterweight holds the door shut.",
          "facts": [
            "second-beacon-jammed-weight"
          ]
        }
      },
      "choices": [
        {
          "id": "release-weight",
          "label": "Work out the counterweight release",
          "emoji": "🔎",
          "success": {
            "text": "You release the jammed catch. The weight rises and the door opens.",
            "goto": "service-chamber"
          },
          "check": {
            "skill": "investigation",
            "dc": 14
          },
          "failure": {
            "text": "The catch shifts but locks again. The inspection hatch remains accessible.",
            "goto": "inspection-hatch"
          }
        },
        {
          "id": "lift-door",
          "label": "Lift the door against its jammed weight",
          "emoji": "💪",
          "success": {
            "text": "You raise the door far enough to slip beneath it and release the mechanism from inside.",
            "goto": "service-chamber"
          },
          "check": {
            "skill": "athletics",
            "dc": 16
          },
          "failure": {
            "text": "The door rises an inch and drops back into its frame. You pull clear before it catches your hands.",
            "goto": "inspection-hatch"
          }
        },
        {
          "id": "withdraw",
          "label": "Leave the entrance for another expedition",
          "emoji": "↩️",
          "outcome": {
            "text": "You record the blocked entrance and return by the maintenance route.",
            "goto": "@retreat"
          },
          "style": "secondary"
        }
      ]
    },
    "inspection-hatch": {
      "title": "🪜 The Inspection Hatch",
      "tone": "landing",
      "text": "The hatch opens above the jammed door. Its frame is narrow, and the footholds beneath it have worn smooth.",
      "resumeText": "The inspection hatch remains the available entrance.",
      "passive": {
        "skill": "perception",
        "dc": 14,
        "note": "Passive Perception {value} applied to the inspection hatch.",
        "success": {
          "text": "A firm iron brace sits inside the hatch, within reach once you lift its cover.",
          "facts": [
            "second-beacon-hatch-brace"
          ]
        }
      },
      "choices": [
        {
          "id": "squeeze-through",
          "label": "Balance on the footholds and squeeze through",
          "emoji": "🤸",
          "success": {
            "text": "You work through the opening and lower yourself into the service chamber.",
            "goto": "service-chamber"
          },
          "check": {
            "skill": "acrobatics",
            "dc": 15
          },
          "failure": {
            "text": "Your foot slips as the frame shifts. You drop onto the landing, painfully bruised, and withdraw before another fall.",
            "facts": [
              "second-beacon-hatch-fall"
            ],
            "goto": "@retreat"
          },
          "style": "secondary"
        },
        {
          "id": "pull-through",
          "label": "Pull yourself through using the inner brace",
          "emoji": "💪",
          "success": {
            "text": "You grip the brace and haul yourself through, then release the main door from inside.",
            "goto": "service-chamber"
          },
          "check": {
            "skill": "athletics",
            "dc": 15
          },
          "failure": {
            "text": "The brace holds, but the outer frame gives beneath your knee. You scramble back onto the landing and abandon the entrance.",
            "facts": [
              "second-beacon-hatch-fall"
            ],
            "goto": "@retreat"
          },
          "style": "secondary"
        },
        {
          "id": "withdraw",
          "label": "Return to Wickhaven",
          "emoji": "↩️",
          "outcome": {
            "text": "You secure the loose hatch cover and leave the expedition unfinished.",
            "goto": "@retreat"
          },
          "style": "secondary"
        }
      ]
    },
    "service-chamber": {
      "title": "⚙️ The Service Chamber",
      "tone": "landing",
      "text": "Fuel lines rise toward the burner. The great lens remains intact overhead. Between them, a brass cradle stands empty. A notebook rests beside the emergency shutoff.",
      "resumeText": "You return to the machinery. The empty cradle remains between the burner and the lens.",
      "passive": {
        "skill": "investigation",
        "dc": 14,
        "note": "Passive Investigation {value} applied to the machinery.",
        "success": {
          "text": "Clean tool marks surround the empty cradle. Something was deliberately unbolted and removed.",
          "facts": [
            "second-beacon-deliberate-removal"
          ]
        }
      },
      "choices": [
        {
          "id": "trace-light",
          "label": "Trace the assembly’s magical light path",
          "emoji": "✨",
          "success": {
            "text": "The light path breaks at the empty cradle. A returning prism once directed the flame into the lens and linked it to the other beacons.",
            "facts": [
              "second-beacon-missing-prism",
              "second-beacon-alignment-link"
            ],
            "goto": "ignition-platform"
          },
          "check": {
            "skill": "arcana",
            "dc": 15
          },
          "failure": {
            "text": "The light path folds back on itself around the empty fitting. You cannot establish what component is missing.",
            "facts": [
              "second-beacon-empty-cradle"
            ],
            "goto": "service-plate"
          }
        },
        {
          "id": "compare-diagram",
          "label": "Compare the machinery with its etched diagram",
          "emoji": "🔎",
          "success": {
            "text": "The diagram labels the missing component “returning prism.” Its retaining bolts were removed rather than broken.",
            "facts": [
              "second-beacon-missing-prism",
              "second-beacon-deliberate-removal"
            ],
            "goto": "ignition-platform"
          },
          "check": {
            "skill": "investigation",
            "dc": 15
          },
          "failure": {
            "text": "Several repairs overlap the original diagram. You identify the empty fitting as a fault but cannot confidently name its missing part.",
            "facts": [
              "second-beacon-empty-cradle"
            ],
            "goto": "service-plate"
          }
        },
        {
          "id": "notebook",
          "label": "Read the service notebook",
          "emoji": "📖",
          "success": {
            "text": "Mara Venn wrote: “Prism removed before my arrival. Forced ignition vents through the service chamber. Replacement must match the first beacon’s alignment.”",
            "facts": [
              "second-beacon-mara-note",
              "second-beacon-missing-prism",
              "second-beacon-alignment-link",
              "second-beacon-ignition-warning"
            ],
            "goto": "ignition-platform"
          },
          "check": {
            "skill": "investigation",
            "dc": 14
          },
          "failure": {
            "text": "Salt has sealed the pages together. The cover still reads: “DO NOT FORCE IGNITION.”",
            "facts": [
              "second-beacon-ignition-warning"
            ],
            "goto": "service-plate"
          }
        },
        {
          "id": "withdraw",
          "label": "Leave the machinery untouched and report",
          "emoji": "↩️",
          "outcome": {
            "text": "You record the empty fitting and leave without operating the machinery.",
            "facts": [
              "second-beacon-empty-cradle"
            ],
            "goto": "report"
          }
        }
      ]
    },
    "service-plate": {
      "title": "🔍 The Corroded Service Plate",
      "tone": "landing",
      "text": "A small brass plate sits beneath the empty cradle. Corrosion covers most of its lettering. Cleaning it may explain the missing component without operating the machinery.",
      "resumeText": "The corroded plate remains beneath the cradle.",
      "choices": [
        {
          "id": "clean-plate",
          "label": "Patiently clean the service plate",
          "emoji": "🧽",
          "outcome": {
            "text": "The lettering emerges: “RETURNING PRISM — align to Station One before ignition.” The missing component explains why the beacon cannot light.",
            "facts": [
              "second-beacon-missing-prism",
              "second-beacon-alignment-link"
            ],
            "goto": "repair-survey"
          }
        },
        {
          "id": "read-impressions",
          "label": "Read the lettering through the corrosion",
          "emoji": "🔎",
          "success": {
            "text": "You recover the part name and a warning: “Returning prism. Do not ignite without correct alignment.”",
            "facts": [
              "second-beacon-missing-prism",
              "second-beacon-ignition-warning"
            ],
            "goto": "ignition-platform"
          },
          "check": {
            "skill": "investigation",
            "dc": 14
          },
          "failure": {
            "text": "The raised corrosion obscures too many letters. You can clean the plate or leave with an incomplete diagnosis.",
            "goto": "plate-decision"
          }
        },
        {
          "id": "withdraw",
          "label": "Return with the incomplete diagnosis",
          "emoji": "↩️",
          "outcome": {
            "text": "You record the empty cradle and the need for further inspection.",
            "facts": [
              "second-beacon-further-survey-needed"
            ],
            "goto": "report"
          }
        }
      ]
    },
    "plate-decision": {
      "title": "🧽 A Slower Examination",
      "tone": "landing",
      "text": "The plate cannot be read in its present condition. Cleaning it carefully will take time but poses no danger.",
      "resumeText": "The plate still needs cleaning.",
      "choices": [
        {
          "id": "clean",
          "label": "Take the time to clean it",
          "emoji": "🧽",
          "outcome": {
            "text": "You uncover: “RETURNING PRISM — align to Station One before ignition.”",
            "facts": [
              "second-beacon-missing-prism",
              "second-beacon-alignment-link"
            ],
            "goto": "repair-survey"
          }
        },
        {
          "id": "leave",
          "label": "Leave further examination for another expedition",
          "emoji": "↩️",
          "outcome": {
            "text": "You record the unreadable plate and empty fitting before leaving.",
            "facts": [
              "second-beacon-further-survey-needed"
            ],
            "goto": "report"
          }
        }
      ]
    },
    "ignition-platform": {
      "title": "🔆 The Ignition Platform",
      "tone": "landing",
      "text": "An inspection lamp hangs beside the burner controls. The diagram shows its beam passing through the missing prism before reaching the great lens. The emergency valve sits within reach.",
      "resumeText": "You return to the ignition platform. The prism has not been replaced.",
      "passive": {
        "skill": "arcana",
        "dc": 15,
        "note": "Passive Arcana {value} applied to the ignition platform.",
        "success": {
          "text": "The missing prism directed light between the beacons as well as through this tower’s lens.",
          "facts": [
            "second-beacon-alignment-link"
          ]
        }
      },
      "choices": [
        {
          "id": "lamp-test",
          "label": "Direct the inspection lamp through the cradle",
          "emoji": "✨",
          "success": {
            "text": "The beam scatters at the empty fitting. For a heartbeat, a pale line points toward the Last Light. The prism connected this tower to a coastal network.",
            "facts": [
              "second-beacon-network-confirmed",
              "beacon-restoration-goal"
            ],
            "goto": "repair-survey"
          },
          "check": {
            "skill": "arcana",
            "dc": 16
          },
          "failure": {
            "text": "Light flashes back through the fitting, leaving you dazzled. You shutter the lamp. The missing prism must be replaced before this light path can function.",
            "facts": [
              "second-beacon-test-flare",
              "second-beacon-missing-prism"
            ],
            "goto": "test-aftermath"
          }
        },
        {
          "id": "burner-test",
          "label": "Briefly test the burner with the shutoff ready",
          "emoji": "⚙️",
          "success": {
            "text": "The burner catches cleanly, but no light reaches the lens. You close the feed. Fuel and ignition work; the absent prism prevents relighting.",
            "facts": [
              "second-beacon-burner-working",
              "second-beacon-missing-prism",
              "beacon-restoration-goal"
            ],
            "goto": "repair-survey"
          },
          "check": {
            "skill": "investigation",
            "dc": 16
          },
          "failure": {
            "text": "Pressure throws the shutter open. Heat bursts across the platform before you strike the shutoff. Further ignition attempts would be unsafe.",
            "facts": [
              "second-beacon-heat-burst"
            ],
            "goto": "test-aftermath"
          }
        },
        {
          "id": "skip-test",
          "label": "Skip the test and measure the empty fitting",
          "emoji": "📐",
          "outcome": {
            "text": "You leave the fuel shut off and begin examining the cradle’s dimensions.",
            "goto": "repair-survey"
          }
        },
        {
          "id": "leave",
          "label": "Return with the diagnosis",
          "emoji": "↩️",
          "outcome": {
            "text": "You record the missing returning prism and leave the beacon shut down.",
            "facts": [
              "second-beacon-missing-prism",
              "beacon-restoration-goal"
            ],
            "goto": "report"
          }
        }
      ]
    },
    "test-aftermath": {
      "title": "🛑 After the Failed Test",
      "tone": "landing",
      "text": "The fuel valve is closed and the inspection lamp is shuttered. The machinery settles into silence. You can finish documenting the cradle without another ignition attempt.",
      "resumeText": "The machinery remains shut down after the failed test.",
      "choices": [
        {
          "id": "survey",
          "label": "Continue with a non-operating survey",
          "emoji": "📐",
          "outcome": {
            "text": "You leave the controls alone and turn to the prism’s empty fitting.",
            "goto": "repair-survey"
          }
        },
        {
          "id": "withdraw",
          "label": "Secure the chamber and return",
          "emoji": "↩️",
          "outcome": {
            "text": "You check the shutoff, close the service chamber, and return with the missing prism recorded.",
            "facts": [
              "second-beacon-missing-prism",
              "beacon-restoration-goal"
            ],
            "goto": "report"
          }
        }
      ]
    },
    "repair-survey": {
      "title": "📐 The Empty Cradle",
      "tone": "landing",
      "text": "The cradle bears fine alignment marks and the words “RETURNING PRISM.” Its dimensions could guide a search for the original or the making of a replacement.",
      "resumeText": "You return to the prism’s empty fitting and alignment marks.",
      "passive": {
        "skill": "investigation",
        "dc": 15,
        "note": "Passive Investigation {value} applied to the repair survey.",
        "success": {
          "text": "One set of marks gives the physical dimensions. A second set records alignment toward the Last Light.",
          "facts": [
            "second-beacon-two-part-specification"
          ]
        }
      },
      "choices": [
        {
          "id": "technical-survey",
          "label": "Copy the dimensions, fittings, and alignment marks",
          "emoji": "✍️",
          "success": {
            "text": "You record a complete specification. Wickhaven can seek the original prism or commission a replacement matched to the cradle.",
            "facts": [
              "second-beacon-repair-specifications",
              "beacon-restoration-goal"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "investigation",
            "dc": 14
          },
          "failure": {
            "text": "You recover the part’s name and rough dimensions, but the fine alignment marks defeat you. A specialist must survey the fitting.",
            "facts": [
              "second-beacon-specialist-needed",
              "beacon-restoration-goal"
            ],
            "goto": "report"
          }
        },
        {
          "id": "arcane-survey",
          "label": "Record how the prism must direct the light",
          "emoji": "✨",
          "success": {
            "text": "You map the prism’s alignment toward the Last Light and copy its fitting dimensions. The notes provide a workable restoration specification.",
            "facts": [
              "second-beacon-repair-specifications",
              "second-beacon-alignment-link",
              "beacon-restoration-goal"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "arcana",
            "dc": 14
          },
          "failure": {
            "text": "You establish that the prism links the two beacons, but cannot reproduce its exact alignment. A specialist will need to return.",
            "facts": [
              "second-beacon-alignment-link",
              "second-beacon-specialist-needed",
              "beacon-restoration-goal"
            ],
            "goto": "report"
          }
        },
        {
          "id": "basic-record",
          "label": "Record the part name and return",
          "emoji": "📜",
          "outcome": {
            "text": "You record “returning prism,” the empty fitting, and the need for an alignment survey. Wickhaven now has a concrete repair goal.",
            "facts": [
              "second-beacon-missing-prism",
              "second-beacon-specialist-needed",
              "beacon-restoration-goal"
            ],
            "goto": "report"
          }
        }
      ]
    },
    "report": {
      "title": "📜 The Dark Beacon",
      "tone": "landing",
      "text": "The Second Beacon remains dark. You secure your discoveries before returning to Wickhaven. Any confirmed fault or recovered specification gives the town a place to begin.",
      "resumeText": "Your beacon discoveries are ready to record.",
      "choices": [
        {
          "id": "finish",
          "label": "Record findings and complete the expedition",
          "emoji": "📜",
          "outcome": {
            "text": "You return to Wickhaven and enter your Second Beacon discoveries in the Ledger. This expedition is complete.",
            "goto": "@complete"
          },
          "style": "success"
        },
        {
          "id": "retreat",
          "label": "Leave the expedition unfinished",
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
