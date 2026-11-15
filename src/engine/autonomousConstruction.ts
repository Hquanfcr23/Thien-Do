import type { BuildingKind,Order } from '../domain/economy';
import type { Priority } from '../domain/court';
import { coreBuildingKinds,buildings,projectDefinition } from '../data/economicConfig';
import { courtHash } from '../data/courtFoundation';
import { quoteBuilding } from './buildingRules';
import { operatingCost,cashFloor } from './budget';
import { startBuilding } from './construction';
import { householdReserve,marketAccess,metricsFor,stock,type MonthContext } from './economyContext';
import { constructionPriorities } from './policies';
export { constructionPriorities } from './policies';

const ranks:Record<Priority,number>={forbid:0,low:1,normal:2,high:3,focus:4};
export function applyConstructionPolicy(ctx:MonthContext,order:Order){
 if(order.kind!=='construction-policy')return;const u=ctx.units.get(order.unitId),court=ctx.s.court;
 if(!court||!u||!['zhou','fu'].includes(u.levelId))throw Error('Ưu tiên chỉ đặt tại Châu hoặc Phủ');
 if(order.priorities===null){if(u.levelId!=='fu')throw Error('Chỉ Phủ có thể trở lại kế thừa');delete court.constructionPolicies[u.id];return;}
 if(Object.keys(order.priorities).some(k=>!coreBuildingKinds.some(b=>b===k)))throw Error('Loại công trình không xây mới');
 court.constructionPolicies[u.id]={...order.priorities};
}
export function safetyCash(ctx:MonthContext,fuId:string){return Math.max(cashFloor(ctx,fuId),operatingCost(ctx,fuId)*3);}
export function autonomousConstruction(ctx:MonthContext){
 const {s}=ctx,court=s.court;if(!court)return;court.decisions=[];
 for(const [fuId,f]of Object.entries(s.simulation.prefectures)){
  const counties=s.administrativeUnits.filter(u=>u.parentId===fuId),policy={...constructionPriorities(s,fuId)};
  const works=court.centralOffices?.find(o=>o.seat==='works'),workKind=works?.lastBuilding as BuildingKind|undefined;
  if(works?.holderId&&works.lastAction!==null&&works.lastAction!==undefined&&s.simulation.tick-works.lastAction<3&&workKind&&policy[workKind]!=='forbid'&&(works.lastTarget===fuId||works.lastTarget===ctx.units.get(fuId)?.parentId))policy[workKind]='focus';
  const candidates:{id:string;kind:BuildingKind;routeId?:string;priority:Priority;need:number;tie:number}[]=[];
  for(const kind of coreBuildingKinds){const priority=policy[kind]??'normal';if(priority==='forbid')continue;
   const targets=kind==='granary'?[ctx.units.get(fuId)!]:counties;
   for(const u of targets){const c=s.simulation.counties[u.id],routes=kind==='road'?s.simulation.routes.filter(r=>r.from===u.id||r.to===u.id):[undefined];
    for(const route of routes){
     let need=0;
     if(kind==='farm')need=c?Math.max(0,1-c.land/Math.max(1,u.population*.6)):0;
     if(kind==='irrigation')need=c?Math.max(0,.8-c.water):0;
     if(kind==='mine')need=c?Math.min(1,(c.deposits.ore+c.deposits.stone)/10000)*Math.max(0,1-(c.buildings.mine?.level??0)/3):0;
     if(kind==='workshop')need=c?c.unemployment:0;
     if(kind==='administration')need=1-f.serviceLevel;
     if(kind==='granary')need=Math.max(0,f.grainReserve/Math.max(1,counties.reduce((n,u)=>n+u.population*.05,0)+2500*(f.buildings.granary?.level??0))-.8);
     if(kind==='road')need=route?Math.max(0,route.used/Math.max(1,route.lastCapacity)-.7)+(1-route.quality)*.1:0;
     if(priority!=='focus'&&need<=.01)continue;
     candidates.push({id:u.id,kind,...(route?{routeId:route.id}:{}),priority,need,tie:courtHash(s.seed,`${s.simulation.tick}:${u.id}:${kind}:${route?.id??''}`)});
    }
   }
  }
  candidates.sort((a,b)=>ranks[b.priority]-ranks[a.priority]||b.need-a.need||a.tie-b.tie);
  const holder=court.offices.find(o=>o.unitId===fuId)?.holderId;
  const targets=[f,...counties.map(u=>s.simulation.counties[u.id]!)];
  const committed=targets.reduce((n,t)=>n+t.projects.reduce((v,p)=>{const def=projectDefinition(p),left=1-p.work/p.required;return v+left*def.money+Object.entries(def.materials).reduce((total,[g,amount])=>total+Math.max(0,amount*left-p.materials[g as keyof typeof p.materials])*f.market.prices[g as keyof typeof f.market.prices],0);},0),0);
  const safeCash=safetyCash(ctx,fuId),reliefNeed=counties.reduce((n,u)=>n+u.population*.02875*s.simulation.counties[u.id]!.shortage*3,0);
  const stalled=targets.flatMap(t=>t.projects).find(p=>policy[p.building]!=='forbid'&&p.pausedReason&&['Ngân khố Phủ không đủ','Sàn Phủ thiếu vật tư','Tuyến vận tải thiếu công suất','Thiếu vật tư tại công trường'].some(reason=>p.pausedReason!.startsWith(reason)));
  const globalBlock=!holder?'Khuyết quan Phủ; chờ bổ nhiệm có hiệu lực':stalled?`Công trường hiện có đang đình trệ: ${stalled.pausedReason}; ưu tiên xử lý trước khi mở dự án mới`:f.treasury<=safeCash+committed?'Thiếu bạc sau quỹ vận hành/bảo trì 3 tháng và vốn dự án đang có':f.grainReserve+1e-8<reliefNeed?'Kho công chưa đủ 3 tháng cứu thiếu khẩu phần':'';
  let started=false;
  for(const candidate of candidates){
   if(started&&candidate.priority!=='focus')break;
   const {id,kind}=candidate;let reason='';
   if(globalBlock)reason=globalBlock;
   else if(started)reason='Đã chọn 1 dự án mới trong kỳ; xét lại tháng sau';
   else try{
    const quote=quoteBuilding(s,id,kind,candidate.routeId),def=quote.definition,seat=s.simulation.prefectures[id]?.seatCountyId??id,c=s.simulation.counties[seat]!;
    const path=seat===f.seatCountyId?[]:marketAccess(ctx,seat).path;
    const freight=path.reduce((n,r)=>n+metricsFor(ctx,r).cost,0);
    const materialEntries=Object.entries(def.materials) as [keyof typeof f.market.prices,number][];
    const estimate=def.money+materialEntries.reduce((n,[g,v])=>n+v*(f.market.prices[g]+freight),0);
    const labour=ctx.labour.get(seat)!;
    const projects=c.projects.length+(seat===f.seatCountyId?f.projects.length:0)+1;
    const available=labour.total-labour.military,newConstruction=Math.min(available*.3,400*projects);
    const p=s.simulation.prefecturePolicies[fuId]??s.simulation.zhouPolicies[ctx.units.get(fuId)!.parentId??'']??s.simulation.policy;
    const farmAfter=Math.min(available-newConstruction,labour.total*p.farmShare);
    if(f.treasury-safeCash-committed<estimate)reason='Thiếu bạc sau quỹ vận hành/bảo trì 3 tháng và vốn dự án đang có';
    else if(f.grainReserve+1e-8<reliefNeed)reason='Kho công chưa đủ 3 tháng cứu thiếu khẩu phần';
    else if(farmAfter+1e-8<labour.farm&&stock(ctx.units.get(seat)!,'grain')<Math.max(uFood(ctx,seat)*3,householdReserve(ctx,seat,'grain')))reason='Rút lao động có nguy cơ làm thiếu khẩu phần sinh tồn';
    else if(newConstruction<=0)reason='Thiếu lao động thi công';
    else if(seat!==f.seatCountyId&&!path.length)reason='Không có tuyến từ sàn Phủ tới công trường';
    else if(materialEntries.some(([g,v])=>f.market.inventory[g]<v*Math.min(1,newConstruction/def.work)))reason='Sàn Phủ thiếu vật tư cho tháng khởi công';
    else if(path.some(r=>{const booked=s.simulation.shipments.filter(x=>!x.entered&&x.path[x.leg]===r.id).reduce((n,x)=>n+x.amount,0);return metricsFor(ctx,r).capacity-booked<materialEntries.reduce((n,[,v])=>n+v*Math.min(1,newConstruction/def.work),0);}))reason='Tuyến thiếu công suất sau hàng đã xếp';
    else {startBuilding(ctx,id,kind,candidate.routeId);started=true;reason=`Khởi công theo ${candidate.priority==='focus'?'chỉ thị trọng tâm':'ưu tiên và nhu cầu'}; dự toán ${estimate.toFixed(2)} lượng, giữ quỹ an toàn`;}
   }catch(error){reason=error instanceof Error?error.message:'Không đủ điều kiện';}
   court.decisions.push({tick:s.simulation.tick,prefectureId:fuId,targetId:id,building:kind,started:started&&reason.startsWith('Khởi công'),reason,reviewTick:s.simulation.tick+1});
   if(reason.startsWith('Khởi công')||candidate.priority==='focus')ctx.report.notes.push(`${ctx.units.get(fuId)!.name}: ${buildings[kind].name} tại ${ctx.units.get(id)!.name}: ${reason}. Xét lại kỳ ${s.simulation.tick+2}.`);
   if(globalBlock&&candidate.priority!=='focus')break;
   // Enumerating finitely many candidates guarantees every focus directive receives a reason.
  }
 }
}
function uFood(ctx:MonthContext,id:string){return ctx.units.get(id)!.population*.02875;}
