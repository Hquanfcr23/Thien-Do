import { defaultCentral } from '../domain/economy';
import { goodsConfig } from './economicConfig';
import type { GameState as OldState } from '../domain/schemaV4';
import type { GameState } from '../domain/schema';
import { emptyStock,goods,defaultFiscalPolicy,emptyAccounts,type Simulation } from '../domain/economy';
export function upgradeEconomy(old:OldState,endowment=false):GameState {
 const s=structuredClone(old);if(!s.simulation)throw Error('Cần khởi tạo kinh tế cũ trước chuyển đổi');
 const source=s.simulation;
 const sim:Simulation={...source,central:defaultCentral(),revision:3,prefecturePolicies:{},zhouPolicies:{},prefectures:{},counties:{},shipments:source.shipments.map(x=>({...x,purpose:'private',prefectureId:null,projectTargetId:null,building:null}))};
 const units=new Map(s.administrativeUnits.map(u=>[u.id,u]));
 for(const fu of s.administrativeUnits.filter(u=>u.levelId==='fu')){
  const children=s.administrativeUnits.filter(u=>u.parentId===fu.id&&source.counties[u.id]);const seat=children[0];if(!seat)throw Error(`Phủ thiếu Huyện: ${fu.id}`);
  sim.prefectures[fu.id]={fiscalPolicy:defaultFiscalPolicy(),accounts:emptyAccounts(),serviceLevel:1,seatCountyId:seat.id,treasury:0,grainReserve:0,market:{inventory:emptyStock(),publicListings:emptyStock(),prices:{...emptyStock(),...Object.fromEntries(goods.map(g=>[g,goodsConfig[g].price]))},demand:emptyStock(),merchantMoney:0},buildings:{},projects:[]};
  const f=sim.prefectures[fu.id]!,population=children.reduce((n,u)=>n+u.population,0);for(const g of goods){f.market.prices[g]=children.reduce((n,u)=>n+source.counties[u.id]!.prices[g]*(population?u.population:1),0)/(population||children.length);f.market.demand[g]=children.reduce((n,u)=>n+source.counties[u.id]!.demand[g],0);}
 }
 for(const [id,c]of Object.entries(source.counties)){
  const {prices:oldPrices,demand:oldDemand,projects,...physical}=c;void oldPrices;void oldDemand;
  const f=sim.prefectures[units.get(id)?.parentId??''];if(!f)throw Error(`Huyện thiếu Phủ: ${id}`);
  const purse=physical.privateMoney*.1;physical.privateMoney-=purse;f.market.merchantMoney+=purse;
  sim.counties[id]={...physical,projects:projects.map(p=>({...p,materials:emptyStock(),legacyFunded:true,pausedReason:null}))};
 }
 for(const u of s.administrativeUnits){const cash=u.treasury;const f=sim.prefectures[u.id]??sim.prefectures[u.parentId??'']??Object.entries(sim.prefectures).find(([id])=>units.get(id)?.parentId===u.id)?.[1];if(f)f.treasury+=cash;else s.country.treasury+=cash;}
 if(endowment&&Object.keys(sim.prefectures).length){
  // Allocate the same 50% central grant by the number of residents each Phủ must serve.
  // This changes only fresh scenarios; upgrades of existing saves never receive a grant.
  const grant=s.country.treasury*.5,totalPopulation=s.administrativeUnits.filter(u=>source.counties[u.id]).reduce((n,u)=>n+u.population,0);
  s.country.treasury-=grant;
  for(const [id,f] of Object.entries(sim.prefectures)){
   const residents=s.administrativeUnits.filter(u=>u.parentId===id).reduce((n,u)=>n+u.population,0);
   f.treasury+=totalPopulation?grant*residents/totalPopulation:grant/Object.keys(sim.prefectures).length;
  }
 }
 // Trading inventory at the same physical seat; no county-to-county teleport during migration.
 for(const f of Object.values(sim.prefectures)){const u=units.get(f.seatCountyId)!;for(const g of goods){const moved=(u.resources[g]??0)*.2;u.resources[g]=(u.resources[g]??0)-moved;f.market.inventory[g]+=moved;}}
 const administrativeUnits=s.administrativeUnits.map(u=>{const {treasury,...unit}=u;void treasury;return unit;});
 return {...s,decisionTurn:'early',administrativeUnits,simulation:sim};
}
