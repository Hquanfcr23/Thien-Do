import fs from 'node:fs';
import console from 'node:console';
import { geoArea } from 'd3-geo';
import clipping from 'polygon-clipping';
const data=JSON.parse(fs.readFileSync('src/data/gis/henan-counties.json','utf8'));
const radius=6371.0088;
const totals=new Map();
for(const f of data.features){
 const g=JSON.parse(JSON.stringify(f.geometry));
 const polygons=g.type==='Polygon'?[g.coordinates]:g.coordinates;
 for(const p of polygons)for(const ring of p)ring.reverse();
 const km2=geoArea({type:'Feature',properties:{},geometry:g})*radius**2;
 const id=f.properties.unitId;
 for(const key of ['toan-vung',id.split('-fu-')[0],id.split('-jun-')[0],id.split('-xian-')[0],id]){
  const v=totals.get(key)||{count:0,km2:0,shapes:[]};v.count++;v.km2+=km2;v.shapes.push(f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates);totals.set(key,v);
 }
}
const out=[...totals].map(([id,v])=>{
 const merged=clipping.union(v.shapes[0],...v.shapes.slice(1));for(const p of merged)for(const r of p)r.reverse();
 const unionKm2=geoArea({type:'MultiPolygon',coordinates:merged})*radius**2;
 if(Math.abs(unionKm2-v.km2)>.1)throw Error(`Area mismatch ${id}`);
 return{id,huyen:v.count,km2:Math.round(unionKm2),sumChildrenKm2:v.km2,unionKm2,errorKm2:Math.abs(unionKm2-v.km2)};
});
fs.writeFileSync('docs/HAN_SCALE_AREAS.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out.filter(v=>v.id==='toan-vung'||!v.id.includes('-fu-')),null,2));
