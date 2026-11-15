// Quest registry. Add a quest by creating a data file in this folder and
// listing it here; validateQuest() runs at startup and in the test suite.
import drownedWatch from './drowned-watch.js';
import briarfallRoad from './briarfall-road.js';
import saintOrrasOrchard from './saint-orras-orchard.js';
import brinehookUndercroft from './brinehook-undercroft.js';
import secondBeacon from './second-beacon.js';
// Thaleryn quests (November 2026). The five above are hidden: kept so old runs and journals still read.
import northernShallows from './northern-shallows.js';
import easternLights from './eastern-lights.js';
import impossibleRoad from './impossible-road.js';
import lowsideDiggers from './lowside-diggers.js';
import ashSealedLedger from './ash-sealed-ledger.js';
import { validateQuest } from '../quest-schema.js';

export const quests=Object.fromEntries([drownedWatch,briarfallRoad,saintOrrasOrchard,brinehookUndercroft,secondBeacon,northernShallows,easternLights,impossibleRoad,lowsideDiggers,ashSealedLedger].map(q=>[q.id,validateQuest(q)]));
export const getQuest=id=>Object.hasOwn(quests,id)?quests[id]:null;
// Tests register throwaway quests through this; the bot never calls it.
export function registerQuest(q) { if(Object.hasOwn(quests,q.id)) throw new Error(`Quest ${q.id} already exists.`); quests[q.id]=validateQuest(q); return quests[q.id]; }
