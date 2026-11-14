import 'fake-indexeddb/auto';
import {describe,it,expect} from 'vitest';
import {createNewGame} from '../data/foundation';
import {buildings,coreBuildingKinds,buildingPackage,buildingUpkeep,tierEffect} from '../data/economicConfig';
import {goods,emptyStock,type Report} from '../domain/economy';
import {gameStateSchema} from '../domain/schema';
import {startBuilding,construction} from '../engine/construction';
import {routeMetrics,transport} from '../engine/transport';
import {quoteBuilding} from '../engine/buildingRules';
import {productionEffect,moneyTotal,goodsTotal,type MonthContext,type EconomicState} from '../engine/economyContext';
import {grainStoreLoss} from '../engine/budget';
import {marketOrders} from '../engine/marketOrders';
import {advanceMonth,queueOrder} from '../engine/month';
import {makeSave,decodeSave,exportSave,importSave,writeSave,readSave} from '../persistence/saves';

function context():MonthContext{
 const s=createNewGame(42) as EconomicState;
 const report:Report={...s.calendar,produced:emptyStock(),used:emptyStock(),destroyed:emptyStock(),goodsError:emptyStock(),population:0,births:0,deaths:0,migration:0,harvest:0,consumed:0,loss:0,tax:0,spending:0,treasury:0,grain:0,shortageCount:0,moneyError:0,grainError:0,notes:[]};
 const ctx:MonthContext={s,units:new Map(s.administrativeUnits.map(u=>[u.id,u])),report,weather:new Map(),labour:new Map()};
 for(const c of Object.values(s.simulation.counties))c.projects=[];
 for(const f of Object.values(s.simulation.prefectures)){f.treasury=20000;f.fiscalPolicy.cashBufferMonths=0;for(const g of goods)f.market.inventory[g]=10000;}
 for(const id of Object.keys(s.simulation.counties))ctx.labour.set(id,{farm:5000,industry:2000,commerce:500,military:0,construction:400,total:10000});
 return ctx;
}
const site=(c:MonthContext)=>Object.values(c.s.simulation.prefectures)[0]!.seatCountyId;
function finish(c:MonthContext,id:string,max=50){const target=c.s.simulation.counties[id]??c.s.simulation.prefectures[id]!;for(let i=0;i<max&&target.projects.length;i++)construction(c);expect(target.projects).toHaveLength(0);}

describe('core building packages and restrictions',()=>{
 it('offers seven kinds and scales actual labour, material bills and upkeep by level',()=>{
  expect(coreBuildingKinds).toHaveLength(7);expect(buildingUpkeep('farm',{level:2,condition:1})).toBeCloseTo(buildings.farm.maintenance*2.5);expect(buildingUpkeep('farm',{level:5,condition:1,legacy:true})).toBeCloseTo(buildings.farm.maintenance*5);
  for(const kind of coreBuildingKinds){const base=buildingPackage(kind,0);for(const [level,scale,upkeep] of [[0,1,1],[1,1.5,2.5],[2,2,4.5]]){const q=buildingPackage(kind,level!);expect(q.money).toBe(base.money*scale!);expect(q.work).toBe(base.work*scale!);for(const g of goods)expect(q.materials[g]??0).toBe((base.materials[g]??0)*scale!);expect(q.maintenance).toBeCloseTo(buildings[kind].maintenance*upkeep!);}}
 });
 it('rejects wrong locations, max level, duplicate work and hidden new builds without spending',()=>{
  const c=context(),id=site(c),fu=c.units.get(id)!.parentId!,before=moneyTotal(c.s);
  for(const r of c.s.simulation.routes)r.mode='road';expect(()=>startBuilding(c,id,'port',undefined,true)).toThrow('tuyến thủy');
  expect(()=>startBuilding(c,id,'granary')).toThrow('Phủ');expect(()=>startBuilding(c,fu,'workshop')).toThrow('Huyện');expect(()=>startBuilding(c,id,'bridge')).toThrow('cũ');
  c.s.simulation.counties[id]!.buildings.farm={level:3,condition:1};expect(()=>startBuilding(c,id,'farm')).toThrow('3 cấp');
  startBuilding(c,id,'irrigation');expect(()=>startBuilding(c,id,'irrigation')).toThrow('đang thi công');expect(moneyTotal(c.s)).toBe(before);
 });
 it('uses diminishing returns and condition without giving new Phủ bonuses to every county',()=>{
  const c=context(),id=site(c),v=c.s.simulation.counties[id]!,f=c.s.simulation.prefectures[c.units.get(id)!.parentId!]!;
  v.buildings.farm={level:2,condition:.5};f.buildings.farm={level:2,condition:1};expect(productionEffect(c,id,'farm',[0,.1,.18,.24],.1)).toBe(.09);
  f.buildings.farm.legacy=true;expect(productionEffect(c,id,'farm',[0,.1,.18,.24],.1)).toBeCloseTo(.29);
  expect(tierEffect({level:3,condition:.5},[0,.1,.18,.24],.1)).toBe(.12);
 });
 it('charges exactly the tier-2 bill, consumes actual materials and preserves every silver transfer',()=>{
  const c=context(),id=site(c),v=c.s.simulation.counties[id]!;v.buildings.farm={level:1,condition:1};
  const f=c.s.simulation.prefectures[c.units.get(id)!.parentId!]!,cash=moneyTotal(c.s),wood=goodsTotal(c.s,'wood'),tools=goodsTotal(c.s,'tools');
  startBuilding(c,id,'farm');expect(v.projects[0]).toMatchObject({required:1800,costScale:1.5});finish(c,id);
  expect(v.buildings.farm).toMatchObject({level:2});expect(f.accounts.construction).toBeCloseTo(450,8);
  expect(wood-goodsTotal(c.s,'wood')).toBeCloseTo(45,8);expect(tools-goodsTotal(c.s,'tools')).toBeCloseTo(7.5,8);expect(moneyTotal(c.s)).toBeCloseTo(cash,8);
 });
 it('pauses without materials or cash, and includes scaled materials in market demand',()=>{
  const c=context(),id=site(c),v=c.s.simulation.counties[id]!,f=c.s.simulation.prefectures[c.units.get(id)!.parentId!]!;
  c.s.simulation.policy.tradeOpen=false;v.lastConstruction=400;v.buildings.farm={level:1,condition:1};for(const g of goods)f.market.inventory[g]=0;
  startBuilding(c,id,'farm');construction(c);expect(v.projects[0]!.work).toBe(0);expect(v.projects[0]!.pausedReason).toContain('thiếu vật tư');
  expect(marketOrders(c).get(c.units.get(id)!.parentId!)!.buy.wood).toBeCloseTo(10,8);
  for(const g of goods)f.market.inventory[g]=10000;f.treasury=0;construction(c);expect(v.projects[0]!.work).toBe(0);expect(v.projects[0]!.pausedReason).toContain('Ngân khố');
 });
 it('reduces public granary loss only, counts every grain loss, and supports damaged warehouses',()=>{
  const c=context(),[id,f]=Object.entries(c.s.simulation.prefectures)[0]!;f.grainReserve=500;f.market.inventory.grain=100;f.market.publicListings.grain=100;f.buildings.granary={level:1,condition:1};
  const before=goodsTotal(c.s,'grain');grainStoreLoss(c,id);expect(f.grainReserve).toBeCloseTo(495.5);expect(f.market.inventory.grain).toBeCloseTo(98.8);expect(f.market.publicListings.grain).toBeCloseTo(98.8);expect(before-goodsTotal(c.s,'grain')).toBeCloseTo(c.report.loss,8);
  f.grainReserve=500;f.buildings.granary.condition=.5;grainStoreLoss(c,id);expect(f.grainReserve).toBeCloseTo(494.75);
 });
});

describe('per-route construction and transport',()=>{
 it('applies the chosen route bonus only, retaining physical travel time and closure',()=>{
  const c=context();c.s.calendar.month=6;const r=c.s.simulation.routes[0]!,other=c.s.simulation.routes[1]!;r.km=300;
  const before=routeMetrics(c.s,r),otherBefore=routeMetrics(c.s,other);
  for(const [level,capacity,discount] of [[1,1.25,.9],[2,1.45,.82],[3,1.6,.75]]){r.upgrade={level:level!,condition:1,ownerId:c.units.get(r.from)!.parentId!,baseScale:1};const after=routeMetrics(c.s,r);expect(after.capacity/before.capacity).toBeCloseTo(capacity!,8);expect(after.cost/before.cost).toBeCloseTo(discount!,8);expect(after.loss/before.loss).toBeCloseTo(discount!,8);expect(after.months).toBeGreaterThanOrEqual(1);expect(after.months).toBeLessThanOrEqual(before.months);expect(routeMetrics(c.s,other)).toEqual(otherBefore);}
  r.blocked=true;expect(routeMetrics(c.s,r).capacity).toBe(0);
 });
 it('quotes geography, refuses wrong/duplicate routes, and builds and maintains only the selected route',()=>{
  const c=context(),id=site(c),fu=c.units.get(id)!.parentId!,r=c.s.simulation.routes.find(r=>r.from===id||r.to===id)!;
  r.km=100;for(const endpoint of [r.from,r.to])c.units.get(endpoint)!.terrain='plain';
  expect(quoteBuilding(c.s,id,'road',r.id).definition.work).toBe(2000);
  const cost=quoteBuilding(c.s,id,'road',r.id).definition.money;r.km=200;expect(quoteBuilding(c.s,id,'road',r.id).definition.money).toBe(cost*2);r.km=100;
  c.units.get(r.to)!.terrain='mountains';expect(quoteBuilding(c.s,id,'road',r.id).baseScale).toBe(1.75);c.units.get(r.to)!.terrain='plain';
  expect(()=>startBuilding(c,id,'road')).toThrow('Chọn tuyến');startBuilding(c,id,'road',r.id);expect(()=>startBuilding(c,r.to===id?r.from:r.to,'road',r.id)).toThrow('đang thi công');
  const money=moneyTotal(c.s);finish(c,id);expect(r.upgrade).toMatchObject({level:1,ownerId:fu,baseScale:1});expect(c.s.simulation.counties[id]!.buildings.road).toBeUndefined();expect(c.s.simulation.prefectures[fu]!.accounts.construction).toBeCloseTo(530);expect(moneyTotal(c.s)).toBeCloseTo(money,8);
  expect(importSave(exportSave(c.s))).toEqual(c.s);
  const invalid=structuredClone(c.s);invalid.simulation.routes.find(x=>x.id===r.id)!.upgrade!.ownerId='missing';expect(gameStateSchema.safeParse(invalid).success).toBe(false);
 });
});

describe('save compatibility and bounded integration',()=>{
 it('preserves old levels, prepaid projects, cargo and queued builds without minting; resumes delivery',()=>{
  const c=context(),r=c.s.simulation.routes[0]!,id=r.to,target=c.s.simulation.counties[id]!;
  target.buildings.farm={level:5,condition:.65};target.projects=[{building:'port',work:120,required:900,materials:{...emptyStock(),wood:10},legacyFunded:true,pausedReason:'Chờ vật tư'}];
  c.s.simulation.shipments.push({id:c.s.simulation.nextId++,from:r.from,to:id,good:'wood',amount:5,purpose:'construction',prefectureId:c.units.get(id)!.parentId!,projectTargetId:id,building:'port',path:[r.id],leg:0,remaining:0,entered:false});
  c.s.simulation.orders.push({kind:'build',countyId:site(c),building:'market'});
  const raw=makeSave(c.s);delete raw.state.simulation!.buildingRules;const snapshot=JSON.stringify(raw),cash=moneyTotal(c.s),wood=goodsTotal(c.s,'wood');
  const loaded=decodeSave(raw).state as EconomicState;
  expect(JSON.stringify(raw)).toBe(snapshot);expect(loaded.simulation.counties[id]!.buildings.farm).toEqual({level:5,condition:.65,legacy:true});expect(loaded.simulation.counties[id]!.projects).toEqual(target.projects);expect(loaded.simulation.shipments).toEqual(c.s.simulation.shipments);expect(loaded.simulation.orders[0]).toMatchObject({legacy:true});
  expect(moneyTotal(loaded)).toBe(cash);expect(goodsTotal(loaded,'wood')).toBe(wood);
  expect(tierEffect(loaded.simulation.counties[id]!.buildings.farm,[0,.1,.18,.24],.1)).toBeCloseTo(.325);
  const ctx={...c,s:loaded,units:new Map(loaded.administrativeUnits.map(u=>[u.id,u]))};
  for(let i=0;i<30&&loaded.simulation.shipments.length;i++)transport(ctx);
  expect(loaded.simulation.shipments).toHaveLength(0);expect(loaded.simulation.counties[id]!.projects[0]!.materials.wood).toBeGreaterThan(10);
  expect(importSave(exportSave(loaded))).toEqual(loaded);
 });
 it('keeps in-progress scaled work and route selection through IndexedDB reload',async()=>{
  const c=context(),id=site(c),r=c.s.simulation.routes.find(r=>r.from===id||r.to===id)!;startBuilding(c,id,'road',r.id);construction(c);
  await writeSave('manual-3',c.s);const restored=(await readSave('manual-3'))!.state;expect(restored).toEqual(c.s);expect(advanceMonth(restored)).toEqual(advanceMonth(c.s));
 });
 it.each([42,1701])('conserves silver and goods for 24 months with new/old projects and changing routes (seed %s)',seed=>{
  let s=createNewGame(seed) as EconomicState;const f=Object.values(s.simulation.prefectures)[0]!,id=f.seatCountyId,r=s.simulation.routes.find(r=>r.from===id||r.to===id)!;f.treasury=10000;for(const g of goods)f.market.inventory[g]=1000;
  s=queueOrder(s,{kind:'build',countyId:id,building:'irrigation'}) as EconomicState;s=queueOrder(s,{kind:'build',countyId:id,building:'road',routeId:r.id}) as EconomicState;
  for(let month=0;month<24;month++){
   if(month===8)s=queueOrder(s,{kind:'route',routeId:r.id,blocked:true}) as EconomicState;
   if(month===10)s=queueOrder(s,{kind:'route',routeId:r.id,blocked:false}) as EconomicState;
   if(month===12)s.simulation.weatherMode='drought';
   const cash=moneyTotal(s);s=advanceMonth(s) as EconomicState;const report=s.simulation.reports.at(-1)!;
   expect(moneyTotal(s)).toBeCloseTo(cash,6);expect(Math.abs(report.moneyError)).toBeLessThan(1e-5);expect(Math.abs(report.grainError)).toBeLessThan(1e-5);for(const g of goods)expect(report.goodsError[g]).toBeLessThan(1e-5);
   for(const route of s.simulation.routes)expect(route.used).toBeLessThanOrEqual(route.lastCapacity+1e-6);
   expect(gameStateSchema.safeParse(s).success).toBe(true);
   if(month===11)s=importSave(exportSave(s)) as EconomicState;
  }
 });
});
