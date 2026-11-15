import {prefectureCorridors} from './prefectureTransport';
import { goods,type Simulation } from '../domain/economy';
import { marketOrders,orderPrice } from './marketOrders';
import { householdReserve,metricsFor,effect,stock,prefectureOf,prefectureId,policyFor,marketAccess,localPrice,type MonthContext } from './economyContext';
import { dispatch } from './transport';
export const exchangeShipment=(x:Simulation['shipments'][number])=>x.purpose==='market'||x.purpose==='tax'&&x.good!=='grain';
// Unsold public lots stay on the exchange. Silver is transferred from actual private buyers.
export function liquidateTax(ctx:MonthContext,fuId:string){
 const f=ctx.s.simulation.prefectures[fuId]!;
 for(const g of goods){if(g==='grain')continue;const amount=Math.min(f.market.publicListings[g],f.market.merchantMoney/f.market.prices[g]);if(amount<=0)continue;
  const cash=amount*f.market.prices[g];f.market.publicListings[g]-=amount;f.market.inventory[g]+=amount;f.market.merchantMoney-=cash;f.treasury+=cash;f.accounts.tax+=cash;ctx.report.tax+=cash;
 }
}
export function market(ctx:MonthContext){
 const sim=ctx.s.simulation,incoming=new Map<string,number>();
 for(const x of sim.shipments){if(x.purpose!=='private'&&x.purpose!=='relief'&&!exchangeShipment(x))continue;const key=`${x.purpose==='private'||x.purpose==='relief'?x.to:x.prefectureId}:${x.good}`;incoming.set(key,(incoming.get(key)??0)+x.amount);}
 const orders=marketOrders(ctx);
 for(const [id,f]of Object.entries(sim.prefectures)){
  const o=orders.get(id)!;f.market.demand={...o.buy};
  for(const g of goods){const desired=orderPrice(g,o.sell[g],o.buy[g]);f.market.prices[g]=Math.max(orderPrice(g,1,0),Math.min(orderPrice(g,0,1),f.market.prices[g]*.75+desired*.25));}
  delete ctx.quotes;
  liquidateTax(ctx,id);
  // Merchants may buy public grain for a finite turnover stock, paying from their own purse.
  const turnover=ctx.s.administrativeUnits.filter(u=>u.parentId===id).reduce((n,u)=>n+u.population*.025,0);
  const amount=Math.max(0,Math.min(f.market.publicListings.grain,Math.max(0,turnover-f.market.inventory.grain),f.market.merchantMoney/Math.max(.001,f.market.prices.grain))),cash=amount*f.market.prices.grain;
  f.market.publicListings.grain-=amount;f.market.inventory.grain+=amount;f.market.merchantMoney-=cash;f.treasury+=cash;f.accounts.sales+=cash;ctx.report.tax+=cash;
 }
 // Market restocking uses physical GIS paths to the seat, never a virtual Phủ teleport.
 const pendingMarket=new Set(sim.shipments.filter(x=>x.purpose==='market').map(x=>`${x.from}:${x.good}`));
 const booked=new Map<string,number>();for(const x of sim.shipments)if(!x.entered)booked.set(x.path[x.leg]!, (booked.get(x.path[x.leg]!)??0)+x.amount);
 for(const [id,c]of Object.entries(sim.counties)){
  if(!policyFor(ctx,id).tradeOpen)continue;const u=ctx.units.get(id)!,f=prefectureOf(ctx,id),fu=prefectureId(ctx,id),access=marketAccess(ctx,id);
  if(id!==f.seatCountyId&&!access.path.length)continue;
  let capacity=access.path.length?Math.min(...access.path.map(r=>Math.max(0,metricsFor(ctx,r).capacity-(booked.get(r.id)??0)))):Math.max(100,c.workingAge*.12);
  for(const g of goods){
   if(capacity<=.01)break;if(pendingMarket.has(`${id}:${g}`))continue;const desired=Math.max(0,f.market.demand[g]-f.market.inventory[g]-(incoming.get(`${fu}:${g}`)??0));
   const price=localPrice(ctx,id,g,'sell'),cost=price+access.cost;
   const amount=Math.min(capacity,Math.max(0,stock(u,g)-householdReserve(ctx,id,g)),desired,f.market.merchantMoney/Math.max(.001,cost));
   if(amount<=.01||price<=0)continue;
   if(id===f.seatCountyId){u.resources[g]=stock(u,g)-amount;f.market.inventory[g]+=amount;}
   else if(dispatch(ctx,id,f.seatCountyId,g,amount,access.path)){const cargo=sim.shipments.at(-1)!;cargo.purpose='market';cargo.prefectureId=fu;for(const r of access.path)booked.set(r.id,(booked.get(r.id)??0)+amount);}else continue;
   f.market.merchantMoney-=amount*cost;c.privateMoney+=amount*cost;capacity-=amount;incoming.set(`${fu}:${g}`,(incoming.get(`${fu}:${g}`)??0)+amount);
  }
  // Retail from the Phủ exchange to households, with the same physical return path.
  const path=[...access.path].reverse();
  for(const g of goods){if(capacity<=.01)break;const need=Math.max(0,householdReserve(ctx,id,g)-stock(u,g)-(incoming.get(`${id}:${g}`)??0)),price=localPrice(ctx,id,g),taxRate=policyFor(ctx,id).tradeTax,unitCost=price*(1+taxRate);
   const amount=Math.min(capacity,need,f.market.inventory[g]+(g==='grain'?f.market.publicListings.grain:0),Math.max(0,c.privateMoney-c.land*.025-20)/Math.max(.001,unitCost));if(amount<=.01)continue;
   const publicAmount=g==='grain'?Math.min(amount,f.market.publicListings.grain):0;f.market.publicListings.grain-=publicAmount;f.market.inventory[g]-=amount-publicAmount;c.privateMoney-=amount*unitCost;f.market.merchantMoney+=(amount-publicAmount)*price;f.treasury+=publicAmount*price;f.accounts.sales+=publicAmount*price;const tax=amount*price*taxRate;f.treasury+=tax;f.accounts.tax+=tax;ctx.report.tax+=tax+publicAmount*price;
   if(id===f.seatCountyId)u.resources[g]=stock(u,g)+amount;
   else {sim.shipments.push({id:sim.nextId++,from:f.seatCountyId,to:id,good:g,amount,purpose:'private',prefectureId:null,projectTargetId:null,building:null,path:path.map(r=>r.id),leg:0,remaining:0,entered:false});for(const r of path)booked.set(r.id,(booked.get(r.id)??0)+amount);}
   capacity-=amount;incoming.set(`${id}:${g}`,(incoming.get(`${id}:${g}`)??0)+amount);
  }
 }
 // One match per Phủ pair/good; only delivered exchange stock may be exported.
 const budgets=new Map(Object.keys(sim.prefectures).map(id=>[id,0]));
 for(const [id,l]of ctx.labour){const fu=prefectureId(ctx,id);budgets.set(fu,budgets.get(fu)!+l.commerce*.8*(1+.2*effect(sim.counties[id]!,'market')+.2*effect(sim.prefectures[fu]!,'market')));}
 const pendingPairs=new Set(sim.shipments.filter(x=>x.purpose==='market').map(x=>[prefectureId(ctx,x.from),x.prefectureId!].sort().join('|')+':'+x.good));
 for(const link of prefectureCorridors(ctx)){
  if(!policyFor(ctx,link.from).tradeOpen||!policyFor(ctx,link.to).tradeOpen)continue;
  let capacity=Math.min(...link.path.map(r=>Math.max(0,metricsFor(ctx,r).capacity-(booked.get(r.id)??0))));
  for(const g of goods){
   const key=[link.from,link.to].sort().join('|')+':'+g;if(capacity<=.01||pendingPairs.has(key))continue;
   const a=sim.prefectures[link.from]!,b=sim.prefectures[link.to]!,forward=a.market.prices[g]<b.market.prices[g];
   const from=forward?link.from:link.to,to=forward?link.to:link.from,seller=sim.prefectures[from]!,buyer=sim.prefectures[to]!;
   const sell=seller.market.prices[g],taxRate=policyFor(ctx,to).tradeTax,unitCost=sell*(1+taxRate)+link.cost;
   if(buyer.market.prices[g]*(1-link.loss)<=unitCost)continue;
   const sellerNeed=Math.max(0,seller.market.demand[g]-(incoming.get(`${from}:${g}`)??0));
   const available=Math.max(0,seller.market.inventory[g]-sellerNeed);
   const need=Math.max(0,buyer.market.demand[g]-buyer.market.inventory[g]-(incoming.get(`${to}:${g}`)??0));
   const amount=Math.min(capacity,budgets.get(from)??0,budgets.get(to)??0,available,need,buyer.market.merchantMoney/Math.max(.001,unitCost));
   if(amount<=.01)continue;
   const path=forward?link.path:[...link.path].reverse();
   seller.market.inventory[g]-=amount;buyer.market.merchantMoney-=amount*unitCost;
   seller.market.merchantMoney+=amount*sell;sim.counties[seller.seatCountyId]!.privateMoney+=amount*link.cost;
   const tax=amount*sell*taxRate;buyer.treasury+=tax;buyer.accounts.tax+=tax;ctx.report.tax+=tax;
   sim.shipments.push({id:sim.nextId++,from:seller.seatCountyId,to:buyer.seatCountyId,good:g,amount,purpose:'market',prefectureId:to,projectTargetId:null,building:null,path:path.map(r=>r.id),leg:0,remaining:0,entered:false});
   for(const r of path)booked.set(r.id,(booked.get(r.id)??0)+amount);
   pendingPairs.add(key);capacity-=amount;budgets.set(from,(budgets.get(from)??0)-amount);budgets.set(to,(budgets.get(to)??0)-amount);incoming.set(`${to}:${g}`,(incoming.get(`${to}:${g}`)??0)+amount);
  }
 }
}
