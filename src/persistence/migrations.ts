import { z } from 'zod';
import { legacyGameStateSchema } from '../domain/legacy';
import { gameStateSchema } from '../domain/schemaV4';
import { initialMapView } from '../domain/territory';
import { fictional } from '../data/territories';
export const legacySaveSchema=z.object({schemaVersion:z.literal(1),campaignVersion:z.literal('0.1.0'),timestamp:z.string().datetime(),state:legacyGameStateSchema}).strict();
export function migrateV1(value:unknown){
 const old=legacySaveSchema.parse(value),s=old.state;
 // Existing v1 data is preserved. Only add metadata, geometry and view defaults.
 const units=s.administrativeUnits.map(u=>({...u,terrain:'plain' as const,controllerId:s.country.id,control:100,provenance:fictional,bounds:null as null|{x:number;y:number;w:number;h:number}}));
 function locate(parentId:string,b:{x:number;y:number;w:number;h:number}){const children=units.filter(u=>u.parentId===parentId);children.forEach((u,i)=>{u.bounds={...b,x:b.x+b.w*i/children.length,w:b.w/children.length};locate(u.id,u.bounds);});}
 for(const root of units.filter(u=>u.parentId===null))locate(root.id,{x:0,y:0,w:1,h:1});
 return {schemaVersion:2 as const,campaignVersion:'0.2.0' as const,timestamp:old.timestamp,state:gameStateSchema.parse({...s,campaignVersion:'0.2.0',currency:'silver-tael',administrativeUnits:units,geography:{cities:[],roads:[]},mapView:{...initialMapView}})};
}

const saveV3Schema=z.object({schemaVersion:z.literal(3),campaignVersion:z.literal('0.2.0'),timestamp:z.string().datetime(),state:gameStateSchema.refine(s=>s.simulation!==undefined,'Save v3 cần mô phỏng')}).strict();
export function migrateV3(value:unknown){
 const old=saveV3Schema.parse(value),state=structuredClone(old.state),units=state.administrativeUnits;
 const removed=new Map(units.filter(u=>u.levelId==='jun').map(u=>[u.id,u]));
 for(const junior of removed.values()){
  const prefecture=units.find(u=>u.id===junior.parentId);
  if(!prefecture)throw new Error(`Không tìm thấy Phủ cha của Quận cũ ${junior.id}.`);
  prefecture.treasury+=junior.treasury;
  if(junior.governorId!==null&&prefecture.governorId===null)prefecture.governorId=junior.governorId;
 }
 const parentByOldId=new Map([...removed].map(([id,junior])=>[id,units.find(u=>u.id===junior.parentId)!]));
 for(const city of state.geography.cities){const parent=parentByOldId.get(city.unitId);if(parent)city.unitId=parent.id;}
 for(const army of state.militaryUnits){const junior=[...removed.values()].find(u=>u.locationId===army.locationId);const parent=junior?parentByOldId.get(junior.id):undefined;if(parent)army.locationId=parent.locationId;}
 state.administrativeUnits=units.filter(u=>u.levelId!=='jun');
 for(const county of state.administrativeUnits.filter(u=>u.levelId==='xian')){
  const parent=county.parentId?units.find(u=>u.id===county.parentId):undefined;
  if(parent?.levelId==='fu')continue;
  const oldJunior=parent?removed.get(parent.id):undefined;
  if(!oldJunior||!oldJunior.parentId)throw new Error(`Không tìm thấy Quận cha của Huyện ${county.id}.`);
  county.parentId=oldJunior.parentId;
 }
 state.administrativeProfile.levels=state.administrativeProfile.levels.filter(level=>level.id!=='jun');
 if(state.mapView.level==='jun')state.mapView.level='fu';
 if(state.mapView.selectedId&&removed.has(state.mapView.selectedId))state.mapView.selectedId=removed.get(state.mapView.selectedId)!.parentId;
 // Bounds are legacy normalized rectangles; repartition each prefecture across its retained counties.
 for(const prefecture of state.administrativeUnits.filter(u=>u.levelId==='fu')){
  const children=state.administrativeUnits.filter(u=>u.parentId===prefecture.id);
  children.forEach((county,index)=>{if(prefecture.bounds){county.bounds={...prefecture.bounds,y:prefecture.bounds.y+prefecture.bounds.h*index/children.length,h:prefecture.bounds.h/children.length};}});
 }
 return {...old,schemaVersion:4 as const,state:gameStateSchema.parse(state)};
}
