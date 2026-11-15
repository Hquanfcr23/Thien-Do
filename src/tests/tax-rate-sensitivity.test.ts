import {it,expect} from 'vitest';
import fs from 'node:fs';
import {createNewGame} from '../data/foundation';
import {advanceMonth} from '../engine/month';

it('measures intermediate tax policies without violating the economic ledger',()=>{
 const results:{rate:number;seed:number;population:number;publicCash:number;shortages:number}[]=[];
 for(const rate of [.2,.3,.4])for(const seed of [1,42,1701]){
  let state=createNewGame(seed);state.simulation!.policy.landTax=rate;let shortages=0;
  for(let month=0;month<240;month++){
   state=advanceMonth(state);const report=state.simulation!.reports.at(-1)!;
   expect(Math.abs(report.moneyError)).toBeLessThan(1e-5);
   expect(Object.values(report.goodsError).every(error=>Math.abs(error)<1e-5)).toBe(true);
   shortages+=report.shortageCount;
  }
  results.push({rate,seed,population:state.administrativeUnits.filter(u=>u.levelId==='xian').reduce((n,u)=>n+u.population,0),publicCash:state.country.treasury+Object.values(state.simulation!.prefectures).reduce((n,f)=>n+f.treasury,0),shortages});
 }
 for(const seed of [1,42,1701]){
  const byRate=results.filter(result=>result.seed===seed);
  expect(byRate[0]!.population).toBeGreaterThan(byRate[1]!.population);
  expect(byRate[1]!.population).toBeGreaterThan(byRate[2]!.population);
  expect(byRate[1]!.publicCash).toBeGreaterThan(byRate[0]!.publicCash);
 }
 fs.writeFileSync('docs/TAX_RATE_SENSITIVITY.json',JSON.stringify({months:240,results},null,2));
},300000);
