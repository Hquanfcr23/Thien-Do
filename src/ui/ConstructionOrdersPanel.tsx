import {useMemo,useState} from 'react';
import type {GameState} from '../domain/schema';
import type {BuildingKind,CountyEconomy,Order} from '../domain/economy';
import {buildings,goodsConfig} from '../data/economicConfig';
import {quantityNumber} from '../domain/economicUnits';
import {BuildingIcon} from './BuildingIcon';

type FilterStatus='all'|'queued'|'working'|'paused';
type Project=CountyEconomy['projects'][number];
type ConstructionRow={key:string;id:string;building:BuildingKind;routeId:string|undefined;unit:string;zhouId:string;fuId:string;queued:boolean;project:Project|undefined;legacy:boolean};
export function ConstructionOrdersPanel({game,focus}:{game:GameState;focus:(id:string)=>void}){
 const [zhouId,setZhouId]=useState('all'),[fuId,setFuId]=useState('all'),[countyId,setCountyId]=useState('all');
 const [status,setStatus]=useState<FilterStatus>('all'),[kind,setKind]=useState<'all'|BuildingKind>('all'),[search,setSearch]=useState('');
 const sim=game.simulation!;
 const units=game.administrativeUnits;
 const zhou=units.filter(u=>u.levelId==='zhou');
 const prefectures=units.filter(u=>u.levelId==='fu'&&(zhouId==='all'||u.parentId===zhouId));
 const counties=units.filter(u=>u.levelId==='xian'&&(fuId==='all'||u.parentId===fuId)&&(zhouId==='all'||units.find(f=>f.id===u.parentId)?.parentId===zhouId));
 const names=useMemo(()=>new Map(units.map(u=>[u.id,u.name])),[units]);
 const routeName=(id:string)=>{const r=sim.routes.find(x=>x.id===id);return r?`${names.get(r.from)??r.from} → ${names.get(r.to)??r.to}`:'';};
 const context=(id:string)=>{const unit=units.find(u=>u.id===id),fu=unit?.levelId==='fu'?unit:units.find(u=>u.id===unit?.parentId);return {unit:names.get(id)??id,fuId:fu?.id??'',zhouId:fu?.parentId??''};};
 const active:ConstructionRow[]=Object.entries(sim.prefectures).flatMap(([id,value])=>value.projects.map((project,index)=>{const c=context(id);return {key:`project-${id}-${project.building}-${project.routeId??''}-${index}`,id,building:project.building,routeId:project.routeId,unit:c.unit,fuId:c.fuId,zhouId:c.zhouId,queued:false,project,legacy:project.legacyFunded};}));
 active.push(...Object.entries(sim.counties).flatMap(([id,value])=>value.projects.map((project,index)=>{const c=context(id);return {key:`project-${id}-${project.building}-${project.routeId??''}-${index}`,id,building:project.building,routeId:project.routeId,unit:c.unit,fuId:c.fuId,zhouId:c.zhouId,queued:false,project,legacy:project.legacyFunded};})));
 const queued:ConstructionRow[]=sim.orders.flatMap((order:Order,index)=>order.kind==='build'?(()=>{const c=context(order.countyId);return [{key:`queued-${index}-${order.countyId}-${order.building}-${order.routeId??''}`,id:order.countyId,building:order.building,routeId:order.routeId,unit:c.unit,fuId:c.fuId,zhouId:c.zhouId,queued:true,project:undefined,legacy:order.legacy??false}];})():[]);
 const rows=[...queued,...active];
 const filtered=rows.filter(row=>{
  if(zhouId!=='all'&&row.zhouId!==zhouId)return false;
  if(fuId!=='all'&&row.fuId!==fuId)return false;
  if(countyId!=='all'&&row.id!==countyId)return false;
  if(status==='queued'&&!row.queued)return false;
  if(status==='working'&&(row.queued||row.project?.pausedReason))return false;
  if(status==='paused'&&(row.queued||!row.project?.pausedReason))return false;
  if(kind!=='all'&&row.building!==kind)return false;
  const q=search.trim().toLocaleLowerCase('vi');
  return !q||`${row.unit} ${buildings[row.building].name} ${row.routeId?routeName(row.routeId):''}`.toLocaleLowerCase('vi').includes(q);
 });
 const queuedCount=rows.filter(r=>r.queued).length;
 const working=rows.filter(r=>!r.queued&&!r.project?.pausedReason).length;
 const paused=rows.filter(r=>!r.queued&&r.project?.pausedReason).length;
 return <section className="construction-orders" aria-label="Quản lý xây dựng">
  <header className="construction-orders-heading"><div><p className="eyebrow">CÔNG TRÌNH & CÔNG TRƯỜNG</p><h3>Xây dựng</h3><p>Theo dõi lệnh vừa xếp và tiến độ thi công theo địa bàn.</p></div></header>
  <div className="construction-overview" aria-label="Tổng quan công trường"><div><small>Tổng lệnh & công trường</small><strong>{rows.length}</strong></div><div><small>Chờ khởi công</small><strong>{queuedCount}</strong></div><div><small>Đang thi công</small><strong>{working}</strong></div><div><small>Đình trệ</small><strong>{paused}</strong></div></div>
  <section className="construction-filters" aria-label="Lọc công trường">
   <label>Châu<select aria-label="Lọc theo Châu" value={zhouId} onChange={e=>{setZhouId(e.target.value);setFuId('all');setCountyId('all');}}><option value="all">Tất cả Châu</option>{zhou.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
   <label>Phủ<select aria-label="Lọc theo Phủ" value={fuId} onChange={e=>{setFuId(e.target.value);setCountyId('all');}}><option value="all">Tất cả Phủ</option>{prefectures.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
   <label>Huyện<select aria-label="Lọc theo Huyện" value={countyId} onChange={e=>setCountyId(e.target.value)}><option value="all">Tất cả Huyện</option>{counties.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
   <label>Trạng thái<select aria-label="Lọc theo trạng thái" value={status} onChange={e=>setStatus(e.target.value as FilterStatus)}><option value="all">Tất cả trạng thái</option><option value="queued">Chờ khởi công</option><option value="working">Đang thi công</option><option value="paused">Đình trệ</option></select></label>
   <label>Loại công trình<select aria-label="Lọc theo loại công trình" value={kind} onChange={e=>setKind(e.target.value as 'all'|BuildingKind)}><option value="all">Tất cả loại</option>{Object.entries(buildings).map(([k,b])=><option key={k} value={k}>{b.name}</option>)}</select></label>
   <label className="construction-search">Tìm đơn vị / tuyến<input aria-label="Tìm công trường" type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nhập tên Huyện, Phủ hoặc tuyến"/></label>
  </section>
  <div className="construction-results-heading"><h4>Lệnh xây dựng & công trường</h4><span>{filtered.length} kết quả</span></div>
  {filtered.length===0?<div className="construction-empty"><span aria-hidden="true">營</span><p>{rows.length?'Không có công trường phù hợp bộ lọc.':'Chưa có lệnh xây dựng đang thi công.'}</p><small>Chọn một Phủ hoặc Huyện, rồi xếp lệnh trong mục Xây dựng của Kinh tế.</small></div>:<div className="construction-order-list">{filtered.map(row=>{
   const {id,project,building,routeId,unit,queued,legacy}=row;
   const progress=project?Math.max(0,Math.min(100,project.work/project.required*100)):0;
   const stalled=Boolean(project?.pausedReason);
   const site=sim.counties[id]??sim.prefectures[id];
   const level=routeId?sim.routes.find(r=>r.id===routeId)?.upgrade?.level??0:site?.buildings[building]?.level??0;
   const state=queued?'queued':stalled?'paused':'working';
   return <article className={`construction-order-card ${state==='paused'?'is-paused':''}`} key={row.key}>
    <header><BuildingIcon kind={building}/><div><h5>{buildings[building].name}{routeId?' · nâng cấp tuyến':''}</h5><p>{unit}{routeId?` · ${routeName(routeId)}`:''}</p></div><span className={`construction-status ${state}`}>{queued?'Chờ khởi công':stalled?'Đình trệ':'Đang thi công'}</span></header>
    {queued?<p className="construction-queued-note">Đã nhận lệnh. Công trường sẽ khởi tạo khi quyết toán cuối tháng.</p>:<><div className="construction-progress-label"><span>Cấp {level} → {level+1}</span><span>{num(project!.work)} / {num(project!.required)} công-tháng · {num(progress)}%</span></div><progress max="100" value={progress} aria-label={`Tiến độ ${buildings[building].name} tại ${unit}`}/></>}
    {stalled&&<p className="construction-pause-reason"><strong>Lý do:</strong> {project?.pausedReason}</p>}
    {legacy&&<small className="construction-legacy-note">Lệnh từ hồ sơ cũ; định mức và tiến độ được giữ nguyên.</small>}
    {project&&<footer><span>Vật tư tại công trường: {Object.entries(project.materials).filter(([,amount])=>amount>0).map(([good,amount])=>`${goodsConfig[good as keyof typeof goodsConfig].name} ${quantityNumber(amount,good as keyof typeof goodsConfig)}`).join(' · ')||'Đã dùng hết'}</span><button onClick={()=>focus(id)}>Chọn trên bản đồ</button></footer>}
    {queued&&<footer><span>Chờ xử lý khi kết thúc lượt giữa tháng.</span><button onClick={()=>focus(id)}>Chọn trên bản đồ</button></footer>}
   </article>;
  })}</div>}
 </section>;
}
const num=(n:number)=>n.toLocaleString('vi-VN',{maximumFractionDigits:1});
