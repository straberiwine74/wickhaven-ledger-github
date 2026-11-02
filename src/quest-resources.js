export const BAG_COLLECTION='6296b723c964982e890e5315';
const coins=['pp','gp','ep','sp','cp'];
const fail=message=>{throw new Error(message);};
const count=n=>Number.isInteger(n)&&n>=0&&n<=1000000;
export function importBags(loadout) {
  if(loadout.collection!==BAG_COLLECTION || !Array.isArray(loadout.bags) || !loadout.bags.length || loadout.bags.length>12) fail('Invalid carried bags.');
  const names=new Set(),items=[];
  for(const bag of loadout.bags) {
    if(!Array.isArray(bag)||bag.length!==2||typeof bag[0]!=='string'||bag[0].length<1||bag[0].length>60||/[\r\n`<>@]/.test(bag[0])||!bag[1]||Array.isArray(bag[1])||typeof bag[1]!=='object'||names.has(bag[0].toLowerCase())) fail('Invalid carried bags.');
    names.add(bag[0].toLowerCase());
    for(const [name,qty] of Object.entries(bag[1])) {
      if(typeof name!=='string'||name.length<1||name.length>80||/[\r\n`<>@]/.test(name)||!count(qty)) fail('Invalid bag item.');
      if(qty) items.push({bag:bag[0],name,qty});
    }
  }
  if(items.length>60) fail('Too many carried item entries.');
  if(!['avrae-coinpurse','bag-coin-pouch','none'].includes(loadout.coinsSource)) fail('Invalid expedition coin source.');
  return items;
}
export function resources(run) {
  return {hp:run.state.hp,tempHp:run.state.tempHp,items:structuredClone(run.state.items??[]),coins:structuredClone(run.state.coins??{})};
}
function initial(run) { return {hp:run.snapshot.hp,tempHp:run.snapshot.tempHp,items:run.snapshot.loadout.items,coins:run.snapshot.coins}; }
function keyed(items) {
  const map=new Map();
  for(const item of items) {const key=JSON.stringify([item.bag??'',item.name]);map.set(key,(map.get(key)??0)+item.qty);}
  return map;
}
export function resourceDelta(run) {
  const start=initial(run),end=resources(run),a=keyed(start.items),b=keyed(end.items);
  const items=[...new Set([...a.keys(),...b.keys()])].sort().map(key=>({bag:JSON.parse(key)[0],name:JSON.parse(key)[1],delta:(b.get(key)??0)-(a.get(key)??0)})).filter(x=>x.delta);
  const money=Object.fromEntries(coins.map(k=>[k,(end.coins[k]??0)-(start.coins[k]??0)]));
  return {hp:end.hp-start.hp,tempHp:end.tempHp-start.tempHp,items,coins:money};
}
export function hasResourceChanges(run) {
  const d=resourceDelta(run);return !!(d.hp||d.tempHp||d.items.length||Object.values(d.coins).some(Boolean));
}
export function resourceReceipt(run) {
  return {format:'btll-resource-receipt-v1',run:run.id,revision:run.revision,character:run.character_id,source:run.snapshot.loadout.source,status:run.finished?'final':'in-progress',starting:initial(run),current:resources(run),changes:resourceDelta(run),lastRoll:run.state.roll??null,writeBack:'manual; no automatic Avrae or D&D Beyond changes'};
}
export function matchesEnding(run,snapshot) {
  const end=resources(run),actual={hp:snapshot.hp,tempHp:snapshot.tempHp,items:snapshot.loadout.items,coins:snapshot.coins};
  if(end.hp!==actual.hp||end.tempHp!==actual.tempHp) return false;
  const expected=keyed(end.items),got=keyed(actual.items);
  if(expected.size!==got.size||[...expected].some(([k,v])=>got.get(k)!==v)) return false;
  // Bag aliases may make change; compare value, never double-count purses.
  const value=c=>coins.reduce((n,k)=>n+(c[k]??0)*({pp:1000,gp:100,ep:50,sp:10,cp:1}[k]),0);
  return value(end.coins)===value(actual.coins);
}
export function spendResources(state,cost) {
  // Scene-owned costs only. Validate everything before changing anything.
  const next=structuredClone(state);
  if(cost.hp!==undefined) {
    if(!count(cost.hp)||cost.hp>next.hp+next.tempHp) fail('Insufficient expedition resources.');
    const absorbed=Math.min(next.tempHp,cost.hp);next.tempHp-=absorbed;next.hp-=cost.hp-absorbed;
  }
  for(const coin of coins) if(cost.coins?.[coin]!==undefined) {
    if(!count(cost.coins[coin])||cost.coins[coin]>next.coins[coin]) fail('Insufficient expedition resources.');
    next.coins[coin]-=cost.coins[coin];
  }
  for(const item of cost.items??[]) {
    if(!count(item.qty)||item.qty===0) fail('Invalid resource cost.');
    const found=next.items.find(i=>i.name===item.name&&(i.bag??'')===(item.bag??''));
    if(!found||found.qty<item.qty) fail('Insufficient expedition resources.');
    found.qty-=item.qty;
  }
  next.items=next.items.filter(i=>i.qty>0);return next;
}
