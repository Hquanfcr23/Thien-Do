import {it,expect} from 'vitest';
import fs from 'node:fs';
import {createNewGame} from '../data/foundation';
import {advanceMonth,queueOrder} from '../engine/month';
import {moneyTotal,type EconomicState} from '../engine/economyContext';
import {gameStateSchema} from '../domain/schema';

// Current mandatory balance gate. Deferred fiscal/transport stress cases remain documented in IMPLEMENTATION_PLAN.md.
const cases=['open','low-tax','high-tax','sell-all','reserve-four','targeted-build','overbuild','route-upgrade','drought-open'] as const;
type Scenario=typeof cases[number];
interface Result {seed:number;scenario:Scenario;checkpoints:{month:number;population:number;publicCash:number;hunger:number}[];population:number;publicCash:number;prefectureCash:number;publicGrain:number;stability:number;hunger:number;earlyRevenue:number;completedIrrigation:number;upgradedRoutes:number;pausedProjectMonths:number;projectMonths:number;firstMonthProjects:number;selectedRouteId:string|null}
function prepare(s:EconomicState,scenario:Scenario):{state:EconomicState;selectedRouteId:string|null}{
 if(scenario==='low-tax')s.simulation.policy.landTax=.05;
 if(scenario==='high-tax')s.simulation.policy.landTax=.6;
 for(const f of Object.values(s.simulation.prefectures)){
  if(scenario==='sell-all')f.fiscalPolicy.reserveMonths=0;
  if(scenario==='reserve-four')f.fiscalPolicy.reserveMonths=4;
 }
 if(scenario==='targeted-build'||scenario==='overbuild'){
  const counties=Object.entries(s.simulation.counties).sort((a,b)=>a[1].water-b[1].water||a[0].localeCompare(b[0]));
  for(const [id] of scenario==='targeted-build'?counties.slice(0,3):counties)s=queueOrder(s,{kind:'build',countyId:id,building:'irrigation'}) as EconomicState;
 }
 let selectedRouteId:string|null=null;
 if(scenario==='route-upgrade'){
  const route=s.simulation.routes.filter(r=>r.mode==='road'&&!r.blocked&&s.simulation.counties[r.from]&&s.simulation.counties[r.to]).sort((a,b)=>a.km-b.km||a.id.localeCompare(b.id))[0];
  expect(route,'A playable road route must exist in the fixture').toBeDefined();
  selectedRouteId=route!.id;
  s=queueOrder(s,{kind:'build',countyId:route!.from,building:'road',routeId:route!.id}) as EconomicState;
 }
 return {state:s,selectedRouteId};
}
it('checks nine mandatory Phase 3 strategies over 240 months and three seeds',()=>{
 const results:Result[]=[];let maxError=0;
 for(const seed of [1,42,1701])for(const scenario of cases){
  const prepared=prepare(createNewGame(seed) as EconomicState,scenario);let s=prepared.state;
  const initialMoney=moneyTotal(s);let hunger=0,earlyRevenue=0,pausedProjectMonths=0,projectMonths=0,firstMonthProjects=0;
  const checkpoints:Result['checkpoints']=[];
  for(let month=0;month<240;month++){
   s.simulation.weatherMode=scenario==='drought-open'&&month>=120&&month<144?'drought':'normal';
   s=advanceMonth(s) as EconomicState;
   const report=s.simulation.reports.at(-1)!;
   hunger+=report.shortageCount;
   maxError=Math.max(maxError,Math.abs(report.moneyError),...Object.values(report.goodsError));
   for(const f of Object.values(s.simulation.prefectures))if(month<12)earlyRevenue+=f.accounts.tax+f.accounts.sales;
   const projects=[...Object.values(s.simulation.counties),...Object.values(s.simulation.prefectures)].flatMap(v=>v.projects);
   projectMonths+=projects.length;pausedProjectMonths+=projects.filter(p=>p.pausedReason!==null).length;
   if(month===0)firstMonthProjects=projects.length;
   if([11,59,119,239].includes(month))checkpoints.push({month:month+1,population:report.population,publicCash:s.country.treasury+Object.values(s.simulation.prefectures).reduce((n,f)=>n+f.treasury,0),hunger});
  }
  expect(gameStateSchema.safeParse(s).success,`${seed}/${scenario}: schema`).toBe(true);
  expect(Math.abs(moneyTotal(s)-initialMoney),`${seed}/${scenario}: money`).toBeLessThan(1e-5);
  if(scenario==='targeted-build')expect(firstMonthProjects,`${seed}: targeted order must start`).toBeGreaterThanOrEqual(1);
  if(scenario==='overbuild')expect(firstMonthProjects,`${seed}: broad orders must start`).toBeGreaterThanOrEqual(1);
  if(scenario==='route-upgrade')expect(firstMonthProjects,`${seed}: route order must start`).toBeGreaterThanOrEqual(1);
  const prefectureCash=Object.values(s.simulation.prefectures).reduce((n,f)=>n+f.treasury,0);
  results.push({seed,scenario,checkpoints,population:s.administrativeUnits.reduce((n,u)=>n+u.population,0),publicCash:s.country.treasury+prefectureCash,prefectureCash,publicGrain:Object.values(s.simulation.prefectures).reduce((n,f)=>n+f.grainReserve+f.market.publicListings.grain,0),stability:s.administrativeUnits.filter(u=>u.levelId==='xian').reduce((n,u)=>n+u.stability,0)/Object.keys(s.simulation.counties).length,hunger,earlyRevenue,completedIrrigation:Object.values(s.simulation.counties).filter(c=>(c.buildings.irrigation?.level??0)>0).length,upgradedRoutes:s.simulation.routes.filter(r=>r.upgrade).length,pausedProjectMonths,projectMonths,firstMonthProjects,selectedRouteId:prepared.selectedRouteId});
 }
 fs.writeFileSync('docs/PHASE_3_PRIORITY_BALANCE_RESULTS.json',JSON.stringify({seeds:[1,42,1701],months:240,cases,weather:'Drought only in months 121–144',maxError,results},null,2));
 const average=(scenario:Scenario,key:keyof Pick<Result,'population'|'publicCash'|'publicGrain'|'stability'|'hunger'|'earlyRevenue'|'completedIrrigation'|'upgradedRoutes'|'pausedProjectMonths'|'projectMonths'>)=>results.filter(r=>r.scenario===scenario).reduce((n,r)=>n+r[key],0)/3;
 expect(maxError).toBeLessThan(1e-5);
 expect(average('high-tax','earlyRevenue')).toBeGreaterThan(average('low-tax','earlyRevenue'));
 expect(average('high-tax','population')).toBeLessThan(average('low-tax','population'));
 expect(average('reserve-four','publicGrain')).toBeGreaterThan(average('sell-all','publicGrain'));
 expect(average('overbuild','projectMonths')).toBeGreaterThan(average('targeted-build','projectMonths'));
 expect(average('targeted-build','completedIrrigation')).toBeGreaterThan(0);
 expect(average('overbuild','completedIrrigation')).toBeGreaterThan(average('targeted-build','completedIrrigation'));
 expect(average('overbuild','pausedProjectMonths')).toBeGreaterThan(average('targeted-build','pausedProjectMonths'));
 expect(average('route-upgrade','upgradedRoutes')).toBeGreaterThan(0);
 expect(average('drought-open','hunger')).toBeGreaterThan(average('open','hunger'));
 expect(average('drought-open','population')).toBeLessThan(average('open','population'));
},300000);
