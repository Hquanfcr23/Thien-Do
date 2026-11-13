import { z } from 'zod';
import { legacyGameStateSchema, administrativeUnitSchema as legacyUnit, provenanceSchema } from './legacy';
import { boundsSchema,mapViewSchema } from './territory';
export { calendarSchema,provenanceSchema,administrativeProfileSchema,characterSchema,militaryUnitSchema } from './legacy';
export type { Calendar,Character,MilitaryUnit,Provenance,AdministrativeProfile } from './legacy';
export const administrativeUnitSchema=legacyUnit.extend({terrain:z.enum(['plain','hills','mountains','riverland']),controllerId:z.string().min(1),control:z.number().min(0).max(100),provenance:provenanceSchema,bounds:boundsSchema.nullable()});
export const gameStateSchema=z.object({...legacyGameStateSchema.shape,
  campaignVersion:z.literal('0.2.0'),currency:z.literal('silver-tael'),administrativeUnits:z.array(administrativeUnitSchema),mapView:mapViewSchema,
  geography:z.object({cities:z.array(z.object({id:z.string(),name:z.string(),unitId:z.string()}).strict()),roads:z.array(z.object({id:z.string(),from:z.string(),to:z.string()}).strict())}).strict(),
}).strict().superRefine((state,ctx)=>{
 const fail=(message:string)=>ctx.addIssue({code:'custom',message});
 const legacy=Object.fromEntries(Object.keys(legacyGameStateSchema.shape).map(key=>[key,key==='campaignVersion'?'0.1.0':key==='administrativeUnits'?state.administrativeUnits.map(unit=>Object.fromEntries(Object.keys(legacyUnit.shape).map(k=>[k,Reflect.get(unit,k)]))):Reflect.get(state,key)]));
 const checked=legacyGameStateSchema.safeParse(legacy);if(!checked.success)for(const issue of checked.error.issues)ctx.addIssue({code:'custom',message:issue.message,path:issue.path});
 const units=new Map(state.administrativeUnits.map(u=>[u.id,u]));
 for(const unit of units.values()){
  if(unit.controllerId!==state.country.id&&unit.controllerId!=='uncontrolled')fail(`Quyền kiểm soát không tồn tại: ${unit.id}`);
  if(unit.parentId!==null&&!unit.bounds)fail(`Thiếu vùng bản đồ: ${unit.id}`);
  const p=unit.parentId?units.get(unit.parentId)?.bounds:null,b=unit.bounds;
  if(b&&p&&(b.x<p.x-1e-8||b.y<p.y-1e-8||b.x+b.w>p.x+p.w+1e-8||b.y+b.h>p.y+p.h+1e-8))fail(`Vùng nằm ngoài cấp cha: ${unit.id}`);
  const children=state.administrativeUnits.filter(c=>c.parentId===unit.id);
  if(children.length&&Math.abs(children.reduce((s,c)=>s+(c.bounds?c.bounds.w*c.bounds.h:0),0)-(b?b.w*b.h:1))>1e-8)fail(`Vùng con không phủ cấp cha: ${unit.id}`);
 }
 // Every sibling partition, including the Châu under central, must be disjoint.
 for(let i=0;i<state.administrativeUnits.length;i++)for(let j=i+1;j<state.administrativeUnits.length;j++){
  const u=state.administrativeUnits[i]!,v=state.administrativeUnits[j]!,a=u.bounds,b=v.bounds;
  if(u.parentId===v.parentId&&a&&b&&Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>1e-8&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>1e-8)fail('Vùng anh em chồng lấn.');
 }
 if(state.mapView.selectedId!==null&&!units.has(state.mapView.selectedId))fail('Đơn vị đang chọn không tồn tại.');
 const cities=new Set(state.geography.cities.map(c=>c.id));
 if(cities.size!==state.geography.cities.length||new Set(state.geography.roads.map(r=>r.id)).size!==state.geography.roads.length)fail('ID thành trì/tuyến trùng.');
 for(const c of state.geography.cities)if(!units.get(c.unitId)?.bounds)fail('Thành trì không có lãnh thổ hợp lệ.');
 for(const r of state.geography.roads)if(!cities.has(r.from)||!cities.has(r.to)||r.from===r.to)fail('Tuyến đường không hợp lệ.');
});
export type GameState=z.infer<typeof gameStateSchema>;
export type Country=GameState['country'];
export type AdministrativeUnit=z.infer<typeof administrativeUnitSchema>;



