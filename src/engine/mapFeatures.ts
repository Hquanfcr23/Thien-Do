import type { Pair,MultiPolygon } from 'polygon-clipping';
import { places,projectGeo } from '../data/realGeography';
import { inside } from './mapGeometry';
export function containsPoint(shape:MultiPolygon,p:Pair){return shape.some(poly=>inside(p,poly[0]!)&&!poly.slice(1).some(h=>inside(p,h)));}
export function settlementPoint(shape:MultiPolygon,pole:Pair):Pair{
 const points=places.features.filter(f=>f.geometry.type==='Point'&&f.properties.code==='CHN').map(f=>f.geometry.type==='Point'?projectGeo(f.geometry.coordinates):pole);
 return points.filter(p=>containsPoint(shape,p)).sort((a,b)=>Math.hypot(a[0]-pole[0],a[1]-pole[1])-Math.hypot(b[0]-pole[0],b[1]-pole[1]))[0]??pole;
}
