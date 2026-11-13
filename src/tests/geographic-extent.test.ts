import { describe,it,expect } from 'vitest';
import { geoArea } from 'd3-geo';
import clipping from 'polygon-clipping';
import type { MultiPolygon as ClipMultiPolygon } from 'polygon-clipping';
import { counties } from '../data/realGeography';
import { createNewGame } from '../data/foundation';
import type { Polygon,MultiPolygon } from 'geojson';
const state=createNewGame();
describe('fixed real county extent',()=>{
 it('meets the 200000–400000 km2 target from geographic coordinates',()=>{
  const total=counties.features.reduce((s,f)=>{const g=structuredClone(f.geometry) as Polygon|MultiPolygon;for(const p of g.type==='Polygon'?[g.coordinates]:g.coordinates)for(const r of p)r.reverse();return s+geoArea(g)*6371.0088**2;},0);
  expect(total).toBeGreaterThanOrEqual(200000);expect(total).toBeLessThanOrEqual(400000);expect(total).toBeCloseTo(237254.30999,1);
 });
 it('keeps same-level area disparities bounded and every county below the smallest prefecture',()=>{
  const regions=state.administrativeUnits.map(u=>{const descendants=(id:string):string[]=>{const children=state.administrativeUnits.filter(x=>x.parentId===id);return children.length?children.flatMap(x=>descendants(x.id)):[id];};const ids=new Set(descendants(u.id));const total=counties.features.filter(f=>ids.has(f.properties.unitId!)).reduce((sum,f)=>{const g=structuredClone(f.geometry) as Polygon|MultiPolygon;for(const p of g.type==='Polygon'?[g.coordinates]:g.coordinates)for(const r of p)r.reverse();return sum+geoArea(g)*6371.0088**2;},0);return{level:u.levelId,total};});
  for(const [level,maxRatio] of [['zhou',2],['fu',3],['jun',2.5],['xian',4]] as const){const values=regions.filter(r=>r.level===level).map(r=>r.total);expect(Math.max(...values)/Math.min(...values),level).toBeLessThan(maxRatio);}
  expect(Math.max(...regions.filter(r=>r.level==='xian').map(r=>r.total))).toBeLessThan(Math.min(...regions.filter(r=>r.level==='fu').map(r=>r.total)));
 });
 it('has no gaps enclosed by the playable region',()=>{
  const shapes=counties.features.map(f=>{const g=f.geometry as Polygon|MultiPolygon;return (g.type==='Polygon'?[g.coordinates]:g.coordinates) as ClipMultiPolygon;});
  const merged=clipping.union(shapes[0]!,...shapes.slice(1));expect(merged).toHaveLength(1);expect(merged[0]).toHaveLength(1);
 });
 it('has a shared-edge connected county graph for every parent',()=>{
  const edgeOwners=new Map<string,Set<string>>(),adj=new Map<string,Set<string>>();
  for(const f of counties.features){const id=f.properties.unitId!;adj.set(id,new Set());const g=f.geometry as Polygon|MultiPolygon;
   for(const p of g.type==='Polygon'?[g.coordinates]:g.coordinates)for(const r of p)for(let i=1;i<r.length;i++){const key=[r[i-1]!.map(n=>n.toFixed(5)).join(','),r[i]!.map(n=>n.toFixed(5)).join(',')].sort().join('|');if(!edgeOwners.has(key))edgeOwners.set(key,new Set());edgeOwners.get(key)!.add(id);}
  }
  for(const ids of edgeOwners.values())for(const a of ids)for(const b of ids)if(a!==b)adj.get(a)!.add(b);
  for(const parent of state.administrativeUnits.filter(u=>u.levelId!=='xian')){
   const belongs=(id:string):boolean=>{let unit=state.administrativeUnits.find(u=>u.id===id);while(unit){if(unit.id===parent.id)return true;unit=state.administrativeUnits.find(u=>u.id===unit!.parentId);}return false;};
   const ids=new Set([...adj.keys()].filter(belongs));const first=ids.values().next().value as string|undefined;if(!first)continue;const seen=new Set([first]),queue=[first];while(queue.length)for(const id of adj.get(queue.pop()!)!)if(ids.has(id)&&!seen.has(id)){seen.add(id);queue.push(id);}expect(seen.size,parent.id).toBe(ids.size);
  }
 });
});
