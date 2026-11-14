import {tierEffect} from '../data/economicConfig';
import { findPath,dispatch } from './transport';
import { goods } from '../domain/economy';
import { householdReserve,metricsFor,armyCounty,capitalCounty,bound,effect,stock,prefectureOf,prefectureId,policyFor,marketAccess,localPrice,type MonthContext } from './economyContext';
import {spendable,grainStoreLoss,operatingCost} from './budget';
import { liquidateTax } from './market';
export function finance(ctx:MonthContext){
 const freightBudget=new Map(Object.entries(ctx.s.simulation.prefectures).map(([id,f])=>[id,Math.min(f.treasury,operatingCost(ctx,id)*.25)]));
 const pending=new Set(ctx.s.simulation.shipments.filter(x=>x.purpose==='tax').map(x=>`${x.from}:${x.good}`));
 for(const [id,c]of Object.entries(ctx.s.simulation.counties)){
  const u=ctx.units.get(id)!,f=prefectureOf(ctx,id),fu=prefectureId(ctx,id),governor=ctx.s.characters.find(p=>p.id===u.governorId);
  const compliance=bound(u.control/100*(.55+.45*u.stability/100)*(1-(governor?.corruption??10)/100)+tierEffect(c.buildings.administration,[0,.05,.09,.12],.03)+.03*(f.buildings.administration?.legacy?effect(f,'administration'):0)+.02*(effect(c,'relay')+effect(f,'relay')))*(.5+.5*f.serviceLevel);
  c.lastTaxNominal=0;c.lastTaxPaid=0;const access=marketAccess(ctx,id);
  for(const g of goods){const nominal=(ctx.taxable?.get(id)?.[g]??0)*policyFor(ctx,id).landTax;c.lastTaxNominal+=nominal*f.market.prices[g];
   if(pending.has(`${id}:${g}`))continue;let due=nominal*compliance;
   // Optional commutation replaces part of the harvest levy; it is not an additional tax.
   if(g==='grain'&&(id===f.seatCountyId||access.path.length)&&c.shortage<.1){const cash=Math.min(due*f.fiscalPolicy.cashTaxShare*f.market.prices.grain,Math.max(0,c.privateMoney-c.land*.025-20));c.privateMoney-=cash;f.treasury+=cash;f.accounts.tax+=cash;ctx.report.tax+=cash;c.lastTaxPaid+=cash;due=Math.max(0,due-cash/Math.max(.001,f.market.prices.grain));}
   const rate=policyFor(ctx,id).landTax,protectedFood=g==='grain'?householdReserve(ctx,id,'grain')*Math.min(1,(1-rate)/.8):0;const requested=Math.min(Math.max(0,stock(u,g)-protectedFood),due);if(requested<=.00001)continue;
   const amount=id===f.seatCountyId?requested:Math.min(requested,Math.min(f.treasury,freightBudget.get(fu)??0)/Math.max(.000001,access.cost),...access.path.map(r=>metricsFor(ctx,r).capacity));if(amount<=.00001)continue;
   if(id===f.seatCountyId){u.resources[g]=stock(u,g)-amount;if(g==='grain')f.grainReserve+=amount;else f.market.publicListings[g]+=amount;}
   else if(access.path.length){if(!dispatch(ctx,id,f.seatCountyId,g,amount,access.path))continue;const shipment=ctx.s.simulation.shipments.at(-1)!;shipment.purpose='tax';shipment.prefectureId=fu;const fee=amount*access.cost;f.treasury-=fee;c.privateMoney+=fee;f.accounts.freight+=fee;freightBudget.set(fu,Math.max(0,(freightBudget.get(fu)??0)-fee));ctx.report.spending+=fee;}
   else continue;
   c.lastTaxPaid+=amount*f.market.prices[g];
  }

 }
 for(const [id,f]of Object.entries(ctx.s.simulation.prefectures)){liquidateTax(ctx,id);grainStoreLoss(ctx,id);const counties=ctx.s.administrativeUnits.filter(u=>u.parentId===id);const nominal=counties.reduce((n,u)=>n+ctx.s.simulation.counties[u.id]!.households*.004,0),budget=Math.min(spendable(ctx,id),nominal*f.fiscalPolicy.administrationShare);for(const u of counties){const c=ctx.s.simulation.counties[u.id]!,wage=nominal?budget*c.households*.004/nominal:0;f.treasury-=wage;c.privateMoney+=wage;f.accounts.administration+=wage;ctx.report.spending+=wage;}f.serviceLevel=nominal?budget/nominal:1;}
 const first=Object.values(ctx.s.simulation.counties)[0];if(first)for(const army of ctx.s.militaryUnits){const paid=Math.min(ctx.s.country.treasury,army.upkeep.money);ctx.s.country.treasury-=paid;if(ctx.s.simulation.central)ctx.s.simulation.central.accounts.silverOut+=paid;first.privateMoney+=paid;ctx.report.spending+=paid;}
}
export function supplyMilitary(ctx:MonthContext){for(const army of ctx.s.militaryUnits){const isCapital=ctx.s.administrativeUnits.some(u=>u.locationId===army.locationId&&u.parentId===null);const local=isCapital?undefined:armyCounty(ctx.s,army.locationId);const f=local?prefectureOf(ctx,local.id):undefined;const remote=!!local&&!!f&&local.id!==f.seatCountyId,price=remote?localPrice(ctx,local!.id,'grain'):0;const available=remote?Math.min(stock(local!,'grain'),f!.treasury/Math.max(.001,price)):f?f.grainReserve:ctx.s.country.grainReserve;const food=Math.min(available,army.upkeep.food);if(remote){local!.resources.grain=stock(local!,'grain')-food;f!.treasury-=food*price;ctx.s.simulation.counties[local!.id]!.privateMoney+=food*price;ctx.report.spending+=food*price;}else if(f)f.grainReserve-=food;else {ctx.s.country.grainReserve-=food;if(ctx.s.simulation.central)ctx.s.simulation.central.accounts.grainOut+=food;}ctx.report.consumed+=food;const capital=capitalCounty(ctx.s);army.supply.status=food<army.upkeep.food?(local&&local.id!==capital&&!findPath(ctx.s,capital,local.id).length?'isolated':'strained'):'supplied';army.morale=bound(army.morale+(food<army.upkeep.food?-2:.2),0,100);}}
