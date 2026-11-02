// Shared names and the quest data validator. No imports from the quest
// registry here, so quest files can be validated as they load.
export const SKILLS={acrobatics:'Acrobatics',animalHandling:'Animal Handling',arcana:'Arcana',athletics:'Athletics',deception:'Deception',history:'History',insight:'Insight',intimidation:'Intimidation',investigation:'Investigation',medicine:'Medicine',nature:'Nature',perception:'Perception',performance:'Performance',persuasion:'Persuasion',religion:'Religion',sleightOfHand:'Sleight of Hand',stealth:'Stealth',survival:'Survival'};
export const ABILITIES={str:'Strength',dex:'Dexterity',con:'Constitution',int:'Intelligence',wis:'Wisdom',cha:'Charisma'};
export const LEGACY_SKILLS=['athletics','stealth','investigation','perception'];
export const TERMINAL=['complete','downed','cancelled'];
const STYLES=['primary','secondary','success','danger'];
const id=/^[a-z][a-z0-9-]{1,39}$/;

export function checkLabel(check) {
  if(check.skill) return SKILLS[check.skill];
  if(check.save) return `${ABILITIES[check.save]} save`;
  if(check.ability) return `${ABILITIES[check.ability]} check`;
}
export function checksUsed(quest) {
  const out=new Map();
  for(const scene of Object.values(quest.scenes)) {
    if(scene.passive) out.set('passive:'+scene.passive.skill,`Passive ${SKILLS[scene.passive.skill]}`);
    for(const c of scene.choices) if(c.check) out.set(JSON.stringify(c.check),checkLabel(c.check));
  }
  return [...new Set(out.values())];
}

// Milestones worth 1 AP: completion.ap and any outcome with milestone + ap.
// AP is only awarded while the quest's status is 'live'.
export function apMilestones(quest) {
  const out=new Set();if(quest.completion?.ap) out.add(quest.completion.milestone);
  for(const scene of Object.values(quest.scenes)) for(const c of scene.choices) for(const o of [c.outcome,c.success,c.failure]) if(o?.milestone&&o.ap) out.add(o.milestone);
  return out;
}

export function validateQuest(q) {
  const where=[];const bad=m=>{throw new Error(`Quest ${q?.id??'?'}${where.length?' '+where.join(' > '):''}: ${m}`);};
  const ok=(cond,m)=>{if(!cond)bad(m);};
  ok(q&&id.test(q.id),'needs a lowercase id such as briarfall-road');
  ok(typeof q.name==='string'&&q.name.length>0&&q.name.length<=60,'needs a name up to 60 characters');
  ok(['test','live','hidden'].includes(q.status),'status must be test, live or hidden');
  ok(q.scenes&&typeof q.scenes==='object'&&Object.keys(q.scenes).length,'needs scenes');
  ok(Object.hasOwn(q.scenes,q.start),'start must name a scene');
  ok(q.completion&&id.test(q.completion.milestone),'needs completion.milestone');
  ok(q.completion.ap===undefined||q.completion.ap===1,'completion.ap can only be 1');
  // Quest unlock: requires:{facts:[...], scope:'server'|'character', hint}
  if(q.requires) ok(Array.isArray(q.requires.facts)&&q.requires.facts.length&&q.requires.facts.every(f=>id.test(f))&&['server','character'].includes(q.requires.scope??'character')&&(q.requires.hint===undefined||(typeof q.requires.hint==='string'&&q.requires.hint.length<=300)),'requires needs facts, scope server or character, and an optional hint');
  for(const reserved of ['review','town',...TERMINAL]) ok(!Object.hasOwn(q.scenes,reserved),`scene id "${reserved}" is reserved`);
  const checkOk=c=>ok(c&&Number.isInteger(c.dc)&&c.dc>=1&&c.dc<=40&&[c.skill,c.save,c.ability].filter(Boolean).length===1&&(c.skill?Object.hasOwn(SKILLS,c.skill):Object.hasOwn(ABILITIES,c.save??c.ability)),'check needs exactly one valid skill, save or ability and a dc');
  const outcomeOk=o=>{
    ok(o&&typeof o.text==='string'&&o.text.length>0&&o.text.length<=1800,'outcome needs text up to 1800 characters');
    ok(!o.goto||o.goto==='@complete'||o.goto==='@retreat'||Object.hasOwn(q.scenes,o.goto),`goto "${o.goto}" is not a scene`);
    ok(!o.facts||o.facts.every(f=>id.test(f)),'facts must be lowercase ids');
    ok(o.ap===undefined||(o.ap===1&&o.milestone),'ap: 1 needs a milestone on the same outcome');
    ok(o.damage===undefined||(Number.isInteger(o.damage)&&o.damage>0&&o.damage<=100)||/^\d{1,2}d(4|6|8|10|12)([+]\d{1,2})?$/.test(o.damage),'damage must be a number or dice such as 1d6+1');
  };
  for(const [sid,scene] of Object.entries(q.scenes)) {
    where.push(sid);
    ok(id.test(sid),'scene ids must be lowercase');
    ok(typeof scene.title==='string'&&scene.title.length<=80,'scene needs a title');
    ok(Array.isArray(scene.choices)&&scene.choices.length>=1&&scene.choices.length<=5,'scene needs 1 to 5 choices (one Discord button row)');
    if(sid===q.start) ok(typeof scene.text==='string','the start scene needs text');
    if(scene.passive){ok(Object.hasOwn(SKILLS,scene.passive.skill)&&Number.isInteger(scene.passive.dc),'passive needs a skill and dc');outcomeOk({...scene.passive.success,goto:undefined});}
    const ids=new Set();
    for(const c of scene.choices) {
      where.push(c.id);
      ok(id.test(c.id)&&!['confirm','cancel','resume','supplies','race'].includes(c.id),'choice id must be lowercase and not reserved');
      ok(!ids.has(c.id),'choice ids must be unique in a scene');ids.add(c.id);
      ok(typeof c.label==='string'&&c.label.length<=80,'choice label up to 80 characters');
      ok(!c.style||STYLES.includes(c.style),'style must be primary, secondary, success or danger');
      if(c.check){checkOk(c.check);outcomeOk(c.success);outcomeOk(c.failure);ok(!c.outcome,'use success/failure with a check, not outcome');}
      else {outcomeOk(c.outcome);ok(!c.success&&!c.failure,'success/failure need a check');}
      where.pop();
    }
    where.pop();
  }
  return Object.freeze(q);
}
