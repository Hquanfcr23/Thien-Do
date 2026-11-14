import 'fake-indexeddb/auto';
import { describe,expect,it } from 'vitest';
import { createNewGame } from '../data/foundation';
import { createLegacyGame } from '../data/legacyFoundation';
import { gameStateSchema } from '../domain/schema';
import { summarizeUnit,descendants,center,polygon,selectTerritory } from '../engine/administration';
import { formatSilver,toCoins } from '../engine/money';
import { decodeSave,exportSave,importSave,writeSave,readSave } from '../persistence/saves';
import { useGameStore } from '../state/gameStore';

describe('Phase 2 administration',()=>{
 it('creates a three-tier Châu–Phủ–Huyện tree and preserves GIS county identity',()=>{
  const s=createNewGame(),z=s.administrativeUnits.filter(u=>u.levelId==='zhou');expect(z).toHaveLength(3);
  expect(s.administrativeProfile.levels.map(level=>level.id)).toEqual(['central','zhou','fu','xian']);
  expect(z.map(p=>s.administrativeUnits.filter(u=>u.parentId===p.id).length)).toEqual([2,3,2]);
  expect(s.administrativeUnits.filter(u=>u.levelId==='fu')).toHaveLength(7);expect(s.administrativeUnits.filter(u=>u.levelId==='xian')).toHaveLength(24);
  expect(s.administrativeUnits.some(u=>u.levelId==='jun')).toBe(false);
  expect(s.administrativeUnits.filter(u=>u.levelId==='xian').every(u=>s.administrativeUnits.find(p=>p.id===u.parentId)?.levelId==='fu')).toBe(true);
  expect(s.administrativeUnits.filter(u=>u.parentId!==null).every(u=>u.bounds!==null)).toBe(true);
  expect(new Set(s.administrativeUnits.map(u=>u.id)).size).toBe(s.administrativeUnits.length);
  expect(s.administrativeUnits.every(u=>u.provenance.kind==='Fictional')).toBe(true);
 });
 it.each(['orphan','duplicate','cycle','skip-level','outside','overlap','missing-region','bad-selection','bad-road','bad-city'] as const)('rejects %s',mode=>{
  const s=createNewGame(),leaf=s.administrativeUnits.find(u=>u.levelId==='xian')!;
  if(mode==='orphan')leaf.parentId='missing';if(mode==='duplicate')s.administrativeUnits.push({...leaf});if(mode==='cycle')s.administrativeUnits[1]!.parentId=leaf.id;
  if(mode==='skip-level')leaf.parentId='capital';if(mode==='outside')leaf.bounds={x:0,y:0,w:1,h:1};if(mode==='overlap')s.administrativeUnits.find(u=>u.id!==leaf.id&&u.parentId===leaf.parentId)!.bounds={...leaf.bounds!};
  if(mode==='missing-region')leaf.bounds=null;if(mode==='bad-selection')s.mapView.selectedId='unknown';if(mode==='bad-road')s.geography.roads[0]!.to='missing';if(mode==='bad-city')s.geography.cities[0]!.unitId='missing';
  expect(gameStateSchema.safeParse(s).success).toBe(false);
 });
 it('aggregates leaves exactly once with population weighted stability/control',()=>{
  const s=createNewGame(),leaves=s.administrativeUnits.filter(u=>u.levelId==='xian'),total=summarizeUnit(s,'capital');
  expect(total.population).toBe(leaves.reduce((n,u)=>n+u.population,0));expect(total.resources.iron).toBe(leaves.reduce((n,u)=>n+(u.resources.iron??0),0));
  expect(total.stability).toBeCloseTo(leaves.reduce((n,u)=>n+u.stability*u.population,0)/total.population);
  expect(total.control).toBeCloseTo(leaves.reduce((n,u)=>n+u.control*u.population,0)/total.population);
  const provinces=s.administrativeUnits.filter(u=>u.levelId==='zhou');expect(provinces.reduce((n,u)=>n+summarizeUnit(s,u.id).population,0)).toBe(total.population);
 });
 it('handles zero population and mixed controllers without inventing ownership',()=>{
  const s=createNewGame(),leaves=s.administrativeUnits.filter(u=>u.levelId==='xian');for(const u of leaves)u.population=0;
  leaves[0]!.controllerId='uncontrolled';expect(summarizeUnit(s,'capital').stability).toBeCloseTo(leaves.reduce((n,u)=>n+u.stability,0)/leaves.length);expect(summarizeUnit(s,'capital').controllers).toHaveProperty('uncontrolled');
 });
 it('geometry uses shared corners and nests a complete partition',()=>{
  const s=createNewGame();for(const parent of s.administrativeUnits){const children=s.administrativeUnits.filter(u=>u.parentId===parent.id);if(parent.bounds&&children.length){expect(children.reduce((n,u)=>n+u.bounds!.w*u.bounds!.h,0)).toBeCloseTo(parent.bounds.w*parent.bounds.h,10);}if(parent.bounds){expect(polygon(parent.bounds).split(' ')).toHaveLength(4);expect(center(parent.bounds).every(Number.isFinite)).toBe(true);}}
 });
 it('selection and focus are pure and persistent with camera and layer',async()=>{
  const s=createNewGame(),leaf=s.administrativeUnits.find(u=>u.levelId==='xian')!;
  const next=selectTerritory(s,leaf.id,true);expect(s.mapView.selectedId).toBeNull();expect(next.mapView.level).toBe('xian');expect(next.mapView.selectedId).toBe(leaf.id);
  useGameStore.getState().replaceGame(next);useGameStore.getState().updateView({zoom:1.8,x:125,y:-80});
  const snapshot=useGameStore.getState().game!;expect(importSave(exportSave(snapshot))).toEqual(snapshot);await writeSave('manual-3',snapshot);expect((await readSave('manual-3'))?.state).toEqual(snapshot);
 });
 it('descendants include a selected unit but never siblings',()=>{const s=createNewGame(),province=s.administrativeUnits.find(u=>u.levelId==='zhou')!;expect(descendants(s,province.id).every(u=>u.id.startsWith(province.id))).toBe(true);});
 it('migrates v1 without mutating or replacing old state values',()=>{
  const state=createLegacyGame(77);state.country.treasury=12345;const old={schemaVersion:1,campaignVersion:'0.1.0',timestamp:'2026-11-12T00:00:00Z',state};const before=JSON.stringify(old),save=decodeSave(old);
  expect(save.schemaVersion).toBe(6);expect(save.state.country).toEqual(state.country);expect(save.state.characters).toEqual(state.characters);expect(save.state.administrativeUnits).toHaveLength(1);expect(save.state.currency).toBe('silver-tael');expect(JSON.stringify(old)).toBe(before);
 });
 it('uses silver taels and the fixed coin ratio',()=>{expect(toCoins(1)).toBe(1000);expect(toCoins(1.234)).toBe(1234);expect(formatSilver(12000)).toContain('lượng bạc');expect(()=>toCoins(NaN)).toThrow();});
});
