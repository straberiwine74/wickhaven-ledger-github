// The Brinehook Undercroft — built from Wickhaven-Ledger-Quest-Compendium.md (exact engine fields), November 2, 2026.
// Status 'test': runs only in the staff quest channel until changed to 'live'.

export default {
  "id": "brinehook-undercroft",
  "name": "The Brinehook Undercroft",
  "emoji": "🗝️",
  "status": "test",
  "start": "market-stairs",
  "completion": {
    "milestone": "brinehook-records",
    "first": " First undercroft search recorded (journal only; no AP or gold).",
    "repeat": " Repeat visit recorded. No additional reward."
  },
  "journal": {
      "brinehook-dry-passage": "A raised passage along the wall leads dry into the records vault.",
      "brinehook-linked-index": "Emergency dockets and coastal charts share the same station numbers.",
      "brinehook-northern-route": "Three unclosed shipping entries carry the northern route code.",
      "brinehook-missing-ships": "The Grey Petrel, Mercy Bell, and Northward Star sailed past the northern beacons and never returned.",
      "brinehook-grey-petrel-missing": "The Grey Petrel sailed north and was never recorded as returning.",
      "brinehook-unresolved-voyage": "At least one northern voyage was never closed in the registers.",
      "brinehook-station-two-amendment": "A docket amendment reads “Station Two — service key issued.”",
      "brinehook-relighter-identified": "The harbor records name who relit the Last Light.",
      "brinehook-mara-venn": "Deputy Harbor Keeper Mara Venn relit the Last Light.",
      "brinehook-mara-station-two": "Mara Venn was next sent to Station Two, carrying its service key.",
      "brinehook-survey-reference": "The coastal chart’s missing section matches a loose survey page.",
      "second-beacon-route": "You found the route to the Second Beacon: a tidal path and a higher maintenance ascent past the split headland.",
      "second-beacon-ignition-warning": "A warning about the Second Beacon reads: “Do not attempt repeated ignition.”",
      "brinehook-station-two-named": "The chart marks the Second Beacon, but not a clear way to reach it."
  },
  "scenes": {
    "market-stairs": {
      "title": "🗝️ The Customs Stair",
      "tone": "landing",
      "text": "A short stair descends beneath Brinehook Market. Customs labels hang beside a dry passage, while fallen shelving crowds the vault beyond. Voices and footsteps remain audible overhead.",
      "resumeText": "You return to the customs stair beneath the market.",
      "passive": {
        "skill": "perception",
        "dc": 10,
        "note": "Passive Perception {value} applied to the stair.",
        "success": {
          "text": "The central floor is damp, but a raised passage follows the wall into the records vault.",
          "facts": [
            "brinehook-dry-passage"
          ]
        }
      },
      "choices": [
        {
          "id": "follow-labels",
          "label": "Follow the customs shelf labels",
          "emoji": "🔎",
          "success": {
            "text": "The numbered labels lead you around the fallen shelving to the surviving harbor records.",
            "goto": "records-vault"
          },
          "check": {
            "skill": "investigation",
            "dc": 10
          },
          "failure": {
            "text": "The labels lead to a collapsed aisle. You find a side passage containing loose index pages and a stone sorting table.",
            "goto": "sorting-table"
          }
        },
        {
          "id": "dry-route",
          "label": "Find a clear route along the wall",
          "emoji": "👀",
          "success": {
            "text": "You follow the raised passage into the dry section of the vault.",
            "goto": "records-vault"
          },
          "check": {
            "skill": "perception",
            "dc": 10
          },
          "failure": {
            "text": "A fallen cabinet blocks the passage. A nearby opening leads to the old sorting table instead.",
            "goto": "sorting-table"
          }
        },
        {
          "id": "retreat",
          "label": "Return to the market",
          "emoji": "↩️",
          "outcome": {
            "text": "You climb back to the market. Your search remains unfinished.",
            "goto": "@retreat"
          },
          "style": "secondary"
        }
      ]
    },
    "records-vault": {
      "title": "📚 The Harbor Records",
      "tone": "landing",
      "text": "Three surviving shelves hold shipping registers, emergency maintenance dockets, and coastal charts. A clear aisle connects them to a stone sorting table.",
      "resumeText": "You return to the surviving harbor records.",
      "passive": {
        "skill": "investigation",
        "dc": 11,
        "note": "Passive Investigation {value} applied to the records.",
        "success": {
          "text": "The emergency dockets and coastal charts use the same station numbers. Records from one shelf may explain another.",
          "facts": [
            "brinehook-linked-index"
          ]
        }
      },
      "choices": [
        {
          "id": "shipping",
          "label": "Examine the shipping registers",
          "emoji": "🚢",
          "outcome": {
            "text": "You open the departure and arrival registers.",
            "goto": "shipping-records"
          }
        },
        {
          "id": "maintenance",
          "label": "Examine the emergency dockets",
          "emoji": "🕯️",
          "outcome": {
            "text": "You find a bundle marked “Last Light — emergency restoration.”",
            "goto": "maintenance-records"
          }
        },
        {
          "id": "charts",
          "label": "Examine the coastal charts",
          "emoji": "🗺️",
          "outcome": {
            "text": "You unroll a maintenance chart of the northern coast.",
            "goto": "coastal-chart"
          }
        },
        {
          "id": "sorting",
          "label": "Arrange the loose records at the table",
          "emoji": "🗂️",
          "outcome": {
            "text": "You carry the loose index and survey pages to the sorting table.",
            "goto": "sorting-table"
          }
        },
        {
          "id": "leave",
          "label": "Finish the search",
          "emoji": "📜",
          "outcome": {
            "text": "You gather your notes and return to the market stairs.",
            "goto": "report"
          }
        }
      ]
    },
    "shipping-records": {
      "title": "🚢 Ships Without Returns",
      "tone": "landing",
      "text": "Departure stamps fill the left register. Arrival notices fill the right. Several ship names appear repeatedly in the departures but vanish from later records.",
      "resumeText": "The departure and arrival registers remain open for comparison.",
      "passive": {
        "skill": "investigation",
        "dc": 12,
        "note": "Passive Investigation {value} applied to the shipping records.",
        "success": {
          "text": "Three unclosed entries carry the northern coastal route code.",
          "facts": [
            "brinehook-northern-route"
          ]
        }
      },
      "choices": [
        {
          "id": "compare-entries",
          "label": "Match departures against arrivals",
          "emoji": "🔎",
          "success": {
            "text": "The Grey Petrel, Mercy Bell, and Northward Star have departure stamps but no return entry. All three sailed past the northern beacons.",
            "facts": [
              "brinehook-missing-ships",
              "brinehook-northern-route"
            ],
            "goto": "records-vault"
          },
          "check": {
            "skill": "investigation",
            "dc": 11
          },
          "failure": {
            "text": "Overlapping corrections obscure two entries. You confirm only that the Grey Petrel sailed north and never received an arrival stamp.",
            "facts": [
              "brinehook-grey-petrel-missing"
            ],
            "goto": "sorting-table"
          }
        },
        {
          "id": "read-route-codes",
          "label": "Interpret the old shipping abbreviations",
          "emoji": "📖",
          "success": {
            "text": "The abbreviations distinguish late arrivals from ships formally declared missing. Three northern vessels were declared overdue and never cleared.",
            "facts": [
              "brinehook-missing-ships",
              "brinehook-northern-route"
            ],
            "goto": "records-vault"
          },
          "check": {
            "skill": "history",
            "dc": 12
          },
          "failure": {
            "text": "The older abbreviations do not match the later registers. You identify an unresolved northern voyage but cannot confidently name all the missing ships.",
            "facts": [
              "brinehook-unresolved-voyage"
            ],
            "goto": "sorting-table"
          }
        },
        {
          "id": "back",
          "label": "Leave the registers for now",
          "emoji": "↩️",
          "outcome": {
            "text": "You close the registers without disturbing their order.",
            "goto": "records-vault"
          }
        }
      ]
    },
    "maintenance-records": {
      "title": "🕯️ The Last Light Docket",
      "tone": "landing",
      "text": "A repair docket records the restoration of the Last Light. Amendments have been folded into the binding, hiding part of the keeper’s name and subsequent orders.",
      "resumeText": "The Last Light docket remains available for examination.",
      "passive": {
        "skill": "perception",
        "dc": 11,
        "note": "Passive Perception {value} applied to the maintenance docket.",
        "success": {
          "text": "A folded amendment bears the heading “Station Two — service key issued.”",
          "facts": [
            "brinehook-station-two-amendment"
          ]
        }
      },
      "choices": [
        {
          "id": "unfold-docket",
          "label": "Separate and follow the docket amendments",
          "emoji": "🔎",
          "success": {
            "text": "Deputy Harbor Keeper Mara Venn relit the Last Light. Her next order sent her to Station Two carrying its service key.",
            "facts": [
              "brinehook-relighter-identified",
              "brinehook-mara-venn",
              "brinehook-mara-station-two"
            ],
            "goto": "records-vault"
          },
          "check": {
            "skill": "investigation",
            "dc": 12
          },
          "failure": {
            "text": "You recover “Mara Venn” beside “light restored,” but the next assignment remains trapped inside a fragile fold.",
            "facts": [
              "brinehook-mara-venn"
            ],
            "goto": "sorting-table"
          }
        },
        {
          "id": "trace-offices",
          "label": "Follow the harbor offices and signatures",
          "emoji": "📖",
          "success": {
            "text": "The deputy keeper’s signature identifies Mara Venn. A matching signature acknowledges receipt of the Second Beacon’s service key.",
            "facts": [
              "brinehook-relighter-identified",
              "brinehook-mara-venn",
              "brinehook-mara-station-two"
            ],
            "goto": "records-vault"
          },
          "check": {
            "skill": "history",
            "dc": 12
          },
          "failure": {
            "text": "You identify Mara Venn’s name, but cannot distinguish a direct order from a later clerk’s annotation.",
            "facts": [
              "brinehook-mara-venn"
            ],
            "goto": "sorting-table"
          }
        },
        {
          "id": "back",
          "label": "Leave the docket for now",
          "emoji": "↩️",
          "outcome": {
            "text": "You return the docket to its protective wrapper.",
            "goto": "records-vault"
          }
        }
      ]
    },
    "coastal-chart": {
      "title": "🗺️ The Coastal Chart",
      "tone": "landing",
      "text": "The chart marks the Last Light and another beacon beyond a split headland. Damage obscures part of the maintenance approach. A warning has been added beside Station Two.",
      "resumeText": "The coastal chart remains open beside its loose survey sheets.",
      "passive": {
        "skill": "investigation",
        "dc": 12,
        "note": "Passive Investigation {value} applied to the coastal chart.",
        "success": {
          "text": "The missing route section has a survey reference matching one of the loose pages.",
          "facts": [
            "brinehook-survey-reference"
          ]
        }
      },
      "choices": [
        {
          "id": "read-terrain",
          "label": "Reconstruct the approach from the terrain",
          "emoji": "🌊",
          "success": {
            "text": "You identify a tidal path and a higher maintenance ascent beyond the split headland. The warning reads: “Do not attempt repeated ignition.”",
            "facts": [
              "second-beacon-route",
              "second-beacon-ignition-warning"
            ],
            "goto": "records-vault"
          },
          "check": {
            "skill": "survival",
            "dc": 12
          },
          "failure": {
            "text": "You locate the Second Beacon, but cannot determine which marked line is a usable approach.",
            "facts": [
              "brinehook-station-two-named"
            ],
            "goto": "sorting-table"
          }
        },
        {
          "id": "match-survey",
          "label": "Match the chart to its survey references",
          "emoji": "🔎",
          "success": {
            "text": "The numbered references restore the missing approach. You copy both access routes and the warning against repeated ignition.",
            "facts": [
              "second-beacon-route",
              "second-beacon-ignition-warning"
            ],
            "goto": "records-vault"
          },
          "check": {
            "skill": "investigation",
            "dc": 12
          },
          "failure": {
            "text": "Two survey references overlap the damaged section. You will need to arrange the loose pages to establish the route.",
            "facts": [
              "brinehook-station-two-named"
            ],
            "goto": "sorting-table"
          }
        },
        {
          "id": "back",
          "label": "Leave the chart for now",
          "emoji": "↩️",
          "outcome": {
            "text": "You roll the chart loosely and return it to the shelf.",
            "goto": "records-vault"
          }
        }
      ]
    },
    "sorting-table": {
      "title": "🗂️ The Sorting Table",
      "tone": "landing",
      "text": "The stone table offers enough space to arrange the loose pages without damaging them. Careful work can recover information that a quick search missed.",
      "resumeText": "The loose records remain ready for sorting.",
      "choices": [
        {
          "id": "sort-ships",
          "label": "Reconstruct the shipping entries",
          "emoji": "🚢",
          "outcome": {
            "text": "Careful sorting confirms three missing ships: the Grey Petrel, Mercy Bell, and Northward Star. All sailed the northern beacon route.",
            "facts": [
              "brinehook-missing-ships",
              "brinehook-northern-route"
            ]
          },
          "once": true
        },
        {
          "id": "sort-docket",
          "label": "Reconstruct the Last Light docket",
          "emoji": "🕯️",
          "outcome": {
            "text": "The complete docket identifies Deputy Harbor Keeper Mara Venn as the Last Light’s relighter. She later departed for Station Two with its service key.",
            "facts": [
              "brinehook-relighter-identified",
              "brinehook-mara-venn",
              "brinehook-mara-station-two"
            ]
          },
          "once": true
        },
        {
          "id": "sort-chart",
          "label": "Reconstruct the Second Beacon approach",
          "emoji": "🗺️",
          "outcome": {
            "text": "The survey pages reveal the tidal path and higher ascent beyond the split headland. The maintenance warning forbids repeated ignition attempts.",
            "facts": [
              "second-beacon-route",
              "second-beacon-ignition-warning"
            ]
          },
          "once": true
        },
        {
          "id": "vault",
          "label": "Return to the shelves",
          "emoji": "📚",
          "outcome": {
            "text": "You leave the sorted pages together and return to the shelves.",
            "goto": "records-vault"
          }
        },
        {
          "id": "leave",
          "label": "Finish searching",
          "emoji": "📜",
          "outcome": {
            "text": "You gather your notes and return to the stairs.",
            "goto": "report"
          }
        }
      ]
    },
    "report": {
      "title": "📜 Back Beneath the Market",
      "tone": "landing",
      "text": "You gather your notes at the foot of the market stairs. The sounds of Wickhaven carry down from above.",
      "resumeText": "Your undercroft discoveries are ready to record.",
      "choices": [
        {
          "id": "finish",
          "label": "Record findings and complete the search",
          "emoji": "📜",
          "outcome": {
            "text": "You return to the market and enter your harbor discoveries in the Ledger.",
            "goto": "@complete"
          },
          "style": "success"
        },
        {
          "id": "retreat",
          "label": "Leave the search unfinished",
          "emoji": "↩️",
          "outcome": {
            "text": "Your discoveries remain saved, but the search is unfinished.",
            "goto": "@retreat"
          },
          "style": "secondary"
        }
      ]
    }
  }
};
