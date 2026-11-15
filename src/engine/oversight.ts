import { economicUnits } from '../domain/economicUnits';
import type { Order } from '../domain/economy';
import type { MonthContext } from './economyContext';
import { bound } from './economyContext';
import { courtHash } from '../data/courtFoundation';
import { safetyCash } from './autonomousConstruction';
import { remember } from './court';

const sentenceNames={recover:'truy thu',dismiss:'bãi nhiệm',imprison:'giam giữ',exile:'lưu đày',execute:'tử hình'};
function vacate(ctx:MonthContext,id:string,cause:string){for(const o of ctx.s.court!.offices){
 if(o.pending?.characterId===id)o.pending=null;
 if(o.holderId===id){o.holderId=null;o.pending=null;ctx.units.get(o.unitId)!.governorId=null;o.history.push({tick:ctx.s.simulation.tick,event:cause});}
}for(const o of ctx.s.court!.centralOffices??[]){if(o.pending?.characterId===id)o.pending=null;if(o.holderId===id){o.holderId=null;o.pending=null;ctx.report.notes.push(`${o.seat}: ${cause}`);}}}
export function applyOversightOrder(ctx:MonthContext,order:Order){
 const {s}=ctx,court=s.court;if(!court)return;
 if(order.kind==='buy-estate'){
  const o=court.officers[order.characterId],c=s.simulation.counties[order.countyId];if(!o||o.status!=='free'||!c||o.privateMoney+o.assets<order.amount)throw Error('Thiếu gia sản hợp pháp hoặc không đủ tư cách');
  const legitimate=Math.min(o.privateMoney,order.amount);o.privateMoney-=legitimate;o.assets-=order.amount-legitimate;c.privateMoney+=order.amount;court.estates.push({id:`estate:${court.nextId++}`,characterId:order.characterId,countyId:order.countyId,value:order.amount,confiscatedBy:null});
  ctx.report.notes.push(`Mua điền sản: chuyển ${order.amount.toFixed(2)} lượng từ gia sản quan sang dân ${ctx.units.get(order.countyId)!.name}; quyền sở hữu lưu trong hồ sơ, không thêm đất sản xuất.`);
 }
 if(order.kind==='pardon'){
  const o=court.officers[order.characterId];if(!o||!['imprisoned','exiled'].includes(o.status))throw Error('Chỉ tha người đang giam/lưu đày');o.status='free';remember(s,order.characterId,s.dynasty.emperorId,'Được tha, không tự hoàn chức',10,'patron');
 }
 if(order.kind==='inspect'){
  const f=s.simulation.prefectures[order.prefectureId],current=court.offices.find(o=>o.unitId===order.prefectureId)?.holderId,subject=order.subjectId??current,investigator=court.officers[order.investigatorId];
  if(subject&&subject!==current&&!Object.hasOwn(court.officers[subject]?.unassessed??{},order.prefectureId))throw Error('Quan chưa có công vụ tại Phủ này');
  if(!f||!subject||!investigator||investigator.status!=='free'||s.characters.find(c=>c.id===order.investigatorId)!.health<=0||order.investigatorId===subject)throw Error('Sai đối tượng/điều tra viên hoặc tự điều tra');
  if(court.cases.some(c=>c.subjectId===subject&&c.status!=='closed'&&!(c.status==='suspected'&&order.mode==='investigation')))throw Error('Có vụ việc chưa xử lý cho quan này');
  const cost=(order.mode==='audit'?20:60)/economicUnits.silver;if(f.treasury-cost<safetyCash(ctx,order.prefectureId))throw Error('Chi giám sát vi phạm quỹ an toàn 3 tháng');
  f.treasury-=cost;s.simulation.counties[f.seatCountyId]!.privateMoney+=cost;f.accounts.administration+=cost;ctx.report.spending+=cost;
  if(order.mode==='investigation')for(const c of court.cases)if(c.subjectId===subject&&c.status==='suspected'){c.status='closed';c.outcome='Chuyển sang điều tra có thời hạn 3 tháng';}
  court.cases.push({id:`case:${court.nextId++}`,prefectureId:order.prefectureId,subjectId:subject,investigatorId:order.investigatorId,mode:order.mode,started:s.simulation.tick,due:s.simulation.tick+(order.mode==='audit'?1:3)-1,cost,status:'pending',evidence:0,alleged:false,falseFinding:false,recoverable:court.officers[subject]!.unassessed[order.prefectureId]??0,outcome:'Đang thu thập chứng cứ; chưa có kết luận'});
  remember(s,subject,order.investigatorId,`${order.mode==='audit'?'Thanh tra':'Điều tra'} ${order.prefectureId}`,-3,'rival');
 }
 if(order.kind==='resolve-case'){
  const c=court.cases.find(c=>c.id===order.caseId);if(!c||c.status==='pending'||c.status==='closed')throw Error('Vụ việc chưa có kết quả hoặc đã kết thúc');
  if(order.action==='trial'&&c.status!=='concluded')throw Error('Nghi vấn chưa đủ điều kiện xét xử; cần điều tra');
  const subject=s.characters.find(p=>p.id===c.subjectId)!,o=court.officers[c.subjectId]!;
  if(order.action==='warn'){subject.prestige=bound(subject.prestige-2,0,100);remember(s,subject.id,s.dynasty.emperorId,'Cảnh cáo theo hồ sơ giám sát',-3,'rival');c.outcome='Cảnh cáo, không tự truy thu';}
  if(order.action==='dismiss'){vacate(ctx,subject.id,'Bãi nhiệm sau giám sát');remember(s,subject.id,s.dynasty.emperorId,'Bãi nhiệm sau giám sát',-8,'rival');c.outcome='Bãi nhiệm, không tự truy thu';}
  if(order.action==='trial'){
   if(c.reviewDue!==undefined)throw Error('Bộ Hình đang xét lại hồ sơ; chờ kết quả');
   if(!c.alleged)throw Error('Kết luận không phát hiện sai phạm');
   if(!order.sentence)throw Error('Chọn hình phạt trước khi xét xử');
   if(c.falseFinding){const investigator=s.characters.find(p=>p.id===c.investigatorId)!;investigator.prestige=bound(investigator.prestige-15,0,100);vacate(ctx,investigator.id,'Bãi nhiệm vì án oan/thẩm tra tắc trách');remember(s,subject.id,investigator.id,'Án oan do thẩm tra tắc trách',-30,'grudge');c.outcome='Án oan: không tịch thu; bãi nhiệm điều tra viên, uy tín −15; hoàng đế không bị trừ uy tín';}
   else{
    const due=Math.min(c.recoverable,o.unassessed[c.prefectureId]??0);o.unassessed[c.prefectureId]=Math.max(0,(o.unassessed[c.prefectureId]??0)-due);o.debts[c.prefectureId]=(o.debts[c.prefectureId]??0)+due;
    if(order.sentence!=='recover')vacate(ctx,subject.id,`Thi hành án ${sentenceNames[order.sentence]}`);
    if(order.sentence==='imprison')o.status='imprisoned';if(order.sentence==='exile')o.status='exiled';if(order.sentence==='execute'){o.status='dead';subject.health=0;}
    remember(s,subject.id,c.investigatorId,`Kết án ${sentenceNames[order.sentence]}, truy tang đủ ${due.toFixed(2)} lượng`,-20,'grudge');c.outcome=`Kết án ${sentenceNames[order.sentence]}; nghĩa vụ truy tang 100%: ${due.toFixed(2)} lượng; thiếu giữ nợ, không tạo bạc`;
   }
  }
  if(order.action==='close')c.outcome='Bác/đóng hồ sơ; không thu hồi hay trừng phạt';c.status='closed';ctx.report.notes.push(`Giám sát ${c.id}: ${c.outcome}`);
 }
 court.cases=court.cases.slice(-200);
}
export function finishOversight(ctx:MonthContext){
 const {s}=ctx,court=s.court;if(!court)return;
 for(const c of court.cases){if(c.status!=='pending'||c.due>s.simulation.tick)continue;
  const investigator=s.characters.find(p=>p.id===c.investigatorId)!,o=court.officers[c.investigatorId]!;
  if(o.status!=='free'||investigator.health<=0){c.status='clear';c.outcome='Điều tra viên không còn đủ tư cách; không kết luận sai phạm';continue;}
  const skill=(investigator.ability+o.finance)/200;
  const roll=courtHash(s.seed,`${c.id}:detect`)/4294967296;
  const falseRoll=courtHash(s.seed,`${c.id}:false`)/4294967296;
  c.alleged=c.recoverable>0?(roll<Math.min(.95,.2+.6*skill+(c.mode==='investigation'?.15:0))):falseRoll<.1*(1-skill)*(c.mode==='investigation'?.5:1);
  c.falseFinding=c.alleged&&c.recoverable<=0;c.evidence=c.alleged?(c.mode==='audit'?50:85):0;c.status=c.alleged?(c.mode==='audit'?'suspected':'concluded'):'clear';
  c.outcome=c.alleged?(c.mode==='audit'?'Có nghi vấn, cần điều tra trước khi xét xử':'Kết luận sai phạm từ chứng cứ; có rủi ro thẩm tra sai'):'Không phát hiện sai phạm; không chứng minh người này hoàn toàn trong sạch';ctx.report.notes.push(`Giám sát ${c.id}: ${c.outcome}`);
 }
 recoverDebts(ctx);
}
export function recoverDebts(ctx:MonthContext){
 const court=ctx.s.court;if(!court)return;
 for(const [id,o]of Object.entries(court.officers))for(const [fuId,debt]of Object.entries(o.debts)){
  const f=ctx.s.simulation.prefectures[fuId];if(!f||debt<=1e-8)continue;let outstanding=debt,paid=0;
  for(const purse of ['assets','privateMoney'] as const){const n=Math.min(o[purse],outstanding);o[purse]-=n;outstanding-=n;paid+=n;}
  for(const estate of court.estates.filter(e=>e.characterId===id&&(e.confiscatedBy===null||e.confiscatedBy===fuId))){
   if(outstanding<=1e-8)break;estate.confiscatedBy=fuId;
   const buyer=ctx.s.simulation.counties[estate.countyId]!;
   const protectedCash=buyer.land*.025+20,n=Math.min(estate.value,outstanding,Math.max(0,buyer.privateMoney-protectedCash));
   buyer.privateMoney-=n;estate.value-=n;outstanding-=n;paid+=n;
  }
  court.estates=court.estates.filter(e=>e.value>1e-8);o.debts[fuId]=Math.max(0,outstanding);f.treasury+=paid;f.accounts.transfersIn+=paid;
  if(paid>0)ctx.report.notes.push(`Truy tang ${id}: thu ${paid.toFixed(2)} lượng về ${fuId}, còn phải thu ${outstanding.toFixed(2)} lượng; bán gia sản có người mua trả bạc thật.`);
 }
}
