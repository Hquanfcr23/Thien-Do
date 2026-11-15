import { constructionPriorities } from './policies';
import { goods,emptyStock,type Good,type Stock } from '../domain/economy';
import { projectDefinition,goodsConfig } from '../data/economicConfig';
import { householdReserve,stock,prefectureId,policyFor,marketAccess,type MonthContext } from './economyContext';
import { spendable } from './budget';

export interface MarketOrders {sell:Stock;buy:Stock;incoming:Stock}
type OrderContext=Pick<MonthContext,'s'|'units'|'reserves'|'demands'|'access'|'routing'|'metrics'|'operating'>;
// Orders are quantities offered/requested this month, not completed transactions.
// Only delivered exchange stock can be offered. Cargo is tracked separately.
export function marketOrders(ctx:OrderContext):Map<string,MarketOrders>{
 const sim=ctx.s.simulation,orders=new Map(Object.entries(sim.prefectures).map(([id,f])=>[id,{sell:Object.fromEntries(goods.map(g=>[g,f.market.inventory[g]+f.market.publicListings[g]])) as Stock,buy:emptyStock(),incoming:emptyStock()}]));
 const inbound=new Map<string,number>(),materials=new Map<string,number>();
 for(const x of sim.shipments){
  if(x.purpose==='private'||x.purpose==='relief'){const key=`${x.to}:${x.good}`;inbound.set(key,(inbound.get(key)??0)+x.amount);}
  if(x.purpose==='construction'){const key=`${x.projectTargetId}:${x.building}:${x.good}`;materials.set(key,(materials.get(key)??0)+x.amount);}
  if(x.prefectureId&&(x.purpose==='market'||x.purpose==='tax'&&x.good!=='grain')){const o=orders.get(x.prefectureId);if(o)o.incoming[x.good]+=x.amount;}
 }
 for(const [id,c]of Object.entries(sim.counties)){
  if(!policyFor(ctx,id).tradeOpen)continue;
  const fu=prefectureId(ctx,id),f=sim.prefectures[fu]!,access=marketAccess(ctx,id);
  if(id!==f.seatCountyId&&!access.path.length)continue;
  const u=ctx.units.get(id)!,wanted=emptyStock();let cost=0;
  for(const g of goods){wanted[g]=Math.max(0,householdReserve(ctx,id,g)-stock(u,g)-(inbound.get(`${id}:${g}`)??0));cost+=wanted[g]*(f.market.prices[g]+access.cost)/Math.max(.01,1-access.loss)*(1+policyFor(ctx,id).tradeTax);}
  const affordable=Math.min(1,Math.max(0,c.privateMoney-c.land*.025-20)/Math.max(.001,cost));
  for(const g of goods)orders.get(fu)!.buy[g]+=wanted[g]*affordable;
 }
 // Construction orders cover a month's work, subtract onsite and prepaid cargo.
 const projects=new Map<string,Stock>();
 for(const [id,target]of [...Object.entries(sim.counties),...Object.entries(sim.prefectures)]){
  const fu=prefectureId(ctx,id),f=sim.prefectures[fu]!,seat=sim.prefectures[id]?.seatCountyId??id,c=sim.counties[seat]!;
  if(seat!==f.seatCountyId&&!marketAccess(ctx,seat).path.length)continue;
  const priorities=constructionPriorities(ctx.s,fu);
  const count=c.projects.filter(p=>priorities[p.building]!=='forbid').length+(seat===f.seatCountyId?f.projects.filter(p=>priorities[p.building]!=='forbid').length:0),work=c.lastConstruction/Math.max(1,count);
  const wanted=projects.get(fu)??emptyStock();projects.set(fu,wanted);
  for(const p of target.projects){if(p.legacyFunded||priorities[p.building]==='forbid')continue;const fraction=Math.max(0,Math.min(p.required-p.work,work)/p.required);
   for(const g of goods)wanted[g]+=Math.max(0,(projectDefinition(p).materials[g]??0)*fraction-p.materials[g]-(materials.get(`${id}:${p.building}:${g}`)??0));
  }
 }
 for(const [fu,wanted]of projects){const f=sim.prefectures[fu]!,cost=goods.reduce((n,g)=>n+wanted[g]*f.market.prices[g],0),affordable=Math.min(1,spendable(ctx,fu)/Math.max(.001,cost));for(const g of goods)orders.get(fu)!.buy[g]+=wanted[g]*affordable;}
 return orders;
}

// Balanced orders give base price. A 2:1 imbalance reaches +/-75%; no orders give base.
export function orderPrice(good:Good,sell:number,buy:number):number{
 const imbalance=sell===buy?0:sell===0?1:buy===0?-1:Math.max(-1,Math.min(1,(buy-sell)/Math.min(buy,sell)));
 return goodsConfig[good].price*(1+.75*imbalance);
}
