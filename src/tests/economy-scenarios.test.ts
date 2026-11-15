import { it,expect } from 'vitest';
import fs from 'node:fs';
import { createNewGame } from '../data/foundation';
import { advanceMonth,queueOrder } from '../engine/month';
import { goodsTotal,moneyTotal,type EconomicState } from '../engine/economyContext';
import { goods } from '../domain/economy';
const scenarios=['normal','drought','high-tax','labour-shortage','routes-cut','infrastructure','bankruptcy'] as const;
const snapshot=(s:EconomicState)=>({population:s.administrativeUnits.reduce((n,u)=>n+u.population,0),treasury:s.country.treasury,prefectureTreasury:Object.values(s.simulation.prefectures).reduce((n,f)=>n+f.treasury,0),stateGrain:Object.values(s.simulation.prefectures).reduce((n,f)=>n+f.grainReserve,0),marketSilver:Object.values(s.simulation.prefectures).reduce((n,f)=>n+f.market.merchantMoney,0),grain:goodsTotal(s,'grain'),stability:s.administrativeUnits.filter(u=>u.levelId==='xian').reduce((n,u)=>n+u.stability,0)/Math.max(1,Object.keys(s.simulation.counties).length),privateMoney:Object.values(s.simulation.counties).reduce((n,c)=>n+c.privateMoney,0),shortages:Object.values(s.simulation.counties).filter(c=>c.shortage>.1).length,shipments:s.simulation.shipments.length,harvest:s.simulation.reports.reduce((n,r)=>n+r.harvest,0),tax:s.simulation.reports.reduce((n,r)=>n+r.tax,0),spending:s.simulation.reports.reduce((n,r)=>n+r.spending,0)});
it('records 12/60/120/240 month scenario outcomes for three seeds',()=>{
 const results: {scenario:string;seed:number;months:number;before:ReturnType<typeof snapshot>;after:ReturnType<typeof snapshot>}[]=[];
 for(const seed of [1,42,1701])for(const scenario of scenarios){
  let s=createNewGame(seed) as EconomicState;
  if(scenario==='drought')s.simulation.weatherMode='drought';
  if(scenario==='high-tax')s.simulation.policy.landTax=.6;
  if(scenario==='labour-shortage')s.simulation.policy={...s.simulation.policy,farmShare:.1,industryShare:.1,reserveShare:.7};
  if(scenario==='routes-cut')for(const r of s.simulation.routes)r.blocked=true;
  if(scenario==='infrastructure')for(const id of Object.keys(s.simulation.counties))s=queueOrder(s,{kind:'build',countyId:id,building:'irrigation'}) as EconomicState;
  if(scenario==='bankruptcy'){s.country.treasury=0;for(const f of Object.values(s.simulation.prefectures))f.treasury=0;}
  const before=snapshot(s),cash=moneyTotal(s);
  for(let month=1;month<=240;month++){
   s=advanceMonth(s) as EconomicState;
   for(const g of goods)expect(s.simulation.reports.at(-1)!.goodsError[g]).toBeLessThan(1e-5);
   if([12,60,120,240].includes(month))results.push({scenario,seed,months:month,before,after:snapshot(s)});
  }
  expect(moneyTotal(s)).toBeCloseTo(cash,4);
 }
 const normal=results.find(r=>r.seed===42&&r.months===120&&r.scenario==='normal')!.after;
 const drought=results.find(r=>r.seed===42&&r.months===120&&r.scenario==='drought')!.after;
 expect(drought.population).toBeLessThan(normal.population);
 fs.writeFileSync('docs/PHASE_4_SCENARIOS.json',JSON.stringify({configuration:'Fictional gameplay calibration, not historical estimates',results},null,2)+'\n');
},300000);
