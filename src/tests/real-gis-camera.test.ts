import { describe,it,expect } from 'vitest';
import { createNewGame } from '../data/foundation';
import { buildAtlas,area } from '../engine/mapGeometry';
import { cameraModel,constrainCamera,fitPlayable,zoomCamera } from '../engine/mapCamera';
import { chinaShape,counties,projection,projectGeo } from '../data/realGeography';
const s=createNewGame(),atlas=buildAtlas(s),root=atlas.get('capital')!.shape;
describe('real GIS and freely pannable camera',()=>{
 it('binds each county to an actual source geometry and retains IDs',()=>{expect(counties.features).toHaveLength(24);expect(new Set(counties.features.map(f=>f.properties.unitId)).size).toBe(24);const capital=atlas.get('zhou-trung-ninh-fu-1-jun-1-xian-1')!;expect(capital.sourceName).toBe('Hangjinqi');expect(capital.coordinates[0]).toBeGreaterThan(107);expect(capital.coordinates[0]).toBeLessThan(110);expect(root.length).toBeGreaterThan(0);expect(area(root)).toBeGreaterThan(10000);});
 it('uses one invertible geographic projection',()=>{for(const p of [[112.444471,34.64377],[116.4,39.9],[108.9,34.3]]){const actual=projection.invert!(projectGeo(p));expect(actual?.[0]).toBeCloseTo(p[0]!,6);expect(actual?.[1]).toBeCloseTo(p[1]!,6);}});
 it.each([{left:110,right:1030,top:170,bottom:780},{left:110,right:760,top:160,bottom:540}])('preserves free pan at every zoom and viewport %j',frame=>{
  const m=cameraModel(root,chinaShape,frame);
  for(const zoom of [m.minZoom,.7,1.5,4])for(const x of [-1e9,0,1e9])for(const y of [-1e9,0,1e9]){
   const v=constrainCamera({zoom,x,y},m);expect(v.x).toBe(x);expect(v.y).toBe(y);
   expect(v.zoom).toBeGreaterThanOrEqual(m.minZoom);expect(v.zoom).toBeLessThanOrEqual(4);
  }
 });
 it('fits and constrains the same saved camera deterministically',()=>{const m=cameraModel(root,chinaShape,{left:110,right:1030,top:170,bottom:780}),fit=fitPlayable(root,m);expect(constrainCamera(fit,m)).toEqual(fit);const anchor:[number,number]=[550,450],close=zoomCamera(fit,4,anchor,m);expect((anchor[0]-700-close.x)/close.zoom).toBeCloseTo((anchor[0]-700-fit.x)/fit.zoom,8);expect((anchor[1]-425-close.y)/close.zoom).toBeCloseTo((anchor[1]-425-fit.y)/fit.zoom,8);expect(zoomCamera(close,1e8,[550,450],m).zoom).toBe(4);});
});
