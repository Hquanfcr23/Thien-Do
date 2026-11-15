import {describe,expect,it} from 'vitest';
import {createNewGame} from '../data/foundation';
import {summarizeUnit} from '../engine/administration';
import {advanceMonth} from '../engine/month';

describe('new-game population calibration',()=>{
 it('starts with 24 stable counties and the agreed Châu totals',()=>{
  const state=createNewGame(42),counties=state.administrativeUnits.filter(u=>u.levelId==='xian');
  expect(counties).toHaveLength(24);
  expect(counties.every(u=>u.population>=50000&&u.population<=100000)).toBe(true);
  expect(summarizeUnit(state,'zhou-tay-linh').population).toBe(400000);
  expect(summarizeUnit(state,'zhou-trung-ninh').population).toBe(760000);
  expect(summarizeUnit(state,'zhou-dong-giang').population).toBe(520000);
  expect(summarizeUnit(state,'capital').population).toBe(1680000);
  expect(new Set(counties.map(u=>u.id)).size).toBe(24);
  expect(counties[0]?.id).toBe('zhou-tay-linh-fu-1-jun-1-xian-1');
  expect(counties.at(-1)?.id).toBe('zhou-dong-giang-fu-2-jun-1-xian-2');
 });
 it('stocks first-year tools and cloth by actual land and demand, and apportions existing public silver',()=>{
  const state=createNewGame(42),counties=state.administrativeUnits.filter(u=>u.levelId==='xian'),prefectures=state.simulation!.prefectures;
  for(const u of counties){
   const land=state.simulation!.counties[u.id]!.land;
   expect(u.resources.tools!+1e-7).toBeGreaterThanOrEqual(land*(.01+12*.0003)*.8);
   expect(u.resources.cloth!+1e-7).toBeGreaterThanOrEqual(u.population*.0005*4*.8);
   expect(u.resources.grain!+1e-7).toBeGreaterThanOrEqual(u.population*.26*.8);
  }
  expect(state.country.treasury).toBe(19000);
  expect(Object.values(prefectures).reduce((sum,f)=>sum+f.treasury,0)).toBeCloseTo(19000,7);
  for(const [id,f] of Object.entries(prefectures)){
   const residents=counties.filter(u=>u.parentId===id).reduce((sum,u)=>sum+u.population,0);
   expect(f.treasury).toBeCloseTo(19000*residents/1680000,7);
  }
 });
 it('keeps a 24-month default-game smoke run supplied and conserving money and grain',()=>{
  let state=createNewGame(42);
  for(let month=1;month<=24;month++){
   state=advanceMonth(state);const report=state.simulation!.reports.at(-1)!;
   expect(Math.abs(report.moneyError)).toBeLessThan(1e-5);
   expect(Math.abs(report.grainError)).toBeLessThan(1e-5);
   expect(report.shortageCount).toBe(0);
  }
  expect(state.country.treasury).toBeGreaterThan(0);
  expect(Object.values(state.simulation!.prefectures).every(f=>f.treasury>0)).toBe(true);
 });
});
