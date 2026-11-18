// The Light at Saltings House — Sam's quest, converted from his gvar.
// Converted November 18, 2026. Status 'test': runs only in the staff quest channel until changed to 'live'.
// Each rolled choice has success/failure results; guaranteed choices use outcome.
// goto names the next scene. Omit goto to remain in the current scene.
// @complete finishes the run; @retreat leaves it unfinished.

export default {
  "id": "saltings-house",
  "name": "The Light at Saltings House",
  "emoji": "👻",
  "status": "test",
  "start": "lane",
  "completion": {
    "milestone": "saltings-house-visited",
    "ap": 1,
    "first": " First visit to Saltings House recorded.",
    "repeat": " Repeat visit recorded. No additional reward."
  },
  "journal": {
    "saltings-candle-still": "The candle in Saltings House’s upper window does not flicker, even in the sea wind.",
    "saltings-story": "Saltings House belonged to Ada Marle, whose husband Tom was lost with the Kittiwake twenty years ago. Ada died the next winter.",
    "saltings-lettie": "Ada’s sister Lettie lived on alone at Saltings House until her own death last spring.",
    "saltings-rumour": "The drinkers at the Anchor would only say that “the widow’s still waiting.”",
    "hall-portrait": "A wedding portrait in the hall shows Ada and Tom Marle. Someone has scratched out Tom’s face.",
    "hall-humming": "Someone is humming a sailor’s lullaby in the room above the hall.",
    "hall-warded": "You spoke a warding prayer at the foot of the stairs. The cold drew back a little.",
    "hall-chilled": "The cold in the hall reached your bones. Your breath still clouds when you think of it.",
    "parlour-diary": "A line from Lettie’s diary: “She must never know. He would have come back to her, not me.”",
    "parlour-letters": "A ribbon-tied bundle of letters from Tom Marle to Ada, unopened, dated over a year after the wreck. Tom survived.",
    "parlour-box-jammed": "Lettie’s writing box is locked, and you could not open it.",
    "ada-seen": "The ghost of Ada Marle keeps watch at the upper window, beside a candle that never burns down.",
    "ada-waiting": "Ada asked you if there had been any letters. Lettie told her every day that there were none.",
    "ada-unreachable": "Ada did not seem to hear you. She only watched the sea.",
    "ada-banished": "You drove Ada’s ghost from the window. The candle went out, but the house did not feel at peace.",
    "ada-angered": "Your rite failed. The room turned bitterly cold and the window shutters slammed as you fled.",
    "ada-left-waiting": "You left Ada to her vigil. The candle still burns in the window of Saltings House.",
    "ada-at-rest": "Ada Marle learned that Tom lived and wrote to her. The candle burned out, and the house is quiet.",
    "ada-message": "Ada gave you a message: “Tell him I waited.” Old Tom Marle still mends nets on Wickhaven quay."
  },
  "scenes": {
    "lane": {
      "title": "🌙 Cliff Lane",
      "tone": "shore",
      "text": "Saltings House stands alone at the end of the cliff lane, its garden swallowed by gorse. No one has lived there since spring. Yet every night, a single candle burns in the upper window, facing the sea.",
      "resumeText": "You return to the end of Cliff Lane. The candle burns in the window, as always.",
      "passive": {
        "skill": "perception",
        "dc": 12,
        "note": "Passive Perception {value} applied to the lane.",
        "success": {
          "text": "The wind off the sea is strong enough to bend the gorse flat. The candle flame in the window does not move at all.",
          "facts": [
            "saltings-candle-still"
          ]
        }
      },
      "choices": [
        {
          "id": "ask-anchor",
          "label": "Ask about the house at the Anchor inn",
          "emoji": "🍺",
          "success": {
            "text": "An old fisherman buys you a drink and tells you the story: Ada Marle, whose husband Tom went down with the Kittiwake twenty years back. She died of grief the next winter. Her sister Lettie lived on in the house alone until last spring. “And the light,” he says, “never once missed a night.”",
            "facts": [
              "saltings-story",
              "saltings-lettie"
            ],
            "goto": "hall"
          },
          "check": {
            "skill": "persuasion",
            "dc": 12
          },
          "failure": {
            "text": "The room goes quiet when you mention Saltings House. “The widow’s still waiting,” someone mutters, and the talk turns to fish. You walk back up the lane alone.",
            "facts": [
              "saltings-rumour"
            ],
            "goto": "hall"
          }
        },
        {
          "id": "enter",
          "label": "Go straight to the house",
          "emoji": "🚪",
          "outcome": {
            "text": "The front door is unlocked. It opens before you have quite finished pushing it.",
            "goto": "hall"
          }
        },
        {
          "id": "retreat",
          "label": "Return to town",
          "emoji": "↩️",
          "outcome": {
            "text": "You decide some lights are best left burning. No roll or rest. Your expedition and supplies remain locked.",
            "goto": "@retreat"
          },
          "style": "secondary"
        }
      ]
    },
    "hall": {
      "title": "🏚️ The Hall",
      "tone": "landing",
      "text": "Dust lies thick on every surface. A wedding portrait hangs above the hall table. To your left, a door stands ajar on a cluttered parlour. Ahead, the stairs climb toward the room with the candle. It is very cold.",
      "resumeText": "You return to the cold hall. The portrait watches from above the table.",
      "passive": {
        "skill": "investigation",
        "dc": 12,
        "note": "Passive Investigation {value} applied to the hall.",
        "success": {
          "text": "The portrait shows a young couple on their wedding day. The bride is smiling. The groom’s face has been scratched away, carefully and thoroughly, with a pin.",
          "facts": [
            "hall-portrait"
          ]
        }
      },
      "choices": [
        {
          "id": "listen",
          "label": "Stand still and listen",
          "emoji": "👂",
          "success": {
            "text": "At the edge of hearing, from the room above, someone is humming. It is an old sailor’s lullaby, sung by those waiting for boats to come home.",
            "facts": [
              "hall-humming"
            ]
          },
          "check": {
            "skill": "perception",
            "dc": 13
          },
          "failure": {
            "text": "You hear only the sea and the creak of the house settling.",
            "facts": [
              "hall-chilled"
            ]
          },
          "once": true
        },
        {
          "id": "ward",
          "label": "Speak a warding prayer before you go further",
          "emoji": "🙏",
          "success": {
            "text": "You speak the old words at the foot of the stairs. The cold draws back from you, a little, as if something above has turned to look.",
            "facts": [
              "hall-warded"
            ]
          },
          "check": {
            "skill": "religion",
            "dc": 12
          },
          "failure": {
            "text": "The words come out wrong. The cold presses closer, settling into your bones.",
            "facts": [
              "hall-chilled"
            ]
          },
          "once": true
        },
        {
          "id": "parlour",
          "label": "Search the parlour",
          "emoji": "🧵",
          "outcome": {
            "text": "You push open the parlour door.",
            "goto": "parlour"
          }
        },
        {
          "id": "upstairs",
          "label": "Climb the stairs toward the light",
          "emoji": "🕯️",
          "outcome": {
            "text": "Each stair creaks. The humming stops as you reach the top.",
            "goto": "window-room"
          }
        }
      ]
    },
    "parlour": {
      "title": "🧵 Lettie’s Parlour",
      "tone": "landing",
      "text": "This room was lived in until recently. A sewing basket sits by a cold hearth, a diary lies open on the table, and a small locked writing box rests on the shelf above.",
      "resumeText": "You return to Lettie’s parlour. The writing box sits on its shelf.",
      "choices": [
        {
          "id": "diary",
          "label": "Read Lettie’s diary",
          "emoji": "📔",
          "success": {
            "text": "Most entries are about weather and mending. Then, twenty years back: “Another from him today. Into the box with the rest. She must never know. He would have come back to her, not me.”",
            "facts": [
              "parlour-diary"
            ]
          },
          "check": {
            "skill": "investigation",
            "dc": 12
          },
          "failure": {
            "text": "The cramped handwriting and faded ink defeat you. You make out only dates and the weather."
          },
          "once": true
        },
        {
          "id": "box",
          "label": "Open the locked writing box",
          "emoji": "🗃️",
          "success": {
            "text": "The lock gives with a click. Inside lies a bundle of letters tied with blue ribbon, all addressed to Ada Marle, every seal unbroken. The first is dated four months after the Kittiwake went down. It begins: “My dearest Ada, I am alive.”",
            "facts": [
              "parlour-letters"
            ],
            "goto": "window-letters"
          },
          "check": {
            "skill": "sleightOfHand",
            "dc": 13
          },
          "failure": {
            "text": "The lock is old but stubborn, and you cannot make it give. As you set the box down, something upstairs begins to hum again.",
            "facts": [
              "parlour-box-jammed"
            ]
          },
          "once": true
        },
        {
          "id": "force-box",
          "label": "Prise the box open by force",
          "emoji": "💪",
          "success": {
            "text": "The hinges tear free. Inside, tied in blue ribbon, are letters addressed to Ada Marle, every seal unbroken. The first begins: “My dearest Ada, I am alive.”",
            "facts": [
              "parlour-letters"
            ],
            "goto": "window-letters"
          },
          "check": {
            "skill": "athletics",
            "dc": 14
          },
          "failure": {
            "text": "The box is stronger than it looks. You put it back on the shelf, unopened, your fingers sore.",
            "facts": [
              "parlour-box-jammed"
            ]
          },
          "once": true
        },
        {
          "id": "upstairs",
          "label": "Go upstairs to the candle",
          "emoji": "🕯️",
          "outcome": {
            "text": "You leave the parlour and climb toward the light.",
            "goto": "window-room"
          }
        }
      ]
    },
    "window-room": {
      "title": "🕯️ The Upper Window",
      "tone": "landing",
      "text": "A woman in an old-fashioned grey dress stands at the window, a candle burning beside her. You can see the sea through her. She does not turn around.",
      "resumeText": "Ada still stands at the window, watching the sea.",
      "passive": {
        "skill": "insight",
        "dc": 12,
        "note": "Passive Insight {value} applied to the ghost.",
        "success": {
          "text": "There is no anger in her. Only waiting, so long and so patient it has worn her thin.",
          "facts": [
            "ada-seen"
          ]
        }
      },
      "choices": [
        {
          "id": "speak",
          "label": "Speak to her gently",
          "emoji": "🗣️",
          "success": {
            "text": "She turns her head, just slightly. “Has there been a letter?” she asks. “Lettie says there are never any letters. She checks every day.” She turns back to the sea.",
            "facts": [
              "ada-seen",
              "ada-waiting"
            ]
          },
          "check": {
            "skill": "persuasion",
            "dc": 13
          },
          "failure": {
            "text": "She does not seem to hear you. Her lips move, humming without sound, and she watches the sea.",
            "facts": [
              "ada-seen",
              "ada-unreachable"
            ]
          },
          "once": true
        },
        {
          "id": "search-parlour",
          "label": "Go back down and search Lettie’s parlour",
          "emoji": "🧵",
          "outcome": {
            "text": "You leave her at the window and go back down the stairs.",
            "goto": "parlour"
          }
        },
        {
          "id": "banish",
          "label": "Perform a rite to banish her",
          "emoji": "✨",
          "success": {
            "text": "You speak the rite firmly. Ada flickers, looks at you with an expression you will not easily forget, and is gone. The candle gutters out. The house is silent, but it does not feel at peace.",
            "facts": [
              "ada-banished"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "arcana",
            "dc": 14
          },
          "failure": {
            "text": "Halfway through the rite, the room turns bitterly cold. The shutters slam. Ada is facing you now, and the candle flame burns blue. You run.",
            "facts": [
              "ada-angered"
            ],
            "flags": {
              "alert": true
            },
            "goto": "report"
          }
        },
        {
          "id": "leave",
          "label": "Leave her to her vigil",
          "emoji": "🚶",
          "outcome": {
            "text": "You quietly back out of the room. Behind you, the humming begins again.",
            "facts": [
              "ada-left-waiting"
            ],
            "goto": "report"
          }
        }
      ]
    },
    "window-letters": {
      "title": "💌 The Letters",
      "tone": "landing",
      "text": "You climb the stairs with Tom’s letters in your hands. A woman in a grey dress stands at the window beside a candle, the sea visible through her. As you enter, she turns around for the first time in twenty years.",
      "resumeText": "Ada watches you from the window, her eyes on the letters in your hands.",
      "choices": [
        {
          "id": "read-aloud",
          "label": "Read Tom’s letters to her aloud",
          "emoji": "📖",
          "success": {
            "text": "You read them all, in order, by the light of her candle. He lived. He was hurt, then pressed onto a merchant ship, then trying for a year to get home to her. By the last letter, Ada is weeping and smiling at once. “Tell him I waited,” she says. Then she is gone, and the candle burns out on its own.",
            "facts": [
              "ada-at-rest",
              "ada-message"
            ],
            "goto": "report"
          },
          "check": {
            "skill": "performance",
            "dc": 12
          },
          "failure": {
            "text": "Your voice catches and the words come out halting, but she hears enough. “He lived,” she whispers. “He wrote.” She fades with the candle flame, and the room is only a room again.",
            "facts": [
              "ada-at-rest"
            ],
            "goto": "report"
          }
        },
        {
          "id": "sill",
          "label": "Lay the letters on the sill beside her",
          "emoji": "🕯️",
          "outcome": {
            "text": "You set the bundle beside the candle and step back. Ada looks down at Tom’s handwriting for a long time. When you look again, both she and the letters are gone, and the candle is cold.",
            "facts": [
              "ada-at-rest"
            ],
            "goto": "report"
          }
        },
        {
          "id": "keep",
          "label": "Keep the letters and leave quietly",
          "emoji": "🚶",
          "outcome": {
            "text": "You find you cannot do it. You back out with the letters still in your hands. Behind you, the humming begins again.",
            "facts": [
              "ada-left-waiting"
            ],
            "goto": "report"
          },
          "style": "secondary"
        }
      ]
    },
    "report": {
      "title": "🌅 First Light",
      "tone": "shore",
      "text": "Dawn is coming up grey over the sea as you walk back down Cliff Lane. Behind you, Saltings House stands silent. It is time to record what happened there.",
      "resumeText": "Your findings are ready to be recorded.",
      "choices": [
        {
          "id": "finish",
          "label": "Record findings and complete the expedition",
          "emoji": "📜",
          "outcome": {
            "text": "You return to Wickhaven and enter your account in the Ledger. This expedition is complete.",
            "goto": "@complete"
          },
          "style": "success"
        },
        {
          "id": "retreat",
          "label": "Leave the expedition unfinished",
          "emoji": "↩️",
          "outcome": {
            "text": "You walk back to Wickhaven without speaking of it. Your discoveries remain recorded, but the expedition is unfinished.",
            "goto": "@retreat"
          },
          "style": "secondary"
        }
      ]
    }
  }
};
