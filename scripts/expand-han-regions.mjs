import fs from 'node:fs';
import console from 'node:console';
import clipping from 'polygon-clipping';
// Reviewed assignments of whole source units; no generated boundaries.
const source=JSON.parse(fs.readFileSync('.audit/gis/counties.json','utf8')).features;
const mapping=JSON.parse(fs.readFileSync('src/data/gis/balanced-membership.json','utf8'));
const byId=new Map(source.map(f=>[f.properties.shapeID,f]));
const polygons=f=>f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
const membership=[],seen=new Set();
const features=mapping.map(({unitId,sourceIds})=>{
 const all=sourceIds.map(id=>{const f=byId.get(id);if(!f||seen.has(id))throw Error(`Missing or duplicate source ${id}`);seen.add(id);return f;});
 for(const f of all)membership.push({unitId,shapeID:f.properties.shapeID,name:f.properties.shapeName});
 return {type:'Feature',properties:{unitId,name:all[0].properties.shapeName,shapeID:all[0].properties.shapeID,source:'geoBoundaries CHN ADM2 2017',sourceCount:all.length,sourceNames:all.map(f=>f.properties.shapeName)},geometry:{type:'MultiPolygon',coordinates:clipping.union(...all.map(polygons))}};
});
fs.writeFileSync('src/data/gis/henan-counties.json',JSON.stringify({type:'FeatureCollection',features}));
fs.writeFileSync('docs/GIS_COUNTY_MEMBERSHIP.json',JSON.stringify(membership,null,2));
console.log(`Mapped ${membership.length} GIS units into ${features.length} game units.`);
