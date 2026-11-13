import { z } from 'zod';
import { legacyGameStateSchema } from '../domain/legacy';
import { gameStateSchema } from '../domain/schema';
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
