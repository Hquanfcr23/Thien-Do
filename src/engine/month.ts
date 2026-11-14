import {beginCentralMonth,settleCentral} from './centralFinance';
import { initializeEconomy } from '../data/economyFoundation';
import { type GameState } from '../domain/schema';
import { orderSchema,emptyStock,emptyAccounts,goods,type Order,type Report } from '../domain/economy';
import { nextMonth } from './calendar';
import { allocateLabour,updatePopulation } from './population';
import { produce } from './production';
import { applyFiscalOrder,preparePublicReserves } from './budget';
import { market } from './market';
import { transport,dispatch,findPath,routeMetrics } from './transport';
import { construction,startBuilding } from './construction';
import { finance,supplyMilitary } from './finance';
import { prefectureOf,capitalCounty,random,moneyTotal,grainTotal,goodsTotal,stock,type EconomicState,type MonthContext } from './economyContext';
export function queueOrder(state:GameState,order:Order):GameState{const s=initializeEconomy(state) as EconomicState;const next=structuredClone(s);next.simulation.orders.push(orderSchema.parse(order));return next;}
export function advanceMonth(input:GameState):GameState{
 const initialized=initializeEconomy(input) as EconomicState;
 // Historical reports are immutable. Copy their arrays, not every historical object on every tick.
 const s=structuredClone({...initialized,history:[],simulation:{...initialized.simulation,reports:[],annual:[]}}) as EconomicState,sim=s.simulation;
 s.history=[...initialized.history];sim.reports=[...initialized.simulation.reports];sim.annual=[...initialized.simulation.annual];
 const report:Report={produced:emptyStock(),used:emptyStock(),destroyed:emptyStock(),goodsError:emptyStock(),...s.calendar,population:0,births:0,deaths:0,migration:0,harvest:0,consumed:0,loss:0,tax:0,spending:0,treasury:0,grain:0,shortageCount:0,moneyError:0,grainError:0,notes:[]};
 const ctx:MonthContext={s,units:new Map(s.administrativeUnits.map(u=>[u.id,u])),report,weather:new Map(),labour:new Map()};
 beginCentralMonth(ctx);
 for(const f of Object.values(sim.prefectures))f.accounts=emptyAccounts();
 const moneyBefore=moneyTotal(s),grainBefore=grainTotal(s),goodsBefore=Object.fromEntries(goods.map(g=>[g,goodsTotal(s,g)]));
 for(const order of sim.orders){try{
  const previousCash=s.country.treasury,previousGrain=s.country.grainReserve;
  if(order.kind==='central-policy')sim.central!.policy={...order.policy};
  applyFiscalOrder(ctx,order);
  if(order.kind==='policy'){if(order.zhouId){if(ctx.units.get(order.zhouId)?.levelId!=='zhou')throw Error('Châu không tồn tại');sim.zhouPolicies[order.zhouId]=order.policy;}else{sim.policy=order.policy;for(const u of s.administrativeUnits.filter(u=>u.levelId==='zhou'))sim.zhouPolicies[u.id]={...order.policy};}}
  if(order.kind==='build')startBuilding(ctx,order.countyId,order.building,order.routeId,order.legacy??false);
  if(order.kind==='route'){const r=sim.routes.find(r=>r.id===order.routeId);if(!r)throw Error('Tuyến không tồn tại');r.blocked=order.blocked;}
  if(order.kind==='grant'){const c=prefectureOf(ctx,order.countyId);if(!c||s.country.treasury<order.amount)throw Error('Thiếu ngân khố hoặc sai Huyện');s.country.treasury-=order.amount;c.treasury+=order.amount;c.accounts.transfersIn+=order.amount;}
  if(order.kind==='relief'){
   const source=order.prefectureId?sim.prefectures[order.prefectureId]:undefined;if(order.prefectureId&&!source)throw Error('Phủ không tồn tại');const from=source?.seatCountyId??capitalCounty(s),u=ctx.units.get(from),dest=sim.counties[order.countyId];const path=from===order.countyId?[]:findPath(s,from,order.countyId);const payer=source??s.country,cost=path.reduce((n,r)=>n+routeMetrics(s,r).cost*order.amount,0);
   if(!u||!dest||(source?.grainReserve??s.country.grainReserve)<order.amount||from!==order.countyId&&!path.length||path.some(r=>routeMetrics(s,r).capacity<order.amount)||payer.treasury<cost)throw Error('Không đủ lương công, cước hoặc tuyến vận tải');
   if(source)source.grainReserve-=order.amount;else s.country.grainReserve-=order.amount;u.resources.grain=stock(u,'grain')+order.amount;if(from!==order.countyId)dispatch(ctx,from,order.countyId,'grain',order.amount,path);payer.treasury-=cost;if(source)source.accounts.freight+=cost;sim.counties[from]!.privateMoney+=cost;report.spending+=cost;
  }
  if(order.kind==='transfer'){const path=findPath(s,order.from,order.to),cost=path.reduce((n,r)=>n+routeMetrics(s,r).cost*order.amount,0);if(!path.length||path.some(r=>routeMetrics(s,r).capacity<order.amount)||!sim.counties[order.from]||stock(ctx.units.get(order.from)!,order.good)<order.amount||s.country.treasury<cost)throw Error('Thiếu hàng, tiền hoặc công suất/tuyến khả dụng');if(dispatch(ctx,order.from,order.to,order.good,order.amount,path)){s.country.treasury-=cost;sim.counties[order.from]!.privateMoney+=cost;report.spending+=cost;}}
  const a=sim.central!.accounts;a.silverIn+=Math.max(0,s.country.treasury-previousCash);a.silverOut+=Math.max(0,previousCash-s.country.treasury);a.grainIn+=Math.max(0,s.country.grainReserve-previousGrain);a.grainOut+=Math.max(0,previousGrain-s.country.grainReserve);
 }catch(error){report.notes.push(`Lệnh bị từ chối: ${error instanceof Error?error.message:'Không hợp lệ'}`);}}
 sim.orders=[];
 for(const id of Object.keys(sim.counties)){const roll=random(sim),summer=s.calendar.month>=4&&s.calendar.month<=8;ctx.weather.set(id,{rain:sim.weatherMode==='drought'?.18:.7+roll*.6,disaster:summer&&roll<.035?.5:0});}
 allocateLabour(ctx);produce(ctx);preparePublicReserves(ctx);market(ctx);finance(ctx);transport(ctx);updatePopulation(ctx);supplyMilitary(ctx);construction(ctx);settleCentral(ctx);
 for(const [id,c] of Object.entries(sim.counties)){if(c.shortage>.1)report.notes.push(`${ctx.units.get(id)!.name}: thiếu ${(c.shortage*100).toFixed(0)}% khẩu phần → giảm mức sống, tăng tử vong và di cư.`);if(ctx.weather.get(id)!.rain<.3)report.notes.push(`${ctx.units.get(id)!.name}: hạn hán → sức khỏe vụ ${(c.cropHealth*100).toFixed(0)}%, thu hoạch ${c.lastHarvest.toFixed(1)} thạch lương.`);}
 if(s.country.treasury<1)report.notes.push('Ngân khố cạn: chi trả bị giới hạn theo số dư; không tạo nợ hoặc tiền mới.');
 const physical=[...s.administrativeUnits.map(u=>u.resources),...Object.values(sim.prefectures).flatMap(f=>[f.market.inventory,f.market.publicListings]),...Object.values(sim.counties).flatMap(c=>c.projects.map(p=>p.materials)),...Object.values(sim.prefectures).flatMap(f=>f.projects.map(p=>p.materials))];
 for(const inventory of physical)for(const [good,n]of Object.entries(inventory)){if(!Number.isFinite(n)||n< -1e-8)throw Error(`Tồn kho không hợp lệ: ${good}`);inventory[good as keyof typeof inventory]=Math.max(0,n);}
 for(const c of Object.values(sim.counties)){if(!Number.isFinite(c.privateMoney)||c.privateMoney< -1e-8)throw Error('Bạc tư nhân không hợp lệ');c.privateMoney=Math.max(0,c.privateMoney);}
 for(const f of Object.values(sim.prefectures)){if(!Number.isFinite(f.treasury)||f.treasury< -1e-8||!Number.isFinite(f.market.merchantMoney)||f.market.merchantMoney< -1e-8)throw Error('Bạc Phủ không hợp lệ');f.treasury=Math.max(0,f.treasury);f.market.merchantMoney=Math.max(0,f.market.merchantMoney);}
 report.population=s.administrativeUnits.reduce((n,u)=>n+u.population,0);report.treasury=s.country.treasury;report.grain=grainTotal(s);report.shortageCount=Object.values(sim.counties).filter(c=>c.shortage>.1).length;
 report.moneyError=moneyTotal(s)-moneyBefore;report.grainError=grainTotal(s)-(grainBefore+report.harvest-report.consumed-report.loss);
 if(Math.abs(report.moneyError)>1e-5||Math.abs(report.grainError)>1e-5)throw Error('Sai lệch sổ bảo toàn tiền/lương thực');
 report.produced.grain=report.harvest;report.used.grain=report.consumed;report.destroyed.grain=report.loss;
 for(const g of goods){report.goodsError[g]=Math.abs(goodsTotal(s,g)-(goodsBefore[g]!+report.produced[g]-report.used[g]-report.destroyed[g]));if(report.goodsError[g]>1e-5)throw Error(`Sai lệch sổ hàng ${g}`);}
 sim.reports.push(report);sim.reports=sim.reports.slice(-240);sim.lastMessages=report.notes;
 if(s.calendar.month===12){const year=sim.reports.filter(r=>r.year===s.calendar.year);const totalStock=(key:'produced'|'used'|'destroyed')=>Object.fromEntries(goods.map(g=>[g,year.reduce((n,r)=>n+r[key][g],0)])) as typeof report.produced;sim.annual.push({...report,produced:totalStock('produced'),used:totalStock('used'),destroyed:totalStock('destroyed'),births:year.reduce((n,r)=>n+r.births,0),deaths:year.reduce((n,r)=>n+r.deaths,0),migration:year.reduce((n,r)=>n+r.migration,0),harvest:year.reduce((n,r)=>n+r.harvest,0),consumed:year.reduce((n,r)=>n+r.consumed,0),loss:year.reduce((n,r)=>n+r.loss,0),tax:year.reduce((n,r)=>n+r.tax,0),spending:year.reduce((n,r)=>n+r.spending,0),notes:[`Tổng kết ${year.length} tháng năm ${s.calendar.year}`]});sim.annual=sim.annual.slice(-100);}
 sim.tick++;s.history.push({date:{...s.calendar},message:`Dân số ${report.population}; thu ${report.tax.toFixed(1)} lượng; ${report.shortageCount} Huyện thiếu lương. ${report.notes.slice(0,3).join('; ')}${report.notes.length>3?` … ${report.notes.length} ghi chú trong báo cáo`:''}`});s.history=s.history.slice(-500);s.calendar=nextMonth(s.calendar);s.decisionTurn='early';
 return s;
}

