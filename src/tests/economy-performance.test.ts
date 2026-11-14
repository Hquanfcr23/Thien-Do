import {it,expect} from 'vitest';
import fs from 'node:fs';
import fixture from './fixtures/economy-v4-100.json';
import baseline from '../../docs/PHASE_3_BASELINE.json';
import {decodeSave} from '../persistence/saves';
import {advanceMonth} from '../engine/month';
import type {EconomicState} from '../engine/economyContext';
it('runs the same 100-county, 294-route fixture for 240 months faster than the old county markets',()=>{
 let s=decodeSave(fixture).state as EconomicState;const start=performance.now();let maximumError=0;
 for(let i=0;i<240;i++){s=advanceMonth(s) as EconomicState;const report=s.simulation.reports.at(-1)!;maximumError=Math.max(maximumError,Math.abs(report.moneyError),...Object.values(report.goodsError));}
 const ms=performance.now()-start;const report={counties:100,prefectures:10,routes:s.simulation.routes.length,months:240,shipments:s.simulation.shipments.length,elapsedMs:ms,msPerMonth:ms/240,baselineMsPerMonth:baseline.msPerMonth,speedup:baseline.msPerMonth/(ms/240),maximumError,fixture:'Same saved synthetic graph and endowments used by county-market baseline; GIS unchanged in game'};
 fs.writeFileSync('docs/PHASE_3_PERFORMANCE.json',JSON.stringify(report,null,2));expect(maximumError).toBeLessThanOrEqual(1e-5);expect(report.msPerMonth).toBeLessThanOrEqual(30);expect(report.msPerMonth).toBeLessThan(baseline.msPerMonth);
},300000);
