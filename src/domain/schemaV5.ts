import { buildingKinds,simulationSchema } from './economyV2';
import { z } from 'zod';
import { legacyGameStateSchema, administrativeUnitSchema as legacyUnit, provenanceSchema } from './legacy';
import { boundsSchema,mapViewSchema } from './territory';
export { calendarSchema,provenanceSchema,administrativeProfileSchema,characterSchema,militaryUnitSchema } from './legacy';
export type { Calendar,Character,MilitaryUnit,Provenance,AdministrativeProfile } from './legacy';
export const administrativeUnitSchema=legacyUnit.extend({treasury:z.number().finite().nonnegative().optional(),terrain:z.enum(['plain','hills','mountains','riverland']),controllerId:z.string().min(1),control:z.number().min(0).max(100),provenance:provenanceSchema,bounds:boundsSchema.nullable()});
export const gameStateSchema=z.object({...legacyGameStateSchema.shape,
  simulation:simulationSchema.optional(),campaignVersion:z.literal('0.2.0'),currency:z.literal('silver-tael'),administrativeUnits:z.array(administrativeUnitSchema),mapView:mapViewSchema,
  geography:z.object({cities:z.array(z.object({id:z.string(),name:z.string(),unitId:z.string()}).strict()),roads:z.array(z.object({id:z.string(),from:z.string(),to:z.string()}).strict())}).strict(),
}).strict().superRefine((state,ctx)=>{
 const fail=(message:string)=>ctx.addIssue({code:'custom',message});
 const legacy=Object.fromEntries(Object.keys(legacyGameStateSchema.shape).map(key=>[key,key==='campaignVersion'?'0.1.0':key==='administrativeUnits'?state.administrativeUnits.map(unit=>Object.fromEntries(Object.keys(legacyUnit.shape).map(k=>[k,k==='treasury'?(unit.treasury??0):Reflect.get(unit,k)]))):Reflect.get(state,key)]));
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
 if(state.simulation){
 const sim=state.simulation;
 for(const u of units.values())if(u.treasury!==undefined)fail('Ngân khố chỉ lưu tại Phủ trong simulation.prefectures.');
 const fuIds=new Set(state.administrativeUnits.filter(u=>u.levelId==='fu').map(u=>u.id));
 if(Object.keys(sim.prefectures).length!==fuIds.size||Object.keys(sim.prefectures).some(id=>!fuIds.has(id)))fail('Dữ liệu kinh tế Phủ không khớp.');
 for(const [id,f]of Object.entries(sim.prefectures))if(units.get(f.seatCountyId)?.parentId!==id)fail('Trị sở Phủ phải nằm trong Huyện trực thuộc.');
 for(const id of Object.keys(sim.zhouPolicies))if(units.get(id)?.levelId!=='zhou')fail('Chính sách Châu tham chiếu sai.');
 const leafIds=new Set(state.administrativeUnits.filter(u=>u.levelId===state.administrativeProfile.levels.at(-1)?.id).map(u=>u.id));
 if(Object.keys(sim.counties).length!==leafIds.size||Object.keys(sim.counties).some(id=>!leafIds.has(id)))fail('Dữ liệu kinh tế không khớp các Huyện.');
 for(const [id,c] of Object.entries(sim.counties)){
 const u=units.get(id);if(!u)continue;if(c.workingAge>u.population||c.farmers+c.landowners+c.artisans!==u.population)fail('Nhóm dân số không khớp dân số Huyện.');
 if(Object.keys(c.buildings).some(k=>!buildingKinds.includes(k as typeof buildingKinds[number])))fail('Loại công trình chưa hỗ trợ.');
 }
 const cargoIds=new Set(sim.shipments.map(x=>x.id));if(cargoIds.size!==sim.shipments.length||sim.shipments.some(x=>x.id>=sim.nextId))fail('ID lô hàng không hợp lệ.');
 for(const x of sim.shipments){let at=x.from;for(const id of x.path){const r=sim.routes.find(r=>r.id===id);if(!r||r.from!==at&&r.to!==at){fail('Đường đi của lô hàng không liên tục.');break;}at=r.from===at?r.to:r.from;}if(at!==x.to)fail('Lô hàng không đến đúng đích.');}
 const routeIds=new Set(sim.routes.map(r=>r.id));if(routeIds.size!==sim.routes.length)fail('ID tuyến kinh tế trùng.');
 for(const r of sim.routes)if(!leafIds.has(r.from)||!leafIds.has(r.to)||r.from===r.to)fail('Tuyến kinh tế tham chiếu sai.');
 for(const shipment of sim.shipments)if(((shipment.purpose==='tax'||shipment.purpose==='market')&&(!shipment.prefectureId||!sim.prefectures[shipment.prefectureId]||sim.prefectures[shipment.prefectureId]!.seatCountyId!==shipment.to))||!leafIds.has(shipment.from)||!leafIds.has(shipment.to)||shipment.path.some(id=>!routeIds.has(id))||shipment.leg>=shipment.path.length)fail('Hàng vận chuyển tham chiếu sai.');
 }
 if(state.simulation)for(const x of state.simulation.shipments)if(x.purpose==='construction'){const target=state.simulation.counties[x.projectTargetId??'']??state.simulation.prefectures[x.projectTargetId??''];if(!target?.projects.some(p=>p.building===x.building))fail('Lô vật tư không có công trường.');}
 const cities=new Set(state.geography.cities.map(c=>c.id));
 if(cities.size!==state.geography.cities.length||new Set(state.geography.roads.map(r=>r.id)).size!==state.geography.roads.length)fail('ID thành trì/tuyến trùng.');
 for(const c of state.geography.cities)if(!units.get(c.unitId)?.bounds)fail('Thành trì không có lãnh thổ hợp lệ.');
 for(const r of state.geography.roads)if(!cities.has(r.from)||!cities.has(r.to)||r.from===r.to)fail('Tuyến đường không hợp lệ.');
});
export type GameState=z.infer<typeof gameStateSchema>;
export type Country=GameState['country'];
export type AdministrativeUnit=z.infer<typeof administrativeUnitSchema>;



