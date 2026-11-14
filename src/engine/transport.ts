import {routeBonus,routeBonuses} from '../data/economicConfig';
import { liquidateTax } from './market';
import type { Route,Good } from '../domain/economy';
import { metricsFor,bound,effect,regionOf,terrainOf,stock,type EconomicState,type MonthContext } from './economyContext';
export function routeMetrics(s:EconomicState,r:Route){
 const a=s.simulation.counties[r.from]!,b=s.simulation.counties[r.to]!,winter=s.calendar.month>=10||s.calendar.month<=2;
 const fa=regionOf(s,r.from),fb=regionOf(s,r.to),ea=(key:string)=>effect(a,key)+(fa?effect(fa,key):0),eb=(key:string)=>effect(b,key)+(fb?effect(fb,key):0);
 const infrastructure=(ea('road')+eb('road'))/2,water=(ea('port')+eb('port')+ea('canal')+eb('canal'))/2;
 const improvement=r.mode==='river'?water:infrastructure;
 const bridge=(ea('bridge')+eb('bridge'))/2,depot=(ea('depot')+eb('depot'))/2,relay=(ea('relay')+eb('relay'))/2;
 const seasonal=r.mode==='river'?(winter?.45:s.simulation.weatherMode==='drought'?.35:1):(winter?.65:1);
 return{capacity:r.blocked?0:r.capacity*seasonal*(.4+r.quality*.6)*(1+.4*improvement+.15*depot+.15*bridge)*(1+routeBonus(r,routeBonuses.capacity)),months:Math.max(1,Math.ceil(r.km/((r.mode==='river'?180:90)*seasonal*(.5+r.quality/2)*(1+.3*improvement+.2*relay+.1*bridge)*(1+routeBonus(r,routeBonuses.speed))))),cost:r.km*(r.mode==='river'?.0005:.0012)/(1+.25*improvement)*(1-routeBonus(r,routeBonuses.discount)),loss:bound((.02*(1-r.quality)+.005/(1+depot+ea('fort')+eb('fort')))*bound(r.km/100,.5,3)*(terrainOf(s,r.from)==='mountains'||terrainOf(s,r.to)==='mountains'?1.4:1),0,.3)*(1-routeBonus(r,routeBonuses.discount))};
}
export function findPath(s:EconomicState,from:string,to:string):Route[]{
 if(from===to)return[];const distance=new Map([[from,0]]),prev=new Map<string,Route>(),open=new Set(Object.keys(s.simulation.counties));
 while(open.size){let at:string|undefined,best=Infinity;for(const id of open){const d=distance.get(id)??Infinity;if(d<best){best=d;at=id;}}if(!at)break;if(at===to)break;open.delete(at);for(const r of s.simulation.routes){if(r.blocked||r.from!==at&&r.to!==at)continue;const next=r.from===at?r.to:r.from;if(!open.has(next))continue;const n=best+routeMetrics(s,r).months;if(n<(distance.get(next)??Infinity)){distance.set(next,n);prev.set(next,r);}}}
 const path:Route[]=[];let at=to;while(at!==from){const r=prev.get(at);if(!r)return[];path.unshift(r);at=r.from===at?r.to:r.from;}return path;
}
export function dispatch(ctx:MonthContext,from:string,to:string,good:Good,amount:number,path:Route[]){
 if(!path.length||amount<=0)return false;const u=ctx.units.get(from)!;if(stock(u,good)+1e-8<amount)return false;
 u.resources[good]=Math.max(0,stock(u,good)-amount);ctx.s.simulation.shipments.push({id:ctx.s.simulation.nextId++,from,to,good,amount,purpose:'private',prefectureId:null,projectTargetId:null,building:null,path:path.map(r=>r.id),leg:0,remaining:0,entered:false});return true;
}
export function transport(ctx:MonthContext){
 const sim=ctx.s.simulation,byId=new Map(sim.routes.map(r=>[r.id,r]));
 for(const r of sim.routes){r.used=0;r.lastCapacity=metricsFor(ctx,r).capacity;}
 const remaining:typeof sim.shipments=[];
 for(const shipment of sim.shipments){const route=byId.get(shipment.path[shipment.leg]!)!,m=metricsFor(ctx,route);
  if(!shipment.entered){if(route.blocked||shipment.amount>m.capacity-route.used){remaining.push(shipment);continue;}route.used+=shipment.amount;shipment.entered=true;shipment.remaining=m.months;remaining.push(shipment);continue;}
  if(route.blocked){remaining.push(shipment);continue;}
  shipment.remaining=Math.max(0,shipment.remaining-1);if(shipment.remaining>0){remaining.push(shipment);continue;}
  const loss=shipment.amount*m.loss;shipment.amount-=loss;if(shipment.good==='grain')ctx.report.loss+=loss;else ctx.report.destroyed[shipment.good]+=loss;
  if(shipment.leg===shipment.path.length-1){
   if((shipment.purpose==='private'||shipment.purpose==='relief')){const dest=ctx.units.get(shipment.to)!;dest.resources[shipment.good]=stock(dest,shipment.good)+shipment.amount;}
   else if(shipment.purpose==='reserve'){if(shipment.prefectureId)sim.prefectures[shipment.prefectureId]!.grainReserve+=shipment.amount;else {ctx.s.country.grainReserve+=shipment.amount;if(sim.central)sim.central.accounts.grainIn+=shipment.amount;}}
   else if(shipment.purpose==='construction'){const target=sim.counties[shipment.projectTargetId!]??sim.prefectures[shipment.projectTargetId!]!;const project=target.projects.find(p=>p.building===shipment.building);if(!project)throw Error('Công trường nhận hàng không tồn tại');project.materials[shipment.good]+=shipment.amount;}
   else {const f=sim.prefectures[shipment.prefectureId!]!;if(shipment.purpose==='tax'){if(shipment.good==='grain')f.grainReserve+=shipment.amount;else {f.market.publicListings[shipment.good]+=shipment.amount;liquidateTax(ctx,shipment.prefectureId!);}}else f.market.inventory[shipment.good]+=shipment.amount;}
  }
  else{shipment.leg++;shipment.entered=false;shipment.remaining=0;remaining.push(shipment);}
 }
 sim.shipments=remaining;
}
