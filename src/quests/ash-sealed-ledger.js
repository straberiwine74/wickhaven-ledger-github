// The Ash-Sealed Ledger — Thaleryn unlock quest, set in the Archive (Town Square).
// Written November 15, 2026. Status 'test': runs only in the staff quest channel until changed to 'live'.
// Locked until anyone on the server has road-elaris-marker (The Road That Shouldn't Be There).
// Confirms Wickhaven was built over Elaris. Hints at the Unlit without naming it.

export default {
  id: 'ash-sealed-ledger',
  name: 'The Ash-Sealed Ledger',
  emoji: '📕',
  status: 'test',
  start: 'archive-desk',
  requires: {
    facts: ['road-elaris-marker'],
    scope: 'server',
    hint: 'Someone must first find the name on the mile-marker along the road that shouldn’t be there.'
  },
  completion: {
    milestone: 'ash-ledger-read',
    ap: 1,
    first: ' First Ash-Sealed Ledger expedition recorded.',
    repeat: ' Repeat visit recorded. No additional reward.'
  },
  journal: {
    'ledger-archivist-knows': 'The Archive’s archivist recognized the name Elaris and tried to hide it.',
    'ledger-access-granted': 'The archivist let you into the Archive’s restricted shelves.',
    'ledger-archivist-wary': 'The archivist watched you closely in the restricted shelves.',
    'ledger-caught-sneaking': 'The archivist caught you slipping into the restricted shelves.',
    'ledger-seal-resealed': 'The ash-gray seal on the founders’ ledger had been broken and resealed before.',
    'ledger-seal-flame-ash': 'The ash-gray seal is wax mixed with ash; the Lamplighters seal things with ash from the First Flame.',
    'ledger-seal-opened': 'You opened the ash-gray seal without damaging it.',
    'ledger-seal-cracked': 'You cracked the ash-gray seal on the founders’ ledger.',
    'ledger-name-scraped': 'In the founders’ ledger, the old city’s name was scraped from every page.',
    'ledger-elaris-confirmed': 'The founders’ ledger confirms it: Wickhaven was built on the ruins of Elaris.',
    'ledger-sealed-keeping': 'The founders wrote that Elaris’s dead and secrets were “sealed in the keeping of” a name they scraped out.',
    'ledger-flame-defiance': 'The founders lit the First Flame “so that what was sealed stays sealed.”',
    'ledger-pages-cut': 'Pages were cut from the founders’ ledger, and recently.',
    'ledger-cut-unknown': 'Pages are missing from the founders’ ledger, but you couldn’t tell when they were taken.',
    'ledger-archivist-told': 'You told the archivist what you found in the founders’ ledger.',
    'ledger-archivist-misled': 'You told the archivist you found nothing.',
    'ledger-archivist-visitor': 'The archivist says someone else asked for the founders’ ledger a month ago, with a Magisterium pass.'
  },
  scenes: {
    'archive-desk': {
      title: '📚 The Archive',
      tone: 'landing',
      text: 'Towering shelves, chained ledgers, and the smell of dust and lamp oil. The portly archivist looks up from his desk as you approach. When you say the word on the mile-marker, *Elaris*, his pen stops moving.',
      resumeText: 'You return to the archivist’s desk.',
      passive: {
        skill: 'insight',
        dc: 12,
        note: 'Passive Insight {value} applied to the archivist.',
        success: { text: 'He knows the name. He’s trying very hard to look like he doesn’t.', facts: ['ledger-archivist-knows'] }
      },
      choices: [
        {
          id: 'persuade', label: 'Ask for the oldest records of the city’s founding', emoji: '🗣️',
          check: { skill: 'persuasion', dc: 13 },
          success: { text: 'He studies you a long time, then takes a key from his belt. “The restricted shelves. Touch only what I show you.”', facts: ['ledger-access-granted'], goto: 'restricted-shelf' },
          failure: { text: '“The founding records aren’t for browsing.” But he doesn’t send you away. He lets you follow him to the restricted shelves, and he doesn’t take his eyes off you.', facts: ['ledger-access-granted', 'ledger-archivist-wary'], goto: 'restricted-shelf' }
        },
        {
          id: 'cite-history', label: 'Show him you already know about the old city', emoji: '📜',
          check: { skill: 'history', dc: 14 },
          success: { text: 'You talk about the old foundations, the road, the marker pointing home. He sets his pen down. “Then you’d better see it before someone else does.” He unlocks the restricted shelves.', facts: ['ledger-access-granted'], goto: 'restricted-shelf' },
          failure: { text: 'You stumble over the details, but you’ve said enough. He sighs and unlocks the restricted shelves, watching you the whole way.', facts: ['ledger-access-granted', 'ledger-archivist-wary'], goto: 'restricted-shelf' }
        },
        {
          id: 'sneak', label: 'Slip past while he’s busy', emoji: '🤫',
          check: { skill: 'stealth', dc: 14 },
          success: { text: 'When he turns to a shelf, you slip through the gate behind his desk and into the restricted stacks.', goto: 'restricted-shelf' },
          failure: { text: 'A floorboard creaks. “Those shelves are chained for a reason.” But he follows you in rather than throw you out.', facts: ['ledger-caught-sneaking', 'ledger-archivist-wary'], goto: 'restricted-shelf' }
        },
        {
          id: 'retreat', label: 'Leave the Archive', emoji: '↩️', style: 'secondary',
          outcome: { text: 'You leave the Archive. Your expedition remains unfinished.', goto: '@retreat' }
        }
      ]
    },
    'restricted-shelf': {
      title: '🔒 The Restricted Shelves',
      tone: 'landing',
      text: 'At the back of the stacks, on a chained shelf of its own, sits a thick ledger bound in grey leather. A disk of ash-gray wax seals its clasp, pressed with the mark of a single flame.',
      resumeText: 'You return to the ash-sealed ledger on its chained shelf.',
      passive: {
        skill: 'investigation',
        dc: 13,
        note: 'Passive Investigation {value} applied to the seal.',
        success: { text: 'There’s a hairline seam through the wax. Someone has broken this seal before and pressed it back together.', facts: ['ledger-seal-resealed'] }
      },
      choices: [
        {
          id: 'read-seal', label: 'Study the seal before you touch it', emoji: '🔎', once: true,
          check: { skill: 'religion', dc: 12 },
          success: { text: 'The wax is mixed with fine grey ash. The Lamplighters seal their gravest records this way, with ash from the First Flame itself. Whatever’s in here, the Wick wanted kept.', facts: ['ledger-seal-flame-ash'] },
          failure: { text: 'The wax is grey and gritty, and the flame mark is an old one. You can’t say more.' }
        },
        {
          id: 'lift-seal', label: 'Ease the seal off without breaking it', emoji: '🤏',
          check: { skill: 'sleightOfHand', dc: 13 },
          success: { text: 'You warm the wax with your palm and lift it whole. No one will know it was opened.', facts: ['ledger-seal-opened'], goto: 'founders-ledger' },
          failure: { text: 'The wax cracks in two. There’s no hiding that now. You open the ledger.', facts: ['ledger-seal-cracked'], goto: 'founders-ledger' }
        },
        {
          id: 'break-seal', label: 'Break the seal and open it', emoji: '💥',
          outcome: { text: 'You snap the wax and lift the cover.', facts: ['ledger-seal-cracked'], goto: 'founders-ledger' }
        }
      ]
    },
    'founders-ledger': {
      title: '📕 The Founders’ Ledger',
      tone: 'landing',
      text: 'The first pages are lists: names, stores, the cost of stone and timber. The founders of Wickhaven, counting what it took to raise a city. But wherever the old city on this site is named, someone has scraped the ink away with a blade, line after line.',
      resumeText: 'You return to the open founders’ ledger.',
      passive: {
        skill: 'history',
        dc: 14,
        note: 'Passive History {value} applied to the ledger.',
        success: { text: 'The scraping was done carefully, by someone who wanted the name gone but the rest of the page kept.', facts: ['ledger-name-scraped'] }
      },
      choices: [
        {
          id: 'recover-name', label: 'Recover the scraped name', emoji: '🕯️',
          check: { skill: 'investigation', dc: 14 },
          success: { text: 'You tilt the page to the lamp. The blade took the ink but not the dent of the pen. Letter by letter, the name comes back: **Elaris**. *“We raise our walls on the bones of Elaris.”*', facts: ['ledger-name-scraped', 'ledger-elaris-confirmed'], goto: 'sealed-passage' },
          failure: { text: 'The scraping is too thorough. You can see a name was there, and that it was short.', facts: ['ledger-name-scraped'], goto: 'sealed-passage' }
        },
        {
          id: 'match-marker', label: 'Match the gaps against the mile-marker’s name', emoji: '🪧',
          requires: { facts: ['road-elaris-marker'] },
          outcome: { text: 'You already know the name. You lay it against the scraped gaps, and it fits every one. *“We raise our walls on the bones of Elaris.”*', facts: ['ledger-name-scraped', 'ledger-elaris-confirmed'], goto: 'sealed-passage' }
        },
        {
          id: 'skip-ahead', label: 'Turn to the last written pages', emoji: '📖',
          outcome: { text: 'You leave the lists behind and turn toward the end of the ledger.', goto: 'sealed-passage' }
        }
      ]
    },
    'sealed-passage': {
      title: '🕯️ The Last Entry',
      tone: 'landing',
      text: 'The final entry is in a different hand, larger and less steady. It describes the night the founders lit a single flame over the ruins. One line has been scraped like the others. Below the last entry, the binding is ragged where pages used to be.',
      resumeText: 'You return to the last entry in the founders’ ledger.',
      choices: [
        {
          id: 'read-entry', label: 'Read the last entry closely', emoji: '👁️', once: true,
          check: { skill: 'investigation', dc: 13 },
          success: { text: '*“The dead of Elaris and all its secrets lie sealed in the keeping of* [scraped]*. We light this flame above them so that what was sealed stays sealed. Let it never go out.”* The scraped name is longer than Elaris. You can’t recover it.', facts: ['ledger-sealed-keeping', 'ledger-flame-defiance'] },
          failure: { text: 'You make out only the end: *“…so that what was sealed stays sealed. Let it never go out.”*', facts: ['ledger-flame-defiance'] }
        },
        {
          id: 'check-binding', label: 'Examine where the pages were cut', emoji: '✂️', once: true,
          check: { skill: 'investigation', dc: 12 },
          success: { text: 'The cut edges are clean and pale. The dust that coats the rest of the binding isn’t on them. These pages were taken recently.', facts: ['ledger-pages-cut'] },
          failure: { text: 'Several pages are gone. You can’t tell whether they were taken last month or a hundred years ago.', facts: ['ledger-cut-unknown'] }
        },
        {
          id: 'close-ledger', label: 'Close the ledger and go back to the desk', emoji: '📕',
          outcome: { text: 'You close the ledger and return it to its chain. The archivist is waiting at his desk.', goto: 'archivist-return' }
        }
      ]
    },
    'archivist-return': {
      title: '🪶 The Archivist',
      tone: 'landing',
      text: 'The archivist folds his hands on the desk. “Well?” he says quietly. “What did you find?”',
      resumeText: 'The archivist is still waiting for your answer.',
      choices: [
        {
          id: 'tell-truth', label: 'Tell him what you found', emoji: '🗣️',
          outcome: { text: 'He listens without interrupting. When you’re done, he nods slowly. “Then I’m not the only one who knows.”', facts: ['ledger-archivist-told'], goto: 'report' }
        },
        {
          id: 'ask-visitor', label: 'Ask who else has read that ledger', emoji: '🔎',
          check: { skill: 'insight', dc: 13 },
          success: { text: 'He hesitates, then answers. “A month ago. A scholar with a Magisterium pass. I didn’t know the face, and I didn’t check the pass as closely as I should have.”', facts: ['ledger-archivist-visitor'], goto: 'report' },
          failure: { text: '“The Archive keeps its readers’ names private.” He won’t say more.', goto: 'report' }
        },
        {
          id: 'lie', label: 'Tell him you found nothing', emoji: '🎭',
          check: { skill: 'deception', dc: 13 },
          success: { text: '“Old lists. Nothing worth the trouble.” He looks relieved, and you leave him that way.', facts: ['ledger-archivist-misled'], goto: 'report' },
          failure: { text: 'He doesn’t believe you, and he doesn’t argue. “The Archive has a long memory,” he says, “and longer ears.”', goto: 'report' }
        }
      ]
    },
    report: {
      title: '📜 Out Into Town Square',
      tone: 'landing',
      text: 'You step out of the Archive into Town Square. The Hall of the First Flame stands across the square, its light steady in the window.',
      resumeText: 'Your notes from the founders’ ledger are ready to record.',
      choices: [
        {
          id: 'finish', label: 'Record findings and complete the expedition', emoji: '📜', style: 'success',
          outcome: { text: 'You enter what you learned from the Ash-Sealed Ledger in the Ledger. This expedition is complete.', goto: '@complete' }
        },
        {
          id: 'retreat', label: 'Leave the report unfinished', emoji: '↩️', style: 'secondary',
          outcome: { text: 'Your discoveries remain saved, but the expedition is unfinished.', goto: '@retreat' }
        }
      ]
    }
  }
};
