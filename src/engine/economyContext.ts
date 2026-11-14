import { economicScenario,crops,recipes,tierEffect } from '../data/economicConfig';
import type { GameState,AdministrativeUnit } from '../domain/schema';
import { findPath,routeMetrics } from './transport';
import { emptyStock } from '../domain/economy';
import type { Simulation,Report,CountyEconomy,Stock,Good,PrefectureEconomy,Route } from '../domain/economy';
export type EconomicState=GameState&{simulation:Simulation};
type Routing={adj:Map<string,Route[]>;metrics:Map<string,ReturnType<typeof routeMetrics>>;signature:string;byId:Map<string,Route>};
const pathCache=new Map<string,Map<string,string[]>>();
export interface MonthContext {operating?:Map<string,number>;metrics?:Map<string,ReturnType<typeof routeMetrics>>;routing?:Routing;s:EconomicState;units:Map<string,AdministrativeUnit>;report:Report;taxable?:Map<string,Stock>;demands?:Map<string,Stock>;reserves?:Map<string,Stock>;quotes?:Map<string,{buy:Stock;sell:Stock}>;access?:Map<string,{path:ReturnType<typeof findPath>;cost:number;loss:number}>;weather:Map<string,{rain:number;disaster:number}>;labour:Map<string,{farm:number;industry:number;construction:number;military:number;commerce:number;total:number}>}
export const bound=(n:number,min=0,max=1)=>Math.max(min,Math.min(max,n));
export const effect=(c:Pick<CountyEconomy,'buildings'>,key:string)=>(c.buildings[key]?.level??0)*(c.buildings[key]?.condition??0);
export function stock(u:AdministrativeUnit,key:keyof Stock):number{return u.resources[key]??0;}
export function random(sim:Simulation){sim.rng=(Math.imul(sim.rng,1664525)+1013904223)>>>0;return sim.rng/4294967296;}
export function moneyTotal(s:EconomicState){return s.country.treasury+s.administrativeUnits.reduce((n,u)=>n+(u.treasury??0),0)+Object.values(s.simulation.counties).reduce((n,c)=>n+c.privateMoney,0)+Object.values(s.simulation.prefectures).reduce((n,f)=>n+f.treasury+f.market.merchantMoney,0);}
export function projectStock(s:EconomicState,g:Good){return [...Object.values(s.simulation.counties),...Object.values(s.simulation.prefectures)].reduce((n,c)=>n+c.projects.reduce((v,p)=>v+p.materials[g],0),0);}
export function grainTotal(s:EconomicState){return projectStock(s,'grain')+s.country.grainReserve+s.administrativeUnits.reduce((n,u)=>n+stock(u,'grain'),0)+Object.values(s.simulation.prefectures).reduce((n,f)=>n+f.grainReserve+f.market.inventory.grain+f.market.publicListings.grain,0)+s.simulation.shipments.filter(x=>x.good==='grain').reduce((n,x)=>n+x.amount,0);}
export function spendPrivate(_ctx:MonthContext,u:AdministrativeUnit,c:CountyEconomy,cost:number){void _ctx;void u;return Math.min(c.privateMoney,cost); /* Local wages/services circulate within the same aggregated private purse. */}

export function goodsTotal(s:EconomicState,g:Good){return projectStock(s,g)+(g==='grain'?s.country.grainReserve:0)+s.administrativeUnits.reduce((n,u)=>n+stock(u,g),0)+Object.values(s.simulation.prefectures).reduce((n,f)=>n+f.market.inventory[g]+f.market.publicListings[g]+(g==='grain'?f.grainReserve:0),0)+s.simulation.shipments.filter(x=>x.good===g).reduce((n,x)=>n+x.amount,0);}

export function armyCounty(s:EconomicState,locationId:string){
 let unit=s.administrativeUnits.find(u=>u.locationId===locationId);
 if(unit?.parentId===null)return s.administrativeUnits.find(u=>u.id===capitalCounty(s));
 while(unit&&!s.simulation.counties[unit.id]){const parent=unit.id;unit=s.administrativeUnits.find(u=>u.parentId===parent);}
 return unit;
}

export function capitalCounty(s:EconomicState){return s.geography.cities.find(c=>c.id===economicScenario.capitalCityId)?.unitId??Object.keys(s.simulation.counties)[0]??'';}

export function prefectureId(ctx:Pick<MonthContext,'s'|'units'>,id:string):string{
 const u=ctx.units.get(id);const fu=u?.levelId==='fu'?u.id:u?.parentId;
 if(!fu||!ctx.s.simulation.prefectures[fu])throw Error(`Không có Phủ chủ quản: ${id}`);return fu;
}
export function prefectureOf(ctx:Pick<MonthContext,'s'|'units'>,id:string):PrefectureEconomy{return ctx.s.simulation.prefectures[prefectureId(ctx,id)]!;}
export function policyFor(ctx:Pick<MonthContext,'s'|'units'>,id:string){const fu=prefectureId(ctx,id),zhou=ctx.units.get(fu)?.parentId;return (zhou?ctx.s.simulation.zhouPolicies[zhou]:undefined)??ctx.s.simulation.policy;}
export function countyDemand(ctx:Pick<MonthContext,'s'|'units'|'demands'>,id:string):Stock{
 ctx.demands??=new Map();const cached=ctx.demands.get(id);if(cached)return cached;const u=ctx.units.get(id)!,c=ctx.s.simulation.counties[id]!;const d=emptyStock(),winter=ctx.s.calendar.month>=10||ctx.s.calendar.month<=2;
 d.grain=u.population*.025*(winter?1.15:1)+c.lastMilitary*.015;
 d.cloth=u.population*.0005;d.tools=c.land*.0003;
 for(const recipe of recipes){if(recipe.output==='equipment'&&c.buildings.fort===undefined)continue;const batches=recipe.rate*(1+effect(c,'workshop'));for(const [g,n]of Object.entries(recipe.inputs))d[g as Good]+=n*batches;}
 d.tools=Math.max(d.tools,c.land*.01/12); // Replacement wear plus maintaining a crop-tool stock; not speculative military shopping.
 ctx.demands.set(id,d);return d;
}
export function marketAccess(ctx:Pick<MonthContext,'s'|'units'|'access'|'routing'|'metrics'>,id:string){
 ctx.access??=new Map();const cached=ctx.access.get(id);if(cached)return cached;
 const f=prefectureOf(ctx,id),seat=f.seatCountyId,sim=ctx.s.simulation;
 if(!ctx.routing){const metrics=new Map(sim.routes.map(r=>[r.id,metricsFor(ctx,r)])),adj=new Map<string,Route[]>();
  for(const r of sim.routes)for(const endpoint of [r.from,r.to]){if(!adj.has(endpoint))adj.set(endpoint,[]);adj.get(endpoint)!.push(r);}
  ctx.routing={metrics,adj,byId:new Map(sim.routes.map(r=>[r.id,r])),signature:JSON.stringify([Object.keys(sim.counties),sim.routes.map(r=>[r.id,r.from,r.to,r.blocked,metrics.get(r.id)!.months])])};
 }
 const {metrics,adj,byId,signature}=ctx.routing,key=signature+':'+seat;let paths=pathCache.get(key);
 if(!paths){const open=new Set(Object.keys(sim.counties)),dist=new Map([[seat,0]]),previous=new Map<string,Route>();
  while(open.size){let at:string|undefined,best=Infinity;for(const candidate of open){const d=dist.get(candidate)??Infinity;if(d<best){best=d;at=candidate;}}if(!at)break;open.delete(at);
   for(const r of adj.get(at)??[]){if(r.blocked)continue;const to=r.from===at?r.to:r.from;if(!open.has(to))continue;const d=best+metrics.get(r.id)!.months;if(d<(dist.get(to)??Infinity)){dist.set(to,d);previous.set(to,r);}}
  }
  paths=new Map();const count=Object.keys(sim.counties).length;
  for(const countyId of Object.keys(sim.counties)){const path:string[]=[];let at=countyId;for(let hops=0;at!==seat&&hops<count;hops++){const r=previous.get(at);if(!r){path.length=0;break;}path.push(r.id);at=r.from===at?r.to:r.from;}paths.set(countyId,path);}
  if(pathCache.size>=64)pathCache.delete(pathCache.keys().next().value!);pathCache.set(key,paths);
 }
 for(const countyId of Object.keys(sim.counties)){if(prefectureOf(ctx,countyId)!==f)continue;const path=(paths.get(countyId)??[]).map(id=>byId.get(id)!);
  ctx.access.set(countyId,{path,cost:path.reduce((n,r)=>n+metrics.get(r.id)!.cost,0),loss:1-path.reduce((n,r)=>n*(1-metrics.get(r.id)!.loss),1)});
 }
 return ctx.access.get(id)!;
}

export function localPrice(ctx:Pick<MonthContext,'s'|'units'|'access'|'quotes'|'routing'|'metrics'>,id:string,good:Good,side:'buy'|'sell'='buy'){
 ctx.quotes??=new Map();const cached=ctx.quotes.get(id);if(cached)return cached[side][good];
 const f=prefectureOf(ctx,id),a=marketAccess(ctx,id),quote={buy:emptyStock(),sell:emptyStock()},disconnected=id!==f.seatCountyId&&!a.path.length;
 for(const g of Object.keys(quote.buy) as Good[]){const ref=f.market.prices[g];quote.buy[g]=disconnected?ref*6:(ref+a.cost)/Math.max(.01,1-a.loss);quote.sell[g]=disconnected?0:Math.max(0,ref*(1-a.loss)-a.cost);}
 ctx.quotes.set(id,quote);return quote[side][good];
}

export function effectFor(ctx:Pick<MonthContext,'s'|'units'>,id:string,key:string){return effect(ctx.s.simulation.counties[id]!,key)+effect(prefectureOf(ctx,id),key);}
// New production is local; inherited Phủ buildings retain their old regional effects.
export function productionEffect(ctx:Pick<MonthContext,'s'|'units'>,id:string,key:string,values:readonly number[],legacyStep:number){
 const local=ctx.s.simulation.counties[id]!.buildings[key],regional=prefectureOf(ctx,id).buildings[key];
 return tierEffect(local,values,legacyStep)+(regional?.legacy?regional.level*regional.condition*legacyStep:0);
}
const owners=new WeakMap<EconomicState,Map<string,string>>();
export function regionOf(s:EconomicState,id:string){let index=owners.get(s);if(!index){index=new Map(s.administrativeUnits.map(u=>[u.id,u.parentId??'']));owners.set(s,index);}return s.simulation.prefectures[index.get(id)??''];}

export function metricsFor(ctx:Pick<MonthContext,'s'|'metrics'>,route:Route){ctx.metrics??=new Map();const old=ctx.metrics.get(route.id);if(old)return old;const metrics=routeMetrics(ctx.s,route);ctx.metrics.set(route.id,metrics);return metrics;}

const terrainIndex=new WeakMap<EconomicState,Map<string,string>>();
export function terrainOf(s:EconomicState,id:string){let index=terrainIndex.get(s);if(!index){index=new Map(s.administrativeUnits.map(u=>[u.id,u.terrain]));terrainIndex.set(s,index);}return index.get(id);}

// Private food safety stock covers the actual next crop, winter rations and seed, not a fixed six months.
export function householdReserve(ctx:Pick<MonthContext,'s'|'units'|'demands'|'reserves'>,id:string,good:Good){
 ctx.reserves??=new Map();const cached=ctx.reserves.get(id);if(cached)return cached[good];
 const needs=countyDemand(ctx,id),reserves={...needs};for(const g of Object.keys(reserves) as Good[])reserves[g]*=2;
 const c=ctx.s.simulation.counties[id]!,u=ctx.units.get(id)!,crop=crops[c.crop],month=ctx.s.calendar.month,months=(crop.harvest-month+12)%12||12;
 let food=0;for(let k=1;k<=months;k++){const m=(month+k-1)%12+1;food+=u.population*.025*(m>=10||m<=2?1.15:1)+c.lastMilitary*.015;}
 reserves.grain=food*1.05+(c.sown<=0?c.land*.04:0);ctx.reserves.set(id,reserves);return reserves[good];
}
