import {defaultCentral,emptyCentralAccounts,type Route} from '../domain/economy';
import {crops,centralGranaryProfile} from '../data/economicConfig';
import {cashFloor,operatingCost,reserveTarget} from './budget';
import {capitalCounty,metricsFor,type MonthContext} from './economyContext';


export function beginCentralMonth(ctx:MonthContext){ctx.s.simulation.central??=defaultCentral();ctx.s.simulation.central.accounts=emptyCentralAccounts();}
// Uses unbooked route capacity and actual freight money. Never create an oversized lot.
function shipmentLimit(ctx:MonthContext,from:string,to:string,requested:number,cash:number,path:Route[]){
 if(requested<=1e-6)return 0;if(from===to)return requested;
 if(!path.length)return 0;
 const free=path.map(r=>{const booked=ctx.s.simulation.shipments.filter(x=>!x.entered&&x.path[x.leg]===r.id).reduce((n,x)=>n+x.amount,0);return Math.max(0,metricsFor(ctx,r).capacity-r.used-booked);});
 const fee=path.reduce((n,r)=>n+metricsFor(ctx,r).cost,0);
 return Math.max(0,Math.min(requested,...free,fee?cash/fee:requested));
}
export function settleCentral(ctx:MonthContext){
 delete ctx.metrics;delete ctx.routing;delete ctx.access;
 const sim=ctx.s.simulation,c=sim.central??=defaultCentral(),p=c.policy,a=c.accounts,capital=capitalCounty(ctx.s),senders=new Set<string>();
 let paths:Map<string,Route[]>|undefined;
 const pathToCapital=(id:string)=>{
  if(paths)return paths.get(id)??[];
  const adj=new Map<string,Route[]>();for(const r of sim.routes){if(r.blocked)continue;for(const at of [r.from,r.to]){const list=adj.get(at)??[];list.push(r);adj.set(at,list);}}
  const open=new Set(Object.keys(sim.counties)),dist=new Map([[capital,0]]),previous=new Map<string,Route>();
  while(open.size){let at:string|undefined,best=Infinity;for(const id of open){const d=dist.get(id)??Infinity;if(d<best){at=id;best=d;}}if(!at)break;open.delete(at);for(const r of adj.get(at)??[]){const to=r.from===at?r.to:r.from;if(!open.has(to))continue;const d=best+metricsFor(ctx,r).months;if(d<(dist.get(to)??Infinity)){dist.set(to,d);previous.set(to,r);}}}
  paths=new Map();for(const from of Object.keys(sim.counties)){const path:Route[]=[];let at=from;while(at!==capital){const r=previous.get(at);if(!r){path.length=0;break;}path.push(r);at=r.from===at?r.to:r.from;}paths.set(from,path);}return paths.get(id)??[];
 };
 // Assess only locally earned cash. Grants/transfers and the opening balance are excluded.
 for(const [id,f]of Object.entries(sim.prefectures)){
  const due=(f.accounts.tax+f.accounts.sales)*p.cashRemitRate;
  const children=ctx.s.administrativeUnits.filter(u=>u.parentId===id),emergency=children.some(u=>sim.counties[u.id]!.shortage>.1||(ctx.weather.get(u.id)?.rain??1)<.3);
  const paid=emergency?0:Math.min(due,Math.max(0,f.treasury-(cashFloor(ctx,id)+operatingCost(ctx,id))));
  f.treasury-=paid;ctx.s.country.treasury+=paid;f.accounts.transfersOut+=paid;a.silverIn+=paid;a.remitDue+=due;a.remitUnpaid+=due-paid;if(paid>0)senders.add(id);
  // One successful grain assessment per harvest year; timing follows local crop profiles.
  const season=children.some(u=>{const crop=crops[sim.counties[u.id]!.crop];return(ctx.s.calendar.month-crop.harvest+12)%12<=2;});
  if(emergency){if(due>0)ctx.report.notes.push(`${ctx.units.get(id)!.name}: hoãn nộp về kinh do mất mùa hoặc thiếu ăn; giữ nguồn lực cứu dân.`);continue;}if(!season||c.grainYears[id]===ctx.s.calendar.year||p.grainRemitRate===0)continue;
  const desired=Math.max(0,f.grainReserve-reserveTarget(ctx,id))*p.grainRemitRate;
  if(desired<=1e-6)continue;const path=pathToCapital(f.seatCountyId);const amount=shipmentLimit(ctx,f.seatCountyId,capital,desired,Math.max(0,f.treasury-(cashFloor(ctx,id)+operatingCost(ctx,id))),path);
  if(amount<=1e-6)continue;
  const cost=path.reduce((n,r)=>n+metricsFor(ctx,r).cost*amount,0);f.grainReserve-=amount;f.treasury-=cost;sim.counties[f.seatCountyId]!.privateMoney+=cost;f.accounts.freight+=cost;ctx.report.spending+=cost;if(f.seatCountyId===capital){ctx.s.country.grainReserve+=amount;a.grainIn+=amount;}else sim.shipments.push({id:sim.nextId++,from:f.seatCountyId,to:capital,good:'grain',amount,purpose:'reserve',prefectureId:null,projectTargetId:null,building:null,path:path.map(r=>r.id),leg:0,remaining:0,entered:false});c.grainYears[id]=ctx.s.calendar.year;
  ctx.report.notes.push(`${ctx.units.get(id)!.name} vận ${amount.toFixed(1)} thạch lương về kinh${amount+1e-6<desired?' (giới hạn cước/công suất)':''}; kho triều đình chỉ ghi nhận khi đến.`);
 }
 // Neediest first, with a single empire-wide monthly allowance and no remit/aid round trip.
 let budget=p.aidSilverLimit;
 const requests=Object.entries(sim.prefectures).map(([id,f])=>({id,f,need:Math.max(0,cashFloor(ctx,id)+operatingCost(ctx,id)-f.treasury)})).sort((x,y)=>y.need-x.need||x.id.localeCompare(y.id));
 for(const {id,f,need}of requests){if(senders.has(id)||budget<=0)continue;const amount=Math.min(need,budget,Math.max(0,ctx.s.country.treasury-p.cashFloor));if(amount<=0)continue;ctx.s.country.treasury-=amount;f.treasury+=amount;f.accounts.transfersIn+=amount;a.silverOut+=amount;budget-=amount;}
 let foodBudget=p.aidGrainLimit;
 const hungry=Object.entries(sim.counties).filter(([,v])=>v.shortage>0).sort((x,y)=>y[1].shortage-x[1].shortage||x[0].localeCompare(y[0]));
 for(const [id,v]of hungry){
  if(foodBudget<=0)break;
  const incoming=sim.shipments.filter(x=>x.purpose==='private'&&x.to===id&&x.good==='grain').reduce((n,x)=>n+x.amount,0);
  const need=Math.max(0,ctx.units.get(id)!.population*.025*v.shortage-incoming),requested=Math.min(foodBudget,Math.max(0,ctx.s.country.grainReserve-p.grainFloor),need);
  if(requested<=1e-6)continue;const path=[...pathToCapital(id)].reverse();const aidRoom=path.map(r=>Math.max(0,metricsFor(ctx,r).capacity*centralGranaryProfile.aidRouteShare-sim.shipments.filter(x=>x.purpose==='relief'&&x.path[x.leg]===r.id).reduce((n,x)=>n+x.amount,0)));const amount=Math.min(shipmentLimit(ctx,capital,id,requested,Math.max(0,ctx.s.country.treasury-p.cashFloor),path),...aidRoom);if(amount<=1e-6)continue;
  const cost=path.reduce((n,r)=>n+metricsFor(ctx,r).cost*amount,0);ctx.s.country.grainReserve-=amount;ctx.s.country.treasury-=cost;sim.counties[capital]!.privateMoney+=cost;ctx.report.spending+=cost;if(id===capital){const u=ctx.units.get(id)!;u.resources.grain=(u.resources.grain??0)+amount;}else sim.shipments.push({id:sim.nextId++,from:capital,to:id,good:'grain',amount,purpose:'relief',prefectureId:null,projectTargetId:null,building:null,path:path.map(r=>r.id),leg:0,remaining:0,entered:false});a.silverOut+=cost;a.grainOut+=amount;foodBudget-=amount;
  ctx.report.notes.push(`Triều đình cứu trợ ${amount.toFixed(1)} thạch lương cho ${ctx.units.get(id)!.name}; hàng xa cần thời gian tới nơi.`);
 }
 // Central granary: real loss; storage wages circulate to residents of the capital seat.
 const due=ctx.s.country.grainReserve*centralGranaryProfile.storageWage,paid=Math.min(ctx.s.country.treasury,due),capacity=centralGranaryProfile.capacity;
 ctx.s.country.treasury-=paid;sim.counties[capital]!.privateMoney+=paid;a.silverOut+=paid;a.storageCost=paid;ctx.report.spending+=paid;
 const rate=centralGranaryProfile.baseLoss+centralGranaryProfile.unfundedLoss*(due?1-paid/due:0)+centralGranaryProfile.overflowLoss*Math.max(0,ctx.s.country.grainReserve-capacity)/Math.max(1,ctx.s.country.grainReserve);
 const loss=ctx.s.country.grainReserve*rate;ctx.s.country.grainReserve-=loss;ctx.report.loss+=loss;a.grainLoss+=loss;
 ctx.report.notes.push(`Ngân sách triều đình: nhận ${a.silverIn.toFixed(1)}, chi ${a.silverOut.toFixed(1)} lượng; lương nhập ${a.grainIn.toFixed(1)}, xuất ${a.grainOut.toFixed(1)}, hao ${a.grainLoss.toFixed(1)} thạch lương. Nộp bạc chưa đủ ${a.remitUnpaid.toFixed(1)} lượng (không ghi nợ).`);
}

