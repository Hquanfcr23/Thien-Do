import {Metric} from './Metric';
import { ConstructionPolicyPanel } from './ConstructionPolicyPanel';
import {useState} from 'react';
import type {GameState} from '../domain/schema';
import type {BuildingKind,Order} from '../domain/economy';
import {coreBuildingKinds,buildings,buildingUpkeep,goodsConfig} from '../data/economicConfig';
import {moneyNumber,quantityNumber} from '../domain/economicUnits';
import {quoteBuilding} from '../engine/buildingRules';
import type {EconomicState} from '../engine/economyContext';
import {BuildingIcon} from './BuildingIcon';

const num=(n:number)=>n.toLocaleString('vi-VN',{maximumFractionDigits:1});
export function ConstructionPanel({game,selected,submit}:{game:GameState;selected:string;submit:(order:Order)=>void}){
 const [routeId,setRouteId]=useState('');
 const sim=game.simulation!,target=sim.counties[selected]??sim.prefectures[selected];
 if(!target)return <ConstructionPolicyPanel key={`${selected}:${JSON.stringify(game.court?.constructionPolicies)}`} game={game} unitId={selected} submit={submit}/>;
 const availableKinds:BuildingKind[]=sim.prefectures[selected]?['granary','road']:['farm','irrigation','mine','workshop','road','administration'];
 const seat=sim.prefectures[selected]?.seatCountyId??selected;
 const routes=sim.routes.filter(r=>r.from===seat||r.to===seat);
 const route=routes.find(r=>r.id===routeId)??routes[0];
 const fu=sim.prefectures[selected]??sim.prefectures[game.administrativeUnits.find(u=>u.id===selected)!.parentId!]!;
 const unitName=game.administrativeUnits.find(u=>u.id===selected)?.name??'địa điểm đã chọn';
 const routeName=(id:string)=>{const r=sim.routes.find(r=>r.id===id);return r?`${game.administrativeUnits.find(u=>u.id===r.from)?.name} → ${game.administrativeUnits.find(u=>u.id===r.to)?.name}`:'Tuyến không tồn tại';};
 const card=(kind:BuildingKind)=>{
  let quote:ReturnType<typeof quoteBuilding>|undefined,error='';
  try{quote=quoteBuilding(game as EconomicState,selected,kind,kind==='road'?route?.id:undefined);}catch(e){error=e instanceof Error?e.message:'Không thể xây tại địa điểm này';}
  const def=quote?.definition,materials=def?Object.entries(def.materials):[];
  const cost=def?def.money+materials.reduce((n,[g,amount])=>n+amount*fu.market.prices[g as keyof typeof fu.market.prices],0):0;
  const current=target.buildings[kind];
  const tooltip=quote&&def?`${current?'Nâng cấp':'Xây'} ${buildings[kind].name} · cấp ${quote.level} → ${quote.level+1}\nNhân công: ${moneyNumber(def.money)} lượng\nVật tư: ${materials.map(([g,n])=>`${goodsConfig[g as keyof typeof goodsConfig].name} ${quantityNumber(n,g as keyof typeof goodsConfig)}`).join(', ')}\nDự toán giá sàn: ${moneyNumber(cost)} lượng, chưa gồm cước\nThời gian: ${num(def.work)} công-tháng · bảo trì sau nâng cấp: ${moneyNumber(def.maintenance)} lượng/tháng`:`Không thể nâng cấp: ${error}`;
  return <article className="construction-card" key={kind}>
   <div className="construction-card-top"><BuildingIcon kind={kind}/><div className="construction-title"><h4>{buildings[kind].name}</h4><span>{current?`Cấp ${current.level}${current.level<3?` → ${current.level+1}`:' · tối đa'}`:'Chưa xây · Cấp 0 → 1'}</span></div>
    <span title={tooltip}>{quote?"Tri phủ xét theo ưu tiên":"Chưa đủ điều kiện"}</span>
   </div>
   {kind==='road'&&<div className="construction-route"><label>Tuyến nâng cấp<select aria-label="Tuyến cần nâng cấp" value={route?.id??''} onChange={e=>setRouteId(e.target.value)}>{routes.map(r=><option key={r.id} value={r.id}>{routeName(r.id)} · {r.mode==='river'?'đường thủy':'đường bộ'} · cấp {r.upgrade?.level??0}</option>)}</select></label>{route&&<small>{num(route.km)} km · tình trạng {num((route.upgrade?.condition??1)*100)}%</small>}</div>}
   <p className="construction-effect">{buildings[kind].effect}.</p>
   <ul className="construction-details">{buildings[kind].details.map((detail,i)=><li key={i}>{detail}</li>)}</ul>
   {current&&<p className="construction-current">Đang có: cấp {current.level} · <Metric name="Tình trạng"/> {num(current.condition*100)}% · <Metric name="Bảo trì"/> {moneyNumber(buildingUpkeep(kind,current))} lượng/tháng{current.legacy?' · Công trình kế thừa, giữ tác dụng cũ':''}</p>}
   {error&&<p className="construction-unavailable" role="status">{error}</p>}
  </article>;
 };
 return <section className="construction-panel" aria-label="Xây dựng tại địa điểm">
  <ConstructionPolicyPanel key={`${selected}:${JSON.stringify(game.court?.constructionPolicies)}`} game={game} unitId={selected} submit={submit}/><header className="construction-heading"><div><h3>Công trình tại {unitName}</h3><p>Định mức công trình để tham khảo. Tri phủ chọn dự án; vật tư được mua và vận chuyển theo tháng.</p></div><span className="construction-cap">Tối đa cấp 3</span></header>
  <div className="construction-list">{coreBuildingKinds.filter(k=>availableKinds.includes(k)).map(k=>card(k))}</div>
  {target.projects.length>0&&<section className="construction-projects"><h4>Công trình đang thi công</h4>{target.projects.map((p,i)=><p key={`${p.building}-${p.routeId??''}-${i}`}><strong>{buildings[p.building].name}</strong>{p.routeId?` · ${routeName(p.routeId)}`:''}: {num(p.work)} / {num(p.required)} công-tháng · {p.pausedReason??'Đang thi công'}{p.costScale===undefined?' · Giữ tiến độ và định mức công trình cũ':''}</p>)}</section>}
 </section>;
}
