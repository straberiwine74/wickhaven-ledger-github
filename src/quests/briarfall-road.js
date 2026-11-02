// The Drowned Watch, converted to quest data. Scene and choice ids match the
// original hardcoded prototype so unfinished runs saved before the engine
// change continue exactly where they stopped.
export default {
  id:'drowned-watch',
  name:'Drowned Watch',
  emoji:'🗼',
  status:'test',
  start:'shore',
  completion:{milestone:'watch-reconnaissance',first:' First reconnaissance recorded (journal only; no AP or gold).',repeat:' Repeat visit recorded. No additional reward.'},
  scenes:{
    shore:{
      title:'🌊 The Shore',tone:'shore',
      text:'The Drowned Watch leans above the surf. A chain hangs from its upper landing; each wave pulls it taut. Below, a narrow culvert breathes cold air. The stairs are slick and exposed.',
      resumeText:'You return to the same shore approach. Earlier discoveries and resources remain.',
      passive:{skill:'perception',dc:14,note:'Passive Perception {value} applied to the approach.',success:{text:'You notice the chain pulls away from sound stone: it could tear loose under weight.',facts:['chain-anchor']}},
      choices:[
        {id:'climb',label:'Climb the exposed stairs',emoji:'🧗',check:{skill:'athletics',dc:13},
          success:{text:'You climb the exposed stairs and secure the landing. From above, you see the culvert mouth vanish beneath a passing swell.',facts:['culvert-submerges'],goto:'landing'},
          failure:{text:'The chain tears free. You drop onto a lower shelf and reach the landing by a slower route. Your pack catches on the stone; the noise carries into the tower.',facts:['maintenance-route'],flags:{alert:true},goto:'landing'}},
        {id:'sneak',label:'Time the culvert crossing',emoji:'🌊',check:{skill:'stealth',dc:12},
          success:{text:'You slip through the culvert between waves. Moon-shaped scratches mark a concealed side entrance.',facts:['moon-marked-door'],goto:'landing'},
          failure:{text:'A wave drives you back before you can pass. You take the long stairs; a loose shutter begins knocking above you.',facts:['maintenance-route'],flags:{alert:true},goto:'landing'}},
        {id:'study',label:'Study the harbor marks',emoji:'🔎',check:{skill:'investigation',dc:14},
          success:{text:'You read the surviving harbor marks: the lower passage is usable only at low tide. You follow a marked maintenance route to the landing.',facts:['culvert-low-tide'],goto:'landing'},
          failure:{text:'Salt has eaten the key markings. Working slowly, you find a stable maintenance route, but darkness overtakes the outer yard.',facts:['maintenance-route'],goto:'landing'}},
        {id:'retreat',label:'Return to town',emoji:'↩️',style:'secondary',outcome:{text:'You withdraw along the clear shore path. No roll or rest. Your expedition and supplies remain locked.',goto:'@retreat'}}
      ]
    },
    landing:{
      title:'🗼 The Landing',tone:'landing',
      resumeText:'You return to the secured landing; the recovered observation remains in your journal.',
      choices:[
        {id:'finish',label:'Record findings & return',emoji:'📜',style:'success',outcome:{text:'You copy the Watch’s surviving harbor marks and return to Wickhaven. This short reconnaissance is complete. Your journal is saved.',goto:'@complete'}},
        {id:'tidebox',label:'Leave 1 gp in the tide-box (spends 1 gp)',emoji:'🪙',style:'secondary',once:true,legacyFlag:'tidebox',requires:{bags:true},cost:{coins:{gp:1}},
          outcome:{text:'You drop 1 gp through the slot of the old keeper’s tide-box. The lid clicks open on a waxed slip: the Watch’s last tide rota. The lower passage floods two hours before high water; the culvert clears an hour after the ebb.\n1 gp spent. It is listed in your supplies receipt.',facts:['tide-rota']}},
        {id:'retreat',label:'Retreat unfinished',emoji:'↩️',style:'secondary',outcome:{text:'You withdraw along the clear shore path. No roll or rest. Your expedition and supplies remain locked.',goto:'@retreat'}}
      ]
    }
  }
};
