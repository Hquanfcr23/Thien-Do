import { geoConicConformal,geoPath } from 'd3-geo';
import type { FeatureCollection,Feature,Geometry,Position } from 'geojson';
import countriesJson from './gis/countries.json';
import riversJson from './gis/rivers.json';
import lakesJson from './gis/lakes.json';
import terrainJson from './gis/terrain.json';
import placesJson from './gis/places.json';
import countiesJson from './gis/henan-counties.json';
import type { Pair,MultiPolygon } from 'polygon-clipping';
export interface GISProperties { name:string;code?:string;kind?:string;unitId?:string;shapeID?:string;source?:string;sourceCount?:number;sourceNames?:string[] }
const collection=(value:unknown)=>value as FeatureCollection<Geometry,GISProperties>;
export const countries=collection(countriesJson),rivers=collection(riversJson),lakes=collection(lakesJson),terrain=collection(terrainJson),places=collection(placesJson),counties=collection(countiesJson);
// Lambert conformal conic: geographic coordinates in WGS84 degrees, no GCJ-02 offset.
// Fixed projection shared by every layer; camera never changes this projection.
export const projection=geoConicConformal().parallels([25,47]).rotate([-105,0]).center([0,35]).translate([700,425]).scale(7200).precision(.2);
export const geographicPath=geoPath(projection);
export function projectGeo(position:Position):Pair {const p=projection([position[0]!,position[1]!]);if(!p)throw new Error('Tọa độ ngoài phép chiếu.');return[p[0],p[1]];}
export function projectPolygon(feature:Feature):MultiPolygon{
 const g=feature.geometry;if(!g||g.type!=='Polygon'&&g.type!=='MultiPolygon')throw new Error('Cần polygon GIS.');
 const polygons=g.type==='Polygon'?[g.coordinates]:g.coordinates;return polygons.map(p=>p.map(r=>r.map(projectGeo)));
}
export const chinaFeature=countries.features.find(f=>f.properties.code==='CHN')!;
export const chinaShape=projectPolygon(chinaFeature);
export const baseLayers={countries:countries.features.map(f=>({name:f.properties.name,path:geographicPath(f)??''})),rivers:rivers.features.map(f=>({name:f.properties.name,path:geographicPath(f)??''})),lakes:lakes.features.map(f=>({name:f.properties.name,path:geographicPath(f)??''})),terrain:terrain.features.filter(f=>f.properties.kind==='Range/mtn'||f.properties.kind==='Plateau').map(f=>({name:f.properties.name,path:geographicPath(f)??''}))};

