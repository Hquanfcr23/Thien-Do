import { describe,it,expect } from 'vitest';
import * as clip from 'polygon-clipping';
import { createNewGame } from '../data/foundation';
import { buildAtlas,inside } from '../engine/mapGeometry';
import { area } from '../data/mapGeography';
describe('natural geographic atlas',()=>{
 const state=createNewGame(),atlas=buildAtlas(state);
 it('has one nonempty geographic shape per administrative ID and internal label',()=>{
  expect(atlas.size).toBe(state.administrativeUnits.length);
  for(const u of state.administrativeUnits){const a=atlas.get(u.id)!;expect(area(a.shape),u.id).toBeGreaterThan(1);expect(a.shape.some(p=>inside(a.label,p[0]!)&&!p.slice(1).some(h=>inside(a.label,h))),u.id).toBe(true);}
 });
 it.each(['zhou','fu','jun','xian'])('%s covers the national outline with neither gaps nor overlaps',level=>{
  const shapes=state.administrativeUnits.filter(u=>u.levelId===level).map(u=>atlas.get(u.id)!.shape);
  const union=clip.union(shapes[0]!,...shapes.slice(1));expect(area(clip.xor(union,atlas.get('capital')!.shape))).toBeLessThan(.001);
  for(let i=0;i<shapes.length;i++)for(let j=i+1;j<shapes.length;j++)expect(area(clip.intersection(shapes[i]!,shapes[j]!))).toBeLessThan(.001);
 });
 it('every upper boundary is exactly the union of its children',()=>{
  for(const u of state.administrativeUnits){const children=state.administrativeUnits.filter(c=>c.parentId===u.id);if(!children.length)continue;const shapes=children.map(c=>atlas.get(c.id)!.shape);expect(area(clip.xor(atlas.get(u.id)!.shape,clip.union(shapes[0]!,...shapes.slice(1))))).toBeLessThan(.001);}
 });
 it('each child is contained and parent area equals the sum of children',()=>{
  for(const parent of state.administrativeUnits){
   const children=state.administrativeUnits.filter(c=>c.parentId===parent.id);
   if(!children.length)continue;
   const parentShape=atlas.get(parent.id)!.shape;
   const total=children.reduce((sum,c)=>sum+area(atlas.get(c.id)!.shape),0);
   expect(Math.abs(total-area(parentShape))).toBeLessThan(.001);
   for(const child of children){const shape=atlas.get(child.id)!.shape;expect(area(clip.difference(shape,parentShape))).toBeLessThan(.001);expect(area(shape)).toBeLessThanOrEqual(area(parentShape)+.001);}
  }
 });
 it('does not mutate administrative data or save values',()=>{const before=JSON.stringify(state);buildAtlas(state);expect(JSON.stringify(state)).toBe(before);});
});
