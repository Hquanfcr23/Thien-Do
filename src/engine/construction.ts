import {quoteBuilding,routeUpkeep} from './buildingRules';
import { constructionPriorities } from './policies';
import {centralScore} from './centralCourt';
import {spendable} from './budget';
import { buildings,upgradeScale,projectDefinition,buildingUpkeep } from '../data/economicConfig';
import { emptyStock,goods,type BuildingKind } from '../domain/economy';
import { metricsFor,bound,effectFor,prefectureOf,prefectureId,marketAccess,type MonthContext } from './economyContext';
export function startBuilding(ctx:MonthContext,id:string,kind:BuildingKind,routeId?:string,legacy=false){
 const f=prefectureOf(ctx,id),target=ctx.s.simulation.counties[id]??ctx.s.simulation.prefectures[id];if(!target)throw Error('Chọn Phủ hoặc Huyện để xây');
 if(f.treasury<=0)throw Error('Thiếu ngân khố Phủ');
 if(legacy){
  const seat=ctx.s.simulation.prefectures[id]?.seatCountyId??id;
  if(['bridge','canal','port'].includes(kind)&&!ctx.s.simulation.routes.some(r=>r.mode==='river'&&(r.from===seat||r.to===seat)))throw Error('Cần tuyến thủy GIS hiện có');
  if((target.buildings[kind]?.level??0)>=5||target.projects.some(p=>p.building===kind))throw Error('Đã đạt giới hạn hoặc đang xây');
  const oldWork:Partial<Record<BuildingKind,number>>={farm:500,irrigation:900,granary:600,mine:700,workshop:800,road:900,administration:800};
  target.projects.push({building:kind,work:0,required:oldWork[kind]??buildings[kind].work,materials:emptyStock(),legacyFunded:false,pausedReason:null});
  return;
 }
 const quote=quoteBuilding(ctx.s,id,kind,routeId);
 target.projects.push({building:kind,work:0,required:quote.definition.work,costScale:upgradeScale(quote.level)*quote.baseScale,...(routeId?{routeId}:{}),materials:emptyStock(),legacyFunded:false,pausedReason:null});
}
export function construction(ctx:MonthContext){
 const targets=[...Object.entries(ctx.s.simulation.counties),...Object.entries(ctx.s.simulation.prefectures)];
 for(const [id,c]of targets){const f=prefectureOf(ctx,id),seat=ctx.s.simulation.prefectures[id]?.seatCountyId??id;
  const priorities=constructionPriorities(ctx.s,prefectureId(ctx,id));
  const projectsAtSeat=ctx.s.simulation.counties[seat]!.projects.filter(p=>priorities[p.building]!=='forbid').length+(ctx.s.simulation.prefectures[id]?.projects.filter(p=>priorities[p.building]!=='forbid').length??0);
  const available=ctx.labour.get(seat)!.construction/Math.max(1,projectsAtSeat);
  for(const p of c.projects){if(priorities[p.building]==='forbid'){p.pausedReason='Đình chỉ theo chính sách cấm; giữ tiến độ và vật tư';continue;}const def=projectDefinition(p),works=ctx.s.court?.centralOffices?.find(o=>o.seat==='works'),fuId=prefectureId(ctx,id),active=works?.holderId&&works.lastAction!==null&&works.lastAction!==undefined&&ctx.s.simulation.tick-works.lastAction<3&&works.lastBuilding===p.building&&(works.lastTarget===fuId||works.lastTarget===ctx.units.get(fuId)?.parentId),efficiency=active?1+.12*centralScore(ctx.s,'works')/100:1,workCapacity=Math.min(p.required-p.work,available*efficiency);
   p.pausedReason=null;if(workCapacity<=0){p.pausedReason='Thiếu lao động';continue;}
   if(p.legacyFunded){p.work+=workCapacity;continue;}
   const path=seat===f.seatCountyId?[]:[...marketAccess(ctx,seat).path].reverse(),metrics=path.map(r=>metricsFor(ctx,r));
   const pending=ctx.s.simulation.shipments.filter(x=>x.purpose==='construction'&&x.projectTargetId===id&&x.building===p.building);
   const shippingCost=metrics.reduce((n,m)=>n+m.cost,0),costPerWork=(def.money+goods.reduce((n,g)=>n+(def.materials[g]??0)*(f.market.prices[g]+shippingCost),0))/p.required;
   // Buy and pay only the work the Phủ can actually fund this month. The normal
   // two-month cash floor remains protected; no debt or materials are invented.
   const requestedWork=Math.min(workCapacity,spendable(ctx,fuId)/Math.max(.001,costPerWork)*.999),fraction=requestedWork/p.required;
   if(requestedWork<=1e-8){p.pausedReason='Ngân khố Phủ không đủ theo giá hiện tại';continue;}
   const missing=emptyStock();for(const g of goods)missing[g]=Math.max(0,(def.materials[g]??0)*fraction-p.materials[g]-pending.filter(x=>x.good===g).reduce((n,x)=>n+x.amount,0));
   const purchase=goods.reduce((n,g)=>n+missing[g]*(f.market.prices[g]+shippingCost),0);
   const canShip=seat===f.seatCountyId||path.length>0&&path.every(r=>{const booked=ctx.s.simulation.shipments.filter(x=>!x.entered&&x.path[x.leg]===r.id).reduce((n,x)=>n+x.amount,0);return goods.reduce((n,g)=>n+missing[g],0)<=metricsFor(ctx,r).capacity-booked;});
   if(goods.some(g=>f.market.inventory[g]+1e-9<missing[g]))p.pausedReason='Sàn Phủ thiếu vật tư';
   else if(spendable(ctx,prefectureId(ctx,id))+1e-9<purchase)p.pausedReason='Ngân khố Phủ không đủ theo giá hiện tại';
   else if(!canShip)p.pausedReason='Tuyến vận tải thiếu công suất hoặc bị cắt';
   else {f.treasury=Math.max(0,f.treasury-purchase);f.market.merchantMoney+=purchase;ctx.report.spending+=purchase;f.accounts.construction+=purchase;
    for(const g of goods){const amount=missing[g];if(amount<=1e-9)continue;f.market.inventory[g]=Math.max(0,f.market.inventory[g]-amount);
     if(seat===f.seatCountyId)p.materials[g]+=amount;
     else ctx.s.simulation.shipments.push({id:ctx.s.simulation.nextId++,from:f.seatCountyId,to:seat,good:g,amount,purpose:'construction',prefectureId:prefectureId(ctx,id),projectTargetId:id,building:p.building,path:path.map(r=>r.id),leg:0,remaining:0,entered:false});
    }
   }
   let work=requestedWork;for(const g of goods)if(def.materials[g])work=Math.min(work,p.materials[g]/def.materials[g]!*p.required);
   work=Math.min(work,spendable(ctx,prefectureId(ctx,id))/Math.max(.001,def.money)*p.required);
   if(work<=1e-8){p.pausedReason??=pending.length?'Chờ vật tư đang vận chuyển':'Thiếu vật tư tại công trường';continue;}
   const wage=def.money*work/p.required;f.treasury-=wage;ctx.s.simulation.counties[seat]!.privateMoney+=wage;ctx.report.spending+=wage;f.accounts.construction+=wage;
   for(const g of goods){const used=(def.materials[g]??0)*work/p.required;p.materials[g]=Math.max(0,p.materials[g]-used);if(g==='grain')ctx.report.consumed+=used;else ctx.report.used[g]+=used;}
   p.work+=work;
  }
  for(const p of c.projects.filter(p=>p.work>=p.required-1e-6&&!ctx.s.simulation.shipments.some(x=>x.purpose==='construction'&&x.projectTargetId===id&&x.building===p.building))){for(const g of goods){const unit=ctx.units.get(seat)!;unit.resources[g]=(unit.resources[g]??0)+p.materials[g];p.materials[g]=0;}if(p.routeId){const route=ctx.s.simulation.routes.find(r=>r.id===p.routeId)!;const level=(route.upgrade?.level??0);route.upgrade={level:level+1,condition:1,ownerId:prefectureId(ctx,id),baseScale:(p.costScale??1)/upgradeScale(level)};}else {const old=c.buildings[p.building];c.buildings[p.building]={level:(old?.level??0)+1,condition:1,...(p.costScale===undefined?{legacy:true}:{})};}ctx.report.notes.push(`Hoàn thành ${buildings[p.building].name} tại ${ctx.units.get(id)!.name}`);}
  c.projects=c.projects.filter(p=>p.work<p.required-1e-6||ctx.s.simulation.shipments.some(x=>x.purpose==='construction'&&x.projectTargetId===id&&x.building===p.building));
  for(const [kind,b]of Object.entries(c.buildings)){const def=buildings[kind as BuildingKind];if(!def)continue;const due=buildingUpkeep(kind as BuildingKind,b),paid=Math.min(spendable(ctx,prefectureId(ctx,id)),due);f.treasury-=paid;f.market.merchantMoney+=paid;b.condition=bound(b.condition+(paid/Math.max(.001,due))*.008-.006);ctx.report.spending+=paid;f.accounts.maintenance+=paid;}
 }
 for(const r of ctx.s.simulation.routes){if(r.upgrade){const f=ctx.s.simulation.prefectures[r.upgrade.ownerId]!,due=routeUpkeep(r),paid=Math.min(spendable(ctx,r.upgrade.ownerId),due);f.treasury-=paid;f.market.merchantMoney+=paid;f.accounts.maintenance+=paid;ctx.report.spending+=paid;r.upgrade.condition=bound(r.upgrade.condition+(due?paid/due:1)*.008-.006);}
 r.quality=bound(r.quality-.001+.001*(effectFor(ctx,r.from,'road')+effectFor(ctx,r.to,'road')), .15,1);}
}
