import {it,expect} from 'vitest';
import fs from 'node:fs';
import fixture from './fixtures/economy-v4-100.json';
import baseline from '../../docs/PHASE_4_PERFORMANCE_BASELINE.json';
import {decodeSave} from '../persistence/saves';
import {advanceMonth} from '../engine/month';
import type {EconomicState} from '../engine/economyContext';
it('runs the same 100-county, 294-route fixture for 240 months within 30 ms/month with Phase 4 compared to the measured Phase 3 baseline',()=>{
 let s=decodeSave(fixture).state as EconomicState;const start=performance.now();let maximumError=0;
 for(let i=0;i<240;i++){s=advanceMonth(s) as EconomicState;const report=s.simulation.reports.at(-1)!;maximumError=Math.max(maximumError,Math.abs(report.moneyError),...Object.values(report.goodsError));}
 const ms=performance.now()-start;const report={counties:100,prefectures:10,routes:s.simulation.routes.length,months:240,shipments:s.simulation.shipments.length,elapsedMs:ms,msPerMonth:ms/240,baselineMsPerMonth:baseline.msPerMonth,speedup:baseline.msPerMonth/(ms/240),maximumError,fixture:'Same saved synthetic graph and endowments used by county-market baseline; GIS unchanged in game'};
 fs.writeFileSync('docs/PHASE_4_PERFORMANCE.json',JSON.stringify(report,null,2));expect(maximumError).toBeLessThanOrEqual(1e-5);expect(report.msPerMonth).toBeLessThanOrEqual(30);
},300000);

it('runs 100 counties with 70,000 residents each within 30 ms/month',()=>{
 let s=decodeSave(fixture).state as EconomicState;
 const counties=s.administrativeUnits.filter(u=>u.levelId==='xian');expect(counties).toHaveLength(100);
 for(const u of counties){
  const population=70000,c=s.simulation.counties[u.id]!;u.population=population;
  c.households=Math.ceil(population/5);c.workingAge=Math.floor(population*.55);
  c.farmers=Math.floor(population*.76);c.landowners=Math.floor(population*.06);
  c.artisans=population-c.farmers-c.landowners;c.privateMoney=population*.27;
  c.land=population*.08*(u.terrain==='mountains'?1:u.terrain==='plain'?1.15:.9);
  c.sown=c.crop==='wheat'?c.land:0;
  u.resources.grain=population*.26;u.resources.tools=Math.ceil(c.land*.0136);
  u.resources.cloth=Math.ceil(population*.002);
 }
 for(const f of Object.values(s.simulation.prefectures)){f.treasury=7900;f.market.merchantMoney=21000;}
 s.country.treasury=79000;
 const start=performance.now();let maximumError=0;
 for(let i=0;i<240;i++){s=advanceMonth(s) as EconomicState;const report=s.simulation.reports.at(-1)!;maximumError=Math.max(maximumError,Math.abs(report.moneyError),...Object.values(report.goodsError));}
 const msPerMonth=(performance.now()-start)/240;
 fs.writeFileSync('docs/POPULATION_100_COUNTY_PERFORMANCE.json',JSON.stringify({counties:100,populationAtStart:7000000,months:240,routes:s.simulation.routes.length,msPerMonth,maximumError},null,2));
 expect(maximumError).toBeLessThanOrEqual(1e-5);expect(msPerMonth).toBeLessThanOrEqual(30);
},300000);
