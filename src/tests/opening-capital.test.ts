import {it,expect} from 'vitest';
import {createNewGame} from '../data/foundation';
import {advanceMonth} from '../engine/month';
import {exportSave,importSave} from '../persistence/saves';
it('preserves baseline purchasing power and loaded assets',()=>{
 let s=createNewGame();
 expect(s.country.treasury).toBe(6000);
 expect(s.country.grainReserve).toBe(6000);
 expect(Object.values(s.simulation!.prefectures).reduce((n,f)=>n+f.treasury,0)).toBeCloseTo(6000,8);
 s.country.treasury=6000;s.country.grainReserve=6000;
 expect(importSave(exportSave(s))).toEqual(s);
 s=createNewGame();
 for(let i=0;i<12;i++){s=advanceMonth(s);const r=s.simulation!.reports.at(-1)!;expect(Math.abs(r.moneyError)).toBeLessThan(1e-5);expect(Math.abs(r.grainError)).toBeLessThan(1e-5);}
});

