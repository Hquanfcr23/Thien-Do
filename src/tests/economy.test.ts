import phase2Fixture from './fixtures/phase2-v2.json';
import {useGameStore} from '../state/gameStore';
import 'fake-indexeddb/auto';
import { describe,it,expect } from 'vitest';
import { createNewGame } from '../data/foundation';
import { advanceMonth,queueOrder } from '../engine/month';
import { gameStateSchema } from '../domain/schema';
import { orderSchema } from '../domain/economy';
import { crops } from '../data/economicConfig';
import { moneyTotal,grainTotal,type EconomicState } from '../engine/economyContext';
import { routeMetrics } from '../engine/transport';
import { decodeSave,exportSave,importSave,writeSave,readSave } from '../persistence/saves';
const initial=()=>createNewGame(42) as EconomicState;
describe('3.1 time, population and labour',()=>{
 it('is deterministic, immutable and has 12 monthly periods per year',()=>{const s=initial(),before=JSON.stringify(s);let a=s,b=s;for(let i=0;i<12;i++){a=advanceMonth(a) as EconomicState;b=advanceMonth(b) as EconomicState;}expect(a).toEqual(b);expect(JSON.stringify(s)).toBe(before);expect(a.calendar).toEqual({year:2,month:1});expect(a.simulation.annual).toHaveLength(1);});
 it('bounds combined labour, conserves migration population and maintains cohorts',()=>{const s=advanceMonth(initial()) as EconomicState;for(const [id,c]of Object.entries(s.simulation.counties)){const u=s.administrativeUnits.find(u=>u.id===id)!;expect(c.lastWorkers+c.lastConstruction+c.lastMilitary).toBeLessThanOrEqual(Math.floor((u.population-c.lastBirths+c.lastDeaths-c.lastMigration)*.55)+1);expect(c.farmers+c.landowners+c.artisans).toBe(u.population);}const r=s.simulation.reports[0]!;expect(r.population).toBe(initial().administrativeUnits.reduce((n,u)=>n+u.population,0)+r.births-r.deaths);});
 it('validates camera updates without cloning the simulation on every pan',()=>{const s=initial();useGameStore.getState().replaceGame(s);const economy=useGameStore.getState().game!.simulation;useGameStore.getState().updateView({x:10});expect(useGameStore.getState().game!.simulation).toBe(economy);expect(()=>useGameStore.getState().updateView({selectedId:'missing'})).toThrow();expect(()=>useGameStore.getState().updateView({zoom:Infinity})).toThrow();});
 it('rejects labour oversubscription and invalid orders',()=>{expect(orderSchema.safeParse({kind:'policy',policy:{...initial().simulation.policy,farmShare:.9,industryShare:.9}}).success).toBe(false);expect(()=>queueOrder(initial(),{kind:'grant',countyId:'bad',amount:-1})).toThrow();});
});
describe('3.2 seasonal production and inventories',()=>{
 it('never harvests outside the configured crop month',()=>{let s=initial();for(let i=0;i<24;i++){const month=s.calendar.month;s=advanceMonth(s) as EconomicState;for(const c of Object.values(s.simulation.counties))if(month!==crops[c.crop].harvest)expect(c.lastHarvest).toBe(0);}});
 it('cannot refine iron or extract ore without feedstock/deposits',()=>{const s=initial();for(const [id,c]of Object.entries(s.simulation.counties)){c.deposits={wood:0,stone:0,ore:0};const u=s.administrativeUnits.find(u=>u.id===id)!;u.resources.ore=0;u.resources.iron=0;}for(const f of Object.values(s.simulation.prefectures)){f.market.inventory.iron=0;f.market.inventory.ore=0;}const next=advanceMonth(s) as EconomicState;expect(next.simulation.reports.at(-1)!.produced.iron).toBe(0);});
 it('accounts for every grain and money flow',()=>{let s=initial();for(let i=0;i<60;i++){const before=grainTotal(s),cash=moneyTotal(s);s=advanceMonth(s) as EconomicState;const r=s.simulation.reports.at(-1)!;expect(grainTotal(s)).toBeCloseTo(before+r.harvest-r.consumed-r.loss,5);expect(moneyTotal(s)).toBeCloseTo(cash,5);}});
});
describe('3.3–3.5 market, transport, construction and finance',()=>{
 it('lowers the Phủ reference price when its real exchange stock rises',()=>{const low=initial(),high=structuredClone(low),id=Object.keys(low.simulation.prefectures)[0]!;low.simulation.policy.tradeOpen=false;high.simulation.policy.tradeOpen=false;low.simulation.prefectures[id]!.market.inventory.grain=0;high.simulation.prefectures[id]!.market.inventory.grain=100000;const a=advanceMonth(low) as EconomicState,b=advanceMonth(high) as EconomicState;expect(a.simulation.prefectures[id]!.market.demand.grain).toBe(b.simulation.prefectures[id]!.market.demand.grain);expect(b.simulation.prefectures[id]!.market.prices.grain).toBeLessThan(a.simulation.prefectures[id]!.market.prices.grain);});
 it('moves cargo with delay and preserves it during route closure',()=>{let s=initial();s.simulation.policy.tradeOpen=false;const route=s.simulation.routes[0]!,from=s.administrativeUnits.find(u=>u.id===route.from)!,to=s.administrativeUnits.find(u=>u.id===route.to)!;from.resources.stone=100;to.resources.stone=0;
  const control=advanceMonth(s);s=advanceMonth(queueOrder(s,{kind:'transfer',from:route.from,to:route.to,good:'stone',amount:10})) as EconomicState;expect(s.simulation.shipments.filter(x=>x.purpose==='private'&&x.good==='stone')).toHaveLength(1);expect(s.administrativeUnits.find(u=>u.id===route.to)!.resources.stone).toBe(control.administrativeUnits.find(u=>u.id===route.to)!.resources.stone);
  const cargo=s.simulation.shipments.find(x=>x.purpose==='private'&&x.good==='stone')!.amount;for(const r of s.simulation.routes)r.blocked=true;for(let i=0;i<3;i++)s=advanceMonth(s) as EconomicState;expect(s.simulation.shipments.find(x=>x.purpose==='private'&&x.good==='stone')!.amount).toBe(cargo);
  for(const r of s.simulation.routes)r.blocked=false;for(let i=0;i<20;i++)s=advanceMonth(s) as EconomicState;expect(s.simulation.shipments.filter(x=>x.purpose==='private'&&x.good==='stone')).toHaveLength(0);
 });
 it('supplies existing troops after deliveries, without charging upkeep twice',()=>{
  let s=initial();s.simulation.policy.tradeOpen=false;const r=s.simulation.routes[0]!;r.km=10;r.quality=1;const target=s.administrativeUnits.find(u=>u.id===r.to)!;s.simulation.prefectures[target.parentId!]!.grainReserve=1000;
  s.militaryUnits.push({id:'test-army',displayName:'Quân kiểm thử',formalName:'Quân kiểm thử',forceCategory:'LocalGarrison',roleTags:[],branches:[{kind:'infantry',strength:100}],commanderId:null,locationId:target.locationId,quality:70,morale:70,loyalty:70,supply:{food:0,equipment:0,status:'strained'},upkeep:{money:10,food:50},recruitmentProfileId:'fictional',history:[],honors:[],predecessorIds:[],provenance:{kind:'Fictional',note:'Test fixture'}});
  s=advanceMonth(queueOrder(s,{kind:'transfer',from:r.from,to:r.to,good:'grain',amount:100})) as EconomicState;
  expect(s.militaryUnits[0]!.supply.status).toBe('supplied');s=advanceMonth(s) as EconomicState;expect(s.militaryUnits[0]!.supply.status).toBe('supplied');expect(s.simulation.reports.at(-1)!.moneyError).toBeCloseTo(0,6);
 });
 it('issues relief from the national granary without teleporting or duplicating grain',()=>{const initialState=initial(),to=Object.keys(initialState.simulation.counties)[0]!;const s=advanceMonth(queueOrder(initialState,{kind:'relief',countyId:to,amount:100})) as EconomicState;expect(s.country.grainReserve).toBeCloseTo(initialState.country.grainReserve-100-s.simulation.central!.accounts.grainLoss,6);expect(s.simulation.shipments.some(x=>x.to===to&&x.good==='grain')).toBe(true);expect(s.simulation.reports[0]!.grainError).toBeCloseTo(0,6);});
 it('refuses impossible builds and constructs with finite materials and labour',()=>{let s=initial();const id=Object.keys(s.simulation.counties)[0]!;const poor=structuredClone(s);for(const f of Object.values(poor.simulation.prefectures))f.treasury=0;const failed=advanceMonth(queueOrder(poor,{kind:'build',countyId:id,building:'irrigation'})) as EconomicState;expect(failed.simulation.counties[id]!.projects).toHaveLength(0);expect(failed.simulation.lastMessages.join()).toContain('Thiếu');
  s=advanceMonth(queueOrder(s,{kind:'build',countyId:id,building:'irrigation'})) as EconomicState;expect(s.simulation.counties[id]!.projects.length).toBeGreaterThan(0);for(let i=0;i<5;i++)s=advanceMonth(s) as EconomicState;expect(s.simulation.counties[id]!.buildings.irrigation?.level).toBe(1);
 });
 it('infrastructure changes actual route capacity/time/cost',()=>{const s=initial(),r=s.simulation.routes.find(r=>r.mode==='road')!,before=routeMetrics(s,r);for(const id of [r.from,r.to])s.simulation.counties[id]!.buildings.road={level:3,condition:1};const after=routeMetrics(s,r);expect(after.capacity).toBeGreaterThan(before.capacity);expect(after.cost).toBeLessThan(before.cost);expect(after.months).toBeLessThanOrEqual(before.months);});
 it('migrates the Phase 2 fixture to Châu–Phủ–Huyện without granting inventory',()=>{const before=JSON.stringify(phase2Fixture),migrated=decodeSave(phase2Fixture),s=migrated.state;expect(migrated.schemaVersion).toBe(6);expect(s.administrativeProfile.levels.map(level=>level.id)).toEqual(['central','zhou','fu','xian']);expect(s.administrativeUnits.filter(u=>u.levelId==='jun')).toHaveLength(0);expect(s.administrativeUnits.filter(u=>u.levelId==='xian')).toHaveLength(24);expect(s.administrativeUnits.filter(u=>u.levelId==='xian').every(u=>s.administrativeUnits.find(parent=>parent.id===u.parentId)?.levelId==='fu')).toBe(true);expect(s.administrativeUnits.filter(u=>u.levelId==='fu')).toHaveLength(7);expect(s.country).toEqual(phase2Fixture.state.country);expect(JSON.stringify(phase2Fixture)).toBe(before);expect(()=>advanceMonth(s)).not.toThrow();});
 it('maps old Quận references to their Phủ and carries its treasury upward',()=>{const old=structuredClone(phase2Fixture);const junior=old.state.administrativeUnits.find(unit=>unit.levelId==='jun')!,prefecture=old.state.administrativeUnits.find(unit=>unit.id===junior.parentId)!;junior.treasury=27;old.state.geography.cities.push({id:'test-old-jun-city',name:'Test City',unitId:junior.id});const view=old.state.mapView as {level:string;selectedId:string|null};view.level='jun';view.selectedId=junior.id;const migrated=decodeSave(old);expect(migrated.state.mapView.level).toBe('fu');expect(migrated.state.mapView.selectedId).toBe(prefecture.id);expect(migrated.state.simulation!.prefectures[prefecture.id]?.treasury).toBe(27);expect(migrated.state.geography.cities.at(-1)?.unitId).toBe(prefecture.id);expect(migrated.state.administrativeUnits.some(unit=>unit.id===junior.id)).toBe(false);});
 it('roundtrips complete simulation through JSON and IndexedDB',async()=>{const s=advanceMonth(initial());expect(importSave(exportSave(s))).toEqual(s);expect(advanceMonth(importSave(exportSave(s)))).toEqual(advanceMonth(s));await writeSave('manual-3',s);expect((await readSave('manual-3'))?.state).toEqual(s);});
});
describe('3.6 multi-year integration',()=>{
 it.each([12,60,120,240])('runs %i months across seven stress scenarios and three seeds',months=>{
  for(const seed of [1,42,1701])for(const scenario of ['normal','drought','tax','labour','blocked','investment','bankrupt']){
   let s=createNewGame(seed) as EconomicState;
   if(scenario==='drought')s.simulation.weatherMode='drought';if(scenario==='tax')s.simulation.policy.landTax=.6;
   if(scenario==='labour')s.simulation.policy={...s.simulation.policy,farmShare:.1,industryShare:.1,reserveShare:.7};if(scenario==='blocked')for(const r of s.simulation.routes)r.blocked=true;
   if(scenario==='investment')for(const id of Object.keys(s.simulation.counties))s=queueOrder(s,{kind:'build',countyId:id,building:'irrigation'}) as EconomicState;
   if(scenario==='bankrupt'){s.country.treasury=0;for(const f of Object.values(s.simulation.prefectures))f.treasury=0;}
   const startMoney=moneyTotal(s),startPop=s.administrativeUnits.reduce((n,u)=>n+u.population,0);
   for(let i=0;i<months;i++)s=advanceMonth(s) as EconomicState;
   const validated=gameStateSchema.safeParse(s);expect(validated.success,`${scenario}/${seed}: ${validated.success?'':JSON.stringify(validated.error.issues)}`).toBe(true);expect(moneyTotal(s)).toBeCloseTo(startMoney,4);expect(s.administrativeUnits.reduce((n,u)=>n+u.population,0)).toBeLessThan(startPop*2);
   for(const r of s.simulation.routes)expect(r.used).toBeLessThanOrEqual(r.lastCapacity+1e-6);
  }
 },300000);
});
