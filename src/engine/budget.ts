import {tierBonus} from '../data/economicConfig';
import {targetUpkeep,routeUpkeep} from './buildingRules';
import type {Order} from '../domain/economy';
import {capitalCounty,effect,type MonthContext} from './economyContext';
import {findPath,routeMetrics} from './transport';
export function reserveTarget(ctx:Pick<MonthContext,'s'|'units'>,id:string){const f=ctx.s.simulation.prefectures[id]!;return ctx.s.administrativeUnits.filter(u=>u.parentId===id).reduce((n,u)=>n+u.population*.025,0)*f.fiscalPolicy.reserveMonths;}
export function operatingCost(ctx:Pick<MonthContext,'s'|'units'|'operating'>,id:string){ctx.operating??=new Map();const old=ctx.operating.get(id);if(old!==undefined)return old;const f=ctx.s.simulation.prefectures[id]!;let due=targetUpkeep(f);for(const u of ctx.s.administrativeUnits.filter(u=>u.parentId===id)){const c=ctx.s.simulation.counties[u.id]!;due+=c.households*.004*f.fiscalPolicy.administrationShare+targetUpkeep(c);}due+=ctx.s.simulation.routes.filter(r=>r.upgrade?.ownerId===id).reduce((n,r)=>n+routeUpkeep(r),0);ctx.operating.set(id,due);return due;}
export function cashFloor(ctx:Pick<MonthContext,'s'|'units'|'operating'>,id:string){return operatingCost(ctx,id)*ctx.s.simulation.prefectures[id]!.fiscalPolicy.cashBufferMonths;}
export function spendable(ctx:Pick<MonthContext,'s'|'units'|'operating'>,id:string){return Math.max(0,ctx.s.simulation.prefectures[id]!.treasury-cashFloor(ctx,id));}
export function offerGrain(ctx:MonthContext,id:string,requested:number){const f=ctx.s.simulation.prefectures[id];if(!f)throw Error('Phủ không tồn tại');const available=Math.max(0,f.grainReserve-reserveTarget(ctx,id)),amount=Math.min(requested,available);f.grainReserve-=amount;f.market.publicListings.grain+=amount;return amount;}
export function preparePublicReserves(ctx:MonthContext){for(const [id,f]of Object.entries(ctx.s.simulation.prefectures)){
 // Withdrawing an unfilled offer is a local change of allocation, not new grain.
 const reclaim=Math.min(f.market.publicListings.grain,Math.max(0,reserveTarget(ctx,id)-f.grainReserve));f.market.publicListings.grain-=reclaim;f.grainReserve+=reclaim;
 if(f.fiscalPolicy.autoSell)offerGrain(ctx,id,Math.max(0,ctx.s.administrativeUnits.filter(u=>u.parentId===id).reduce((n,u)=>n+u.population*.025,0)-f.market.publicListings.grain));
}}
export function applyFiscalOrder(ctx:MonthContext,order:Order){const sim=ctx.s.simulation;
 if(order.kind==='fiscal'){const f=sim.prefectures[order.prefectureId];if(!f)throw Error('Phủ không tồn tại');f.fiscalPolicy={...order.policy};}
 if(order.kind==='withdraw-grain'){const f=sim.prefectures[order.prefectureId];if(!f)throw Error('Phủ không tồn tại');const amount=Math.min(order.amount,f.market.publicListings.grain);f.market.publicListings.grain-=amount;f.grainReserve+=amount;}
 if(order.kind==='sell-grain'){const amount=offerGrain(ctx,order.prefectureId,order.amount);ctx.report.notes.push(`Chào bán ${amount.toFixed(1)} thạch lương công; chờ người mua trả bạc, giữ mức dự trữ.`);}
 if(order.kind==='buy-grain'){const f=sim.prefectures[order.prefectureId];if(!f)throw Error('Phủ không tồn tại');const amount=Math.min(order.amount,f.market.inventory.grain,f.treasury/Math.max(.001,f.market.prices.grain)),cash=amount*f.market.prices.grain;if(amount<=0)throw Error('Thiếu bạc hoặc lương trên sàn');f.market.inventory.grain-=amount;f.grainReserve+=amount;f.treasury-=cash;f.market.merchantMoney+=cash;f.accounts.grainPurchases+=cash;ctx.report.spending+=cash;}
 if(order.kind==='budget-transfer'){
  if(order.from===order.to)throw Error('Nguồn và đích trùng nhau');const source=order.from==='central'?ctx.s.country:sim.prefectures[order.from],to=order.to==='central'?ctx.s.country:sim.prefectures[order.to];if(!source||!to||source.treasury<order.amount)throw Error('Sai đơn vị hoặc thiếu ngân sách');source.treasury-=order.amount;to.treasury+=order.amount;if(order.from!=='central')sim.prefectures[order.from]!.accounts.transfersOut+=order.amount;if(order.to!=='central')sim.prefectures[order.to]!.accounts.transfersIn+=order.amount;
 }
 if(order.kind==='reserve-transfer'){
  if(order.from===order.to)throw Error('Nguồn và đích trùng nhau');const source=order.from==='central'?ctx.s.country:sim.prefectures[order.from],to=order.to==='central'?ctx.s.country:sim.prefectures[order.to];if(!source||!to)throw Error('Đơn vị không tồn tại');const from=order.from==='central'?capitalCounty(ctx.s):sim.prefectures[order.from]!.seatCountyId,dest=order.to==='central'?capitalCounty(ctx.s):sim.prefectures[order.to]!.seatCountyId;
  const available=order.from==='central'?ctx.s.country.grainReserve:sim.prefectures[order.from]!.grainReserve-reserveTarget(ctx,order.from),path=from===dest?[]:findPath(ctx.s,from,dest),cost=path.reduce((n,r)=>n+routeMetrics(ctx.s,r).cost*order.amount,0);
  if(available+1e-8<order.amount||source.treasury<cost||from!==dest&&!path.length||path.some(r=>routeMetrics(ctx.s,r).capacity<order.amount))throw Error('Thiếu lương vượt mức dự trữ, bạc cước hoặc tuyến/công suất');
  if(order.from==='central')ctx.s.country.grainReserve-=order.amount;else sim.prefectures[order.from]!.grainReserve-=order.amount;source.treasury-=cost;sim.counties[from]!.privateMoney+=cost;ctx.report.spending+=cost;
  if(from===dest){if(order.to==='central')ctx.s.country.grainReserve+=order.amount;else sim.prefectures[order.to]!.grainReserve+=order.amount;}
  else sim.shipments.push({id:sim.nextId++,from,to:dest,good:'grain',amount:order.amount,purpose:'reserve',prefectureId:order.to==='central'?null:order.to,projectTargetId:null,building:null,path:path.map(r=>r.id),leg:0,remaining:0,entered:false});
 }
}
export function grainStoreLoss(ctx:MonthContext,id:string){
 const f=ctx.s.simulation.prefectures[id]!,population=ctx.s.administrativeUnits.filter(u=>u.parentId===id).reduce((n,u)=>n+u.population,0),b=f.buildings.granary,level=effect(f,'granary'),legacy=b?.legacy??false;
 const capacity=legacy?population*.05*(1+level):population*.05+2500*level;
 const total=f.grainReserve+f.market.inventory.grain+f.market.publicListings.grain;
 const baseRate=legacy?.012/(1+level):.012-tierBonus(b?.level??0,[0,.003,.0045,.006])*(b?.condition??0);
 const rate=baseRate+.04*Math.max(0,(legacy?total:f.grainReserve)-capacity)/Math.max(1,legacy?total:f.grainReserve);
 for(const container of ['reserve','private','public'] as const){const stock=container==='reserve'?f.grainReserve:container==='private'?f.market.inventory.grain:f.market.publicListings.grain,loss=stock*(legacy||container==='reserve'?rate:.012);if(container==='reserve')f.grainReserve-=loss;else if(container==='private')f.market.inventory.grain-=loss;else f.market.publicListings.grain-=loss;ctx.report.loss+=loss;}
}
