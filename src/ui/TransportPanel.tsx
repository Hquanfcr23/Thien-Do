import type {GameState} from '../domain/schema';
import type {Order,Route} from '../domain/economy';
import {prefectureCorridors} from '../engine/prefectureTransport';
import {type EconomicState} from '../engine/economyContext';
import {moneyNumber,quantityNumber} from '../domain/economicUnits';
import {goodsConfig} from '../data/economicConfig';

export function TransportPanel({game,scope,submit}:{game:GameState;scope:Set<string>;submit:(order:Order)=>void}){
 const sim=game.simulation!;
 const units=new Map(game.administrativeUnits.map(u=>[u.id,u])),name=(id:string)=>units.get(id)?.name??id;
 const owner=(id:string)=>units.get(id)!.parentId!,selected=game.mapView.selectedId,county=selected&&sim.counties[selected]?units.get(selected):undefined;
 const visible=new Set([...scope].map(id=>sim.prefectures[id]?id:owner(id)));
 const links=prefectureCorridors({s:game as EconomicState,units});
 const pairs=new Map<string,{from:string;to:string;gates:Route[]}>();
 for(const r of sim.routes){const a=owner(r.from),b=owner(r.to);if(a===b||!visible.has(a)&&!visible.has(b))continue;const [from,to]=[a,b].sort() as [string,string],key=from+'|'+to;const pair=pairs.get(key)??{from,to,gates:[]};pair.gates.push(r);pairs.set(key,pair);}
 const local=sim.routes.filter(r=>owner(r.from)===owner(r.to)&&(scope.has(r.from)||scope.has(r.to)));
 const shipments=sim.shipments.filter(x=>visible.has(owner(x.from))||visible.has(owner(x.to)));
 const count=(n:number)=>n.toLocaleString('vi-VN',{maximumFractionDigits:1});
 return <section aria-label="Vận tải Phủ"><h3>Vận tải liên Phủ</h3>
 <p>Hàng đường dài đi qua đầu mối Phủ. Huyện thu gom và nhận hàng qua đường nội Phủ; hàng chỉ sử dụng được khi tới đích.</p>
 <div className="market-summary"><div><small>Hành lang đang thông</small><strong>{[...pairs.values()].filter(p=>links.some(l=>l.from===p.from&&l.to===p.to)).length} / {pairs.size}</strong></div><div><small>Lô hàng trong phạm vi</small><strong>{shipments.length}</strong></div></div>
 {[...pairs.values()].map(pair=>{const link=links.find(l=>l.from===pair.from&&l.to===pair.to);return <details key={pair.from+'|'+pair.to}><summary>{name(pair.from)} ↔ {name(pair.to)}</summary>
 {link?<p>{moneyNumber(link.cost)} lượng / tải chuẩn · ít nhất {link.months} tháng di chuyển · công suất nút thắt {count(link.capacity)} tải chuẩn/tháng. Chưa gồm thời gian chờ và bàn giao giữa các chặng.</p>:<p>Chưa có đường thông giữa hai trị sở. Kiểm tra cửa ngõ và đường nội Phủ.</p>}
 <p>Giao thương tự động dùng hàng trên sàn và bạc thương nhân; không lấy hàng dự trữ tư nhân hoặc kho công để bán thay.</p>
 {pair.gates.map(r=><div key={r.id}><p>{name(r.from)} ↔ {name(r.to)} · {r.mode==='river'?'đường thủy':'đường bộ'} · {r.blocked?'Đang đóng':'Đang mở'}</p><button onClick={()=>submit({kind:'route',routeId:r.id,blocked:!r.blocked})}>{r.blocked?'Mở cửa ngõ':'Đóng cửa ngõ'}</button></div>)}</details>;})}
 {!pairs.size&&<p>Phạm vi này chưa có cửa ngõ liên Phủ trên bản đồ.</p>}
 <details><summary>Đường thu gom và phân phối nội Phủ ({local.length})</summary><p>Cước, thời gian và công suất trên các đoạn này vẫn giới hạn thuế hiện vật, tiếp hàng sàn và vật tư công trường.</p>{local.map(r=><details key={r.id}><summary>{name(r.from)} ↔ {name(r.to)} · {r.mode==='river'?'Đường thủy':'Đường bộ'}</summary><p>{r.mode==='river'?'Đường thủy':'Đường bộ'} · {count(r.km)} km · công suất tháng trước {count(r.lastCapacity)} tải chuẩn, đã dùng {count(r.used)}.</p><button onClick={()=>submit({kind:'route',routeId:r.id,blocked:!r.blocked})}>{r.blocked?'Mở lại tuyến':'Đóng tuyến'}</button></details>)}</details>
 {county&&<button onClick={()=>submit({kind:'relief',countyId:county.id,prefectureId:county.parentId!,amount:1600})}>Cấp 1.600 thạch lương từ kho Phủ cho {county.name}</button>}
 <h4>Hàng đang vận chuyển</h4><p>{shipments.length} lô hàng đang đi hoặc chờ công suất.</p>
 {shipments.slice(-12).map(x=><p key={x.id}>Lô {x.id} · {x.purpose==='market'?(owner(x.from)===owner(x.to)?'Thu gom lên sàn':'Tiếp hàng liên Phủ'):x.purpose==='tax'?'Thuế hiện vật':x.purpose==='construction'?'Vật tư công trường':x.purpose==='reserve'?'Điều kho công':x.purpose==='relief'?'Cứu trợ':'Phân phối / hàng tư nhân'} · {quantityNumber(x.amount,x.good)} {goodsConfig[x.good].unit} {goodsConfig[x.good].name}<br/>{name(x.from)} → {name(x.to)} · chặng {x.leg+1}/{x.path.length} · {x.entered?`còn ${x.remaining} tháng ở chặng hiện tại`:'chờ tuyến/công suất'}</p>)}
 {!shipments.length&&<p>Chưa có hàng đang vận chuyển trong phạm vi này.</p>}
 <p className="context-note">Quản lý ngân khố và chuyển lương giữa các Phủ tại mục Ngân sách &amp; kho. Đường nội Phủ được tự động sử dụng khi thu gom, phân phối và xây dựng.</p>
 </section>;
}
