import { useRef } from 'react';
import type { AdministrativeUnit,GameState } from '../domain/schema';
import { buildAtlas } from '../engine/mapGeometry';
import { summarizeUnit } from '../engine/administration';
import { useGameStore } from '../state/gameStore';
const terrainNames={plain:'Đồng bằng',hills:'Đồi',mountains:'Núi',riverland:'Sông ngòi'};
const resourceNames:Record<string,string>={wood:'Gỗ',iron:'Sắt',grain:'Ngũ cốc'};
function Branch({game,unit,onSelect}:{game:GameState;unit:AdministrativeUnit;onSelect:(id:string)=>void}){
 const children=game.administrativeUnits.filter(u=>u.parentId===unit.id);
 const button=<button aria-pressed={game.mapView.selectedId===unit.id} onClick={()=>onSelect(unit.id)}>{unit.name} <small>{game.administrativeProfile.levels.find(l=>l.id===unit.levelId)?.name}</small></button>;
 return <li>{children.length?<details open><summary>{unit.name}</summary>{button}<ul>{children.map(child=><Branch key={child.id} game={game} unit={child} onSelect={onSelect}/>)}</ul></details>:button}</li>;
}
export function AdministrationPanel(){
 const {game,selectUnit}=useGameStore();const panelTop=useRef<HTMLElement>(null);if(!game)return null;
 const selected=game.administrativeUnits.find(u=>u.id===game.mapView.selectedId)??game.administrativeUnits.find(u=>u.parentId===null)!;
 const geo=buildAtlas(game).get(selected.id);
 const totals=summarizeUnit(game,selected.id),children=game.administrativeUnits.filter(u=>u.parentId===selected.id);
 const pick=(id:string)=>{selectUnit(id,true);panelTop.current?.scrollIntoView({block:'start'});};
 return <><article ref={panelTop} className="territory-details" aria-label="Thông tin lãnh thổ"><p className="eyebrow">{game.administrativeProfile.levels.find(l=>l.id===selected.levelId)?.name} · {selected.provenance.kind}</p><h3>{selected.name}</h3>{selected.parentId&&<button className="parent-link" onClick={()=>pick(selected.parentId!)}>↑ {game.administrativeUnits.find(u=>u.id===selected.parentId)?.name}</button>}
 {geo&&<p className="gis-reference">Cơ sở GIS: {geo.sourceName}<br/>{geo.coordinates[1].toFixed(3)}° B · {geo.coordinates[0].toFixed(3)}° Đ<br/><small>Ranh giới thật 2017 · Tên triều đình giả tưởng</small></p>}<div className="territory-summary"><div><small>Dân số tổng hợp</small><strong>{totals.population.toLocaleString('vi-VN')}</strong></div><div><small>Ổn định</small><strong>{totals.stability.toFixed(1)}%</strong></div></div><details className="detail-group" open><summary>Lãnh thổ & quyền kiểm soát</summary><dl><div><dt>Dân số tổng hợp</dt><dd>{totals.population.toLocaleString('vi-VN')}</dd></div><div><dt>Số Huyện</dt><dd>{totals.countyCount}</dd></div><div><dt>Địa hình</dt><dd>{terrainNames[selected.terrain]}</dd></div><div><dt>Ổn định theo dân số</dt><dd>{totals.stability.toFixed(1)}/100</dd></div><div><dt>Kiểm soát theo dân số</dt><dd>{totals.control.toFixed(1)}%</dd></div>{Object.entries(totals.controllers).map(([id,pop])=><div key={id}><dt>{id===game.country.id?game.country.name:'Ngoài kiểm soát'}</dt><dd>{pop.toLocaleString('vi-VN')} dân</dd></div>)}</dl></details><details className="detail-group"><summary>Tài nguyên & nhân sự</summary><dl>{Object.entries(totals.resources).map(([id,n])=><div key={id}><dt>{resourceNames[id]??id} (đơn vị hàng)</dt><dd>{n.toLocaleString('vi-VN')}</dd></div>)}<div><dt>Quan phụ trách</dt><dd>{game.characters.find(c=>c.id===selected.governorId)?.name??'Chưa bổ nhiệm'}</dd></div></dl></details>
 {children.length>0&&<div className="direct-children"><h4>Đơn vị trực thuộc</h4>{children.map(u=><button key={u.id} onClick={()=>pick(u.id)}>{u.name} →</button>)}</div>}
 <p className="context-note">Dữ liệu từ Huyện. Ổn định/quyền kiểm soát bình quân theo dân số; khi dân số bằng 0 dùng trung bình Huyện. Chưa thu thuế, bổ nhiệm hoặc xây dựng trong Phase 2.</p></article>
 <details className="detail-group" open><summary>Cây hành chính</summary><ul className="admin-tree" aria-label="Cây hành chính">{game.administrativeUnits.filter(u=>u.parentId===null).map(u=><Branch key={u.id} unit={u} game={game} onSelect={pick}/>)}</ul></details></>;
}



