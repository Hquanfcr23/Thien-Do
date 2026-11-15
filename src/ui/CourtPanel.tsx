import {CentralCourtPanel} from './CentralCourtPanel';
import {useGameStore} from '../state/gameStore';
import {CourtRoster} from './CourtRoster';
import {OversightPanel} from './OversightPanel';
import {seatNames} from '../engine/centralCourt';

export function CourtPanel({view='officials'}:{view?:'officials'|'affairs'}){
 const {game,order}=useGameStore();
 if(!game?.court)return <p>Triều đình sẽ được khởi tạo khi mở hồ sơ mới.</p>;
 const court=game.court,orders=game.simulation?.orders??[];
 const pending=orders.map((o,i)=>{const subject=o.kind==='central-appoint'?`${seatNames[o.seat]} → ${game.characters.find(c=>c.id===o.characterId)?.name??'Khuyết chức'}`:o.kind==='appoint'?`${game.administrativeUnits.find(u=>u.id===o.unitId)?.name??o.unitId} → ${game.characters.find(c=>c.id===o.characterId)?.name??'Khuyết chức'}`:o.kind==='central-action'?`${seatNames[o.seat]} trình việc`:o.kind==='inspect'?`Giám sát ${game.administrativeUnits.find(u=>u.id===o.prefectureId)?.name??o.prefectureId}`:o.kind==='resolve-case'?`Xử lý hồ sơ ${o.caseId}`:o.kind==='construction-policy'?`Ưu tiên xây dựng ${game.administrativeUnits.find(u=>u.id===o.unitId)?.name??o.unitId}`:({policy:'Chính sách Châu', 'prefecture-policy':'Chính sách Phủ',fiscal:'Điều hành ngân sách','central-policy':'Chính sách trung ương',build:'Công trình',route:'Tuyến vận tải',grant:'Cấp ngân sách',relief:'Cứu tế',transfer:'Vận chuyển hàng','budget-transfer':'Chuyển ngân sách','reserve-transfer':'Chuyển kho lương','sell-grain':'Bán lương','buy-grain':'Mua lương','withdraw-grain':'Rút lương','pardon':'Lệnh tha','buy-estate':'Mua điền sản'} as Record<string,string>)[o.kind]??'Lệnh điều hành';return <li key={i}>{subject} · {o.kind==='appoint'||o.kind==='central-appoint'?'có hiệu lực sau 1 lượt':'xử lý khi kết thúc tháng'}</li>});
 const orderSummary=<div className="court-orders-summary"><strong>Lệnh đã xếp ({orders.length})</strong>{pending.length?<ul>{pending}</ul>:<p>Chưa có lệnh chờ.</p>}</div>;
 if(view==='affairs')return <section aria-label="Sự vụ triều đình"><CentralCourtPanel mode="affairs"/><OversightPanel game={game} submit={order}/>{orderSummary}</section>;
 return <section aria-label="Điều hành triều đình"><CentralCourtPanel mode="roster"/><h3>Tri châu / Tri phủ</h3><p>Danh sách chức vụ địa phương. Bấm avatar để mở bảng ứng viên và thay đổi bổ nhiệm.</p>
  <p>Cần xử lý: {court.offices.filter(o=>!o.holderId&&!o.pending&&!orders.some(x=>x.kind==='appoint'&&x.unitId===o.unitId&&x.characterId)).length} chức khuyết chưa xếp người · {court.offices.filter(o=>o.pending).length+orders.filter(o=>o.kind==='appoint').length} lệnh bổ nhiệm đang chờ.</p>
  <CourtRoster game={game} scope="local" onAppoint={(unitId,characterId)=>order({kind:'appoint',unitId,characterId})}/>
  {orderSummary}</section>;
}
