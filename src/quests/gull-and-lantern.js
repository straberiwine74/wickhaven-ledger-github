// Death at the Gull & Lantern — Sam's quest, converted from his gvar.
// Converted November 18, 2026. Status 'test': runs only in the staff quest channel until changed to 'live'.
// Each rolled choice has success/failure results; guaranteed choices use outcome.
// goto names the next scene. Omit goto to remain in the current scene.
// @complete finishes the run; @retreat leaves it unfinished.

export default {
  "id": "gull-and-lantern",
  "name": "Death at the Gull & Lantern",
  "emoji": "🕯️",
  "status": "test",
  "start": "common-room",
  "completion": {
    "milestone": "gull-and-lantern-solved",
    "ap": 1,
    "first": " First investigation at the Gull & Lantern recorded.",
    "repeat": " Repeat visit recorded. No additional reward."
  },
  "journal": {
    "murder-victim": "Aldous Pell, Wickhaven’s harbour toll-keeper, was found dead in his locked counting room at the Gull & Lantern.",
    "murder-relief": "When the body was mentioned, one person in the common room looked relieved rather than shocked.",
    "body-no-wound": "Pell has no wound. His lips are stained, and a posset cup by his hand holds bitter-smelling dregs.",
    "body-pillow": "Feathers are caught in Pell’s beard, and a cushion lies on the floor, not on his chair.",
    "body-time": "Pell’s candle burned down to the third bell. He was alive and writing until then.",
    "room-ledger-torn": "A page has been cut from Pell’s toll ledger. The pages either side list receipts from the Gull & Lantern.",
    "room-draft-letter": "A half-written letter to the harbour reeve: “I have proof of forged receipts, and will bring it at dawn.”",
    "room-key-pocket": "Pell’s own key was still in his waistcoat pocket. The door was locked from outside.",
    "room-lock-scratched": "The lock shows fresh scratches from a worn brass key, not a pick.",
    "hester-heir": "Hester Pell, the victim’s niece, inherits his house.",
    "hester-alibi": "Hester sat up all night with the cook, nursing a scalded hand. The cook confirms it.",
    "hester-argument": "Hester admits she and her uncle quarrelled about money at supper.",
    "rook-debt": "Captain Rook owed Pell forty crowns in unpaid tolls and threatened him publicly.",
    "rook-asleep": "Captain Rook passed out drunk in the common room at the ninth bell. Three drinkers swear he never moved.",
    "rook-saw-wenna": "Rook woke once, near the third bell, and saw Wenna on the stairs with a candle and a cup.",
    "wenna-nervous": "Wenna Tull, the innkeeper, insists she went to bed early. She would not look at the stairs while she said it.",
    "wenna-lie": "Wenna claims she never makes Pell’s posset. The cook says she always does.",
    "kitchen-posset-pan": "The posset pan in the kitchen has been scrubbed, but a stoppered blue bottle of sleeping draught is hidden behind the flour bins.",
    "kitchen-receipts": "In the kitchen fire, half-burnt: harbour toll receipts, all made out to the Gull & Lantern, all with forged seals.",
    "wenna-keys": "Wenna’s key ring holds two keys to the counting room. The second is worn brass.",
    "accused-wenna-confessed": "Faced with the evidence, Wenna Tull confessed to the murder of Aldous Pell.",
    "accused-wenna-denied": "You accused Wenna Tull, but she denied it and your case would not hold. She remains under suspicion.",
    "accused-hester-wrong": "You accused Hester Pell. The cook’s testimony cleared her at once.",
    "accused-rook-wrong": "You accused Captain Rook. A room full of witnesses swore he never left his bench.",
    "accused-none": "You left the Gull & Lantern without naming the killer."
  },
  "scenes": {
    "common-room": {
      "title": "🍺 The Common Room",
      "tone": "landing",
      "text": "Rain hammers the shutters of the Gull & Lantern. Upstairs, the harbour toll-keeper Aldous Pell lies dead in his locked counting room. The watch will not arrive until the tide turns, so the innkeeper has asked you to look into it. Three faces in the room matter: Pell’s niece Hester, a sea captain called Rook, and Wenna Tull, the innkeeper herself.",
      "resumeText": "You return to the common room. The rain has not eased, and no one has left.",
      "passive": {
        "skill": "insight",
        "dc": 13,
        "note": "Passive Insight {value} applied to the common room.",
        "success": {
          "text": "When someone mentions the body, everyone flinches except one, who looks briefly and unmistakably relieved. You don’t catch who before the moment passes.",
          "facts": [
            "murder-victim",
            "murder-relief"
          ]
        }
      },
      "choices": [
        {
          "id": "counting-room",
          "label": "Examine the counting room",
          "emoji": "🚪",
          "outcome": {
            "text": "Wenna hands you a key and stays at the foot of the stairs. You go up alone.",
            "facts": [
              "murder-victim"
            ],
            "goto": "counting-room"
          }
        },
        {
          "id": "suspects",
          "label": "Question the people in the inn",
          "emoji": "🗣️",
          "outcome": {
            "text": "You pull a chair to the fire and begin.",
            "facts": [
              "murder-victim"
            ],
            "goto": "suspects"
          }
        },
        {
          "id": "retreat",
          "label": "Leave it for the watch",
          "emoji": "↩️",
          "outcome": {
            "text": "You decline and step back out into the rain. No roll or rest. Your expedition and supplies remain locked.",
            "goto": "@retreat"
          },
          "style": "secondary"
        }
      ]
    },
    "counting-room": {
      "title": "🗝️ The Counting Room",
      "tone": "landing",
      "text": "Aldous Pell sits slumped at his desk, a quill still in his fingers. A posset cup stands by his hand and a candle has burned to a stub. The toll ledger lies open. The door had been locked; the window is shuttered and barred from within.",
      "resumeText": "You return to the counting room. Pell has not been moved.",
      "passive": {
        "skill": "investigation",
        "dc": 12,
        "note": "Passive Investigation {value} applied to the counting room.",
        "success": {
          "text": "Pell’s own key is still in his waistcoat pocket. The door was locked from outside, by someone with a key of their own.",
          "facts": [
            "room-key-pocket"
          ]
        }
      },
      "choices": [
        {
          "id": "body",
          "label": "Examine the body",
          "emoji": "🩺",
          "success": {
            "text": "There is no wound. His lips are stained and the dregs in his cup smell bitter. But there are feathers caught in his beard, and the cushion from his chair lies on the floor. The draught made him sleep; something else made sure he didn’t wake. The candle tells you he was writing until about the third bell.",
            "facts": [
              "body-no-wound",
              "body-pillow",
              "body-time"
            ]
          },
          "check": {
            "skill": "medicine",
            "dc": 13
          },
          "failure": {
            "text": "There is no wound that you can find, and the cup by his hand smells bitter. Beyond that, you can’t say how he died.",
            "facts": [
              "body-no-wound"
            ]
          },
          "once": true
        },
        {
          "id": "desk",
          "label": "Search the desk and ledger",
          "emoji": "📒",
          "success": {
            "text": "A page has been neatly cut from the toll ledger. The pages either side are all receipts from the Gull & Lantern. Beneath the blotter you find a half-written letter to the harbour reeve: “I have proof of forged receipts, and will bring it at dawn.”",
            "facts": [
              "room-ledger-torn",
              "room-draft-letter"
            ]
          },
          "check": {
            "skill": "investigation",
            "dc": 13
          },
          "failure": {
            "text": "You notice a page cut from the ledger, but the rest of the desk is a sea of tide tables and toll slips.",
            "facts": [
              "room-ledger-torn"
            ]
          },
          "once": true
        },
        {
          "id": "lock",
          "label": "Study the door and lock",
          "emoji": "🔐",
          "success": {
            "text": "Fresh bright scratches circle the keyhole, the kind a worn brass key leaves when used in a hurry. Not a pick. Someone had a key.",
            "facts": [
              "room-lock-scratched"
            ]
          },
          "check": {
            "skill": "sleightOfHand",
            "dc": 12
          },
          "failure": {
            "text": "The lock is old and heavily scratched. If anyone forced it, you can’t tell."
          },
          "once": true
        },
        {
          "id": "suspects",
          "label": "Go down and question the household",
          "emoji": "🗣️",
          "outcome": {
            "text": "You lock the room behind you and return to the fire.",
            "goto": "suspects"
          }
        },
        {
          "id": "accuse",
          "label": "Gather everyone and name the killer",
          "emoji": "☝️",
          "outcome": {
            "text": "You call the household into the common room.",
            "goto": "accusation"
          },
          "style": "success"
        }
      ]
    },
    "suspects": {
      "title": "🔥 By the Fire",
      "tone": "landing",
      "text": "Hester Pell sits stiffly by the window, one hand bandaged. Captain Rook nurses a cup of black coffee and a headache. Wenna Tull moves between the tables, wiping surfaces that are already clean. The kitchen door stands open behind the bar.",
      "resumeText": "You return to the fire. Everyone is where you left them.",
      "choices": [
        {
          "id": "hester",
          "label": "Question Hester Pell",
          "emoji": "🧕",
          "success": {
            "text": "Hester admits she inherits her uncle’s house, and that they quarrelled about money at supper. But she spent the whole night in the kitchen with the cook, who was dressing her scalded hand. The cook, called over, confirms every hour of it.",
            "facts": [
              "hester-heir",
              "hester-argument",
              "hester-alibi"
            ]
          },
          "check": {
            "skill": "insight",
            "dc": 12
          },
          "failure": {
            "text": "Hester tells you coldly that she inherits the house and that she and her uncle argued at supper. Then she refuses to say anything more without the watch present.",
            "facts": [
              "hester-heir",
              "hester-argument"
            ]
          },
          "once": true
        },
        {
          "id": "rook",
          "label": "Question Captain Rook",
          "emoji": "🧔",
          "success": {
            "text": "Rook owed Pell forty crowns and told the whole room he’d “see him drowned.” He also passed out on that bench at the ninth bell; three drinkers swear to it. Then he frowns. He woke once, near the third bell, and saw Wenna on the stairs with a candle and a cup.",
            "facts": [
              "rook-debt",
              "rook-asleep",
              "rook-saw-wenna"
            ]
          },
          "check": {
            "skill": "persuasion",
            "dc": 13
          },
          "failure": {
            "text": "Rook admits he owed Pell forty crowns and threatened him, and then tells you exactly where you can put your questions. The drinkers at the next table say he was asleep on that bench from the ninth bell.",
            "facts": [
              "rook-debt",
              "rook-asleep"
            ]
          },
          "once": true
        },
        {
          "id": "wenna",
          "label": "Question Wenna Tull",
          "emoji": "👩‍🍳",
          "success": {
            "text": "Wenna says she went to bed early and never makes Pell’s posset; the kitchen girl does that. Across the room, the cook snorts. “You always make his posset, Wenna.” Wenna’s cloth stops moving.",
            "facts": [
              "wenna-nervous",
              "wenna-lie"
            ]
          },
          "check": {
            "skill": "insight",
            "dc": 13
          },
          "failure": {
            "text": "Wenna says she went to bed early and saw nothing. She is polite and helpful, though she doesn’t look at the stairs once while she speaks.",
            "facts": [
              "wenna-nervous"
            ]
          },
          "once": true
        },
        {
          "id": "behind-bar",
          "label": "Look around behind the bar",
          "emoji": "🍲",
          "outcome": {
            "text": "You step around the bar while Wenna is busy with the fire.",
            "goto": "behind-bar"
          }
        },
        {
          "id": "counting-room",
          "label": "Go up to the counting room",
          "emoji": "🚪",
          "outcome": {
            "text": "You climb the stairs to Pell’s room.",
            "goto": "counting-room"
          }
        }
      ]
    },
    "behind-bar": {
      "title": "🍲 Behind the Bar",
      "tone": "landing",
      "text": "Behind the bar, the kitchen door stands open and the hearth is still warm. Wenna’s key ring hangs from her apron hook as she works.",
      "resumeText": "You return to the bar. The kitchen door is still open.",
      "choices": [
        {
          "id": "kitchen",
          "label": "Search the kitchen",
          "emoji": "🍲",
          "success": {
            "text": "The posset pan has been scrubbed hard, but behind the flour bins you find a stoppered blue bottle of sleeping draught. In the ashes of the fire, half-burnt: harbour toll receipts made out to the Gull & Lantern, every seal a forgery.",
            "facts": [
              "kitchen-posset-pan",
              "kitchen-receipts"
            ]
          },
          "check": {
            "skill": "investigation",
            "dc": 13
          },
          "failure": {
            "text": "The kitchen is spotless, too spotless for an inn at midnight. Whatever was here has been cleaned away."
          },
          "once": true
        },
        {
          "id": "keys",
          "label": "Get a look at Wenna’s key ring",
          "emoji": "🗝️",
          "success": {
            "text": "When Wenna bends to the hearth, you lift the ring from her apron hook and count. Two keys to the counting room. One is worn brass. You return the ring before she straightens.",
            "facts": [
              "wenna-keys"
            ]
          },
          "check": {
            "skill": "sleightOfHand",
            "dc": 14
          },
          "failure": {
            "text": "Wenna turns as your hand reaches her apron. She smiles, takes the ring, and keeps it in her fist for the rest of the evening.",
            "flags": {
              "alert": true
            }
          },
          "once": true
        },
        {
          "id": "fire",
          "label": "Go back to the fire",
          "emoji": "🔥",
          "outcome": {
            "text": "You return to the common room fire.",
            "goto": "suspects"
          }
        },
        {
          "id": "accuse",
          "label": "Gather everyone and name the killer",
          "emoji": "☝️",
          "outcome": {
            "text": "You call the household together.",
            "goto": "accusation"
          },
          "style": "success"
        }
      ]
    },
    "accusation": {
      "title": "☝️ The Accusation",
      "tone": "landing",
      "text": "The household stands in the common room, the rain loud on the shutters. Hester, Rook and Wenna watch you. Whoever you name now, you will have to make it stick.",
      "resumeText": "The household waits for you to speak.",
      "choices": [
        {
          "id": "accuse-wenna",
          "label": "Accuse Wenna Tull",
          "emoji": "👩‍🍳",
          "success": {
            "text": "You lay it out piece by piece: the forged receipts, Pell’s letter to the reeve, the posset, the second key, the cushion. Wenna’s hands are shaking before you finish. “He was going to ruin me,” she says. “I only meant him to sleep.”",
            "facts": [
              "accused-wenna-confessed"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "investigation",
            "dc": 14
          },
          "failure": {
            "text": "Wenna hears you out, then laughs. “And where’s your proof?” Your case has holes, and everyone in the room can see them. She goes back to her bar, but no one will meet her eye.",
            "facts": [
              "accused-wenna-denied"
            ],
            "goto": "report"
          }
        },
        {
          "id": "accuse-hester",
          "label": "Accuse Hester Pell",
          "emoji": "🧕",
          "outcome": {
            "text": "Hester goes white with fury. Before she can answer, the cook steps forward: Hester was in the kitchen all night, and she will swear to it before any magistrate. The room turns to look at you.",
            "facts": [
              "accused-hester-wrong"
            ],
            "goto": "report"
          }
        },
        {
          "id": "accuse-rook",
          "label": "Accuse Captain Rook",
          "emoji": "🧔",
          "outcome": {
            "text": "Rook bursts out laughing. Three drinkers swear he never left that bench from the ninth bell to dawn. “Owing a man money,” he says, “isn’t the same as killing him.”",
            "facts": [
              "accused-rook-wrong"
            ],
            "goto": "report"
          }
        },
        {
          "id": "no-accusation",
          "label": "Name no one and leave it to the watch",
          "emoji": "🤐",
          "outcome": {
            "text": "You tell the household you have no name to give. Behind the bar, someone lets out a long breath.",
            "facts": [
              "accused-none"
            ],
            "goto": "report"
          }
        }
      ]
    },
    "report": {
      "title": "📜 When the Tide Turns",
      "tone": "shore",
      "text": "The tide turns and the watch arrives, dripping, at the door of the Gull & Lantern. You hand over your notes. Whatever you have found, it is time to record it.",
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
            "text": "You slip out into the rain. Your discoveries remain recorded, but the expedition is unfinished.",
            "goto": "@retreat"
          },
          "style": "secondary"
        }
      ]
    }
  }
};
