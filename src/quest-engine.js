// Runs any quest written as data (see src/quests). The engine owns the
// built-in review, town, complete, downed and cancelled steps; quest files
// own everything in between.
import { randomInt } from 'node:crypto';
import { spendResources } from './quest-resources.js';
import { getQuest } from './quests/index.js';
import { SKILLS, ABILITIES, TERMINAL, checkLabel } from './quest-schema.js';

const fail=m=>{throw new Error(m);};
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
export const isTerminal=scene=>TERMINAL.includes(scene);
export const defaultDie=(sides=20)=>randomInt(1,sides+1);
export const questOf=run=>getQuest(run.snapshot.quest??'drowned-watch')??fail('This quest is not available.');

export function checkValue(snapshot,check) {
  const entry=check.skill?snapshot.skills?.[check.skill]:check.save?snapshot.saves?.[check.save]:snapshot.checks?.[check.ability];
  if(!entry) fail(`This character export has no ${checkLabel(check)}. Use !update, then depart again.`);
  return entry;
}
export function passiveValue(snapshot,skill) {
  // Perception uses the value shown on the departure review (declared or computed).
  if(skill==='perception') return snapshot.passive;
  const e=snapshot.skills?.[skill];if(!e) fail(`This character export has no ${SKILLS[skill]}.`);
  return 10+e.mod+(e.adv===true?5:e.adv===false?-5:0);
}
const knownFacts=(run,knowledge)=>new Set([...knowledge,...(run.state.facts??[])]);
export function available(run,choice,knowledge=[]) {
  const st=run.state,r=choice.requires??{},known=knownFacts(run,knowledge);
  if(choice.once&&((st.used??[]).includes(choice.id)||(choice.legacyFlag&&st[choice.legacyFlag]))) return false;
  if(r.bags&&!(run.snapshot.v>=2)) return false;
  if(r.facts&&!r.facts.every(f=>known.has(f))) return false;
  if(r.notFacts&&r.notFacts.some(f=>known.has(f))) return false;
  if(r.flags&&Object.entries(r.flags).some(([k,v])=>(st.flags?.[k]??false)!==v)) return false;
  if(r.minLevel&&!((run.snapshot.level??0)>=r.minLevel)) return false;
  if(choice.cost) try {spendResources(st,choice.cost);} catch {return false;}
  return true;
}
export function choicesFor(run,knowledge=[]) {
  const st=run.state;
  if(st.scene==='review') return ['confirm','cancel'].map(id=>({id}));
  if(st.scene==='town') return [{id:'resume'}];
  if(isTerminal(st.scene)) return [];
  return (questOf(run).scenes[st.scene]?.choices??[]).filter(c=>available(run,c,knowledge));
}

function roll(snapshot,check,d) {
  const {mod,adv}=checkValue(snapshot,check);
  const dice=[d(20)];if(adv===true||adv===false) dice.push(d(20));
  const face=adv===true?Math.max(...dice):adv===false?Math.min(...dice):dice[0];
  const total=face+mod;
  return {skill:check.skill??check.save??check.ability,kind:check.skill?'skill':check.save?'save':'ability',label:checkLabel(check),dice,modifier:mod,total,success:total>=check.dc};
}
function damageAmount(spec,d) {
  if(Number.isInteger(spec)) return spec;
  const [,n,sides,plus]=/^(\d+)d(\d+)(?:\+(\d+))?$/.exec(spec);
  let total=Number(plus??0);for(let i=0;i<Number(n);i++) total+=d(Number(sides));
  return total;
}
function enter(quest,state,sceneId,snapshot,outcomeText) {
  const scene=quest.scenes[sceneId];state.scene=sceneId;
  state.text=outcomeText??scene.text??'';
  const p=scene.passive,applied=state.passives??[];
  if(p&&!applied.includes(sceneId)) {
    const value=passiveValue(snapshot,p.skill);
    state.passives=[...applied,sceneId];
    state.text+='\n'+(p.note??`Passive ${SKILLS[p.skill]} {value} applied.`).replace('{value}',value);
    if(value>=p.dc) {state.text+=' '+p.success.text;state.facts=[...new Set([...(state.facts??[]),...(p.success.facts??[])])];}
  }
  return state;
}
function apply(quest,state,outcome,snapshot,d) {
  state.text=outcome.text;
  if(outcome.facts) state.facts=[...new Set([...(state.facts??[]),...outcome.facts])];
  if(outcome.flags) state.flags={...(state.flags??{}),...outcome.flags};
  if(outcome.milestone) state.milestones=[...new Set([...(state.milestones??[]),outcome.milestone])];
  if(outcome.damage!==undefined) {
    const amount=damageAmount(outcome.damage,d),absorbed=Math.min(state.tempHp,amount);
    state.tempHp-=absorbed;state.hp=Math.max(0,state.hp-(amount-absorbed));
    state.lastDamage=amount;state.text+=`\nYou take **${amount}** damage.`;
    if(state.hp===0) {state.scene='downed';state.text+='\n'+(quest.downedText??'You collapse. Wickhaven’s patrol finds you at dusk and carries you home. Your discoveries are saved, but this expedition is over.');return state;}
  }
  if(outcome.goto==='@complete') state.scene='complete';
  else if(outcome.goto==='@retreat') {state.returnTo=state.scene;state.scene='town';}
  else if(outcome.goto) enter(quest,state,outcome.goto,snapshot,outcome.text);
  return state;
}
export function transition(run,action,die=defaultDie,knowledge=[]) {
  const quest=questOf(run),state=structuredClone(run.state),snapshot=run.snapshot;
  const d=(sides=20)=>{const n=die(sides);if(!integer(n,1,sides)) fail('Invalid die.');return n;};
  if(state.scene==='review'&&action==='cancel') {
    state.scene='cancelled';state.text='Unconfirmed departure discarded. Correct your character or carried bags, then depart again.';return state;
  }
  if(state.scene==='review'&&action==='confirm') return enter(quest,state,quest.start,snapshot);
  if(state.scene==='town'&&action==='resume'&&quest.scenes[state.returnTo]) {
    state.scene=state.returnTo;state.text=quest.scenes[state.returnTo].resumeText??'You return to where you left off. Earlier discoveries and resources remain.';return state;
  }
  const choice=quest.scenes[state.scene]?.choices.find(c=>c.id===action);
  if(!choice||!available(run,choice,knowledge)) fail('That choice is no longer available. Use the latest buttons.');
  let next=choice.cost?spendResources(state,choice.cost):state;
  if(choice.once) next.used=[...(next.used??[]),choice.id];
  let outcome=choice.outcome;
  if(choice.check) {
    next.roll=roll(snapshot,choice.check,d);next.rolls=[...(next.rolls??[]),{scene:state.scene,choice:choice.id,...next.roll}];
    outcome=next.roll.success?choice.success:choice.failure;
  }
  return apply(quest,next,outcome,snapshot,d);
}
