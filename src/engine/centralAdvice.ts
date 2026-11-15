import type {GameState} from '../domain/schema';
import type {Seat} from './centralCourt';

export function rankedPrefectures(s:GameState,seat:'revenue'|'censor'){const sim=s.simulation;if(!sim)return[];return Object.entries(sim.prefectures).map(([id,f])=>({id,treasury:f.treasury,shortage:s.administrativeUnits.filter(u=>u.parentId===id).reduce((n,u)=>n+(sim.counties[u.id]?.shortage??0),0),service:f.serviceLevel})).sort((a,b)=>seat==='revenue'?a.treasury-b.treasury||b.shortage-a.shortage||a.id.localeCompare(b.id):b.shortage-a.shortage||a.service-b.service||a.id.localeCompare(b.id)).map(x=>x.id);}

export function centralAdvice(s:GameState,seat:Seat):string[]{const sim=s.simulation,court=s.court;if(!sim||!court)return[];const name=(id:string)=>s.administrativeUnits.find(u=>u.id===id)?.name??id;
 const fus=Object.entries(sim.prefectures).map(([id,f])=>({id,treasury:f.treasury,shortage:s.administrativeUnits.filter(u=>u.parentId===id).reduce((n,u)=>n+(sim.counties[u.id]?.shortage??0),0),service:f.serviceLevel}));
 const urgent=[...fus].sort((a,b)=>b.shortage-a.shortage||a.treasury-b.treasury||a.id.localeCompare(b.id));
 if(seat==='chief')return urgent.slice(0,2).map(f=>`${name(f.id)}: ${f.shortage>0?'thiếu khẩu phần tại Huyện trực thuộc':'chưa ghi nhận thiếu khẩu phần ở các Huyện trực thuộc'}; quỹ Phủ ${f.treasury.toFixed(1)} lượng, chi hành chính đáp ứng ${(f.service*100).toFixed(1)}% định mức tháng.`);
 if(seat==='personnel'){const held=new Set([...court.offices.map(o=>o.holderId),...(court.centralOffices??[]).map(o=>o.holderId)]),candidates=s.characters.filter(c=>court.officers[c.id]?.status==='free'&&!held.has(c.id)).sort((a,b)=>(b.ability+b.prestige)-(a.ability+a.prestige));return candidates.slice(0,3).map(c=>`${c.name}: quản trị ${c.ability}, uy tín ${c.prestige}, tài chính ${court.officers[c.id]!.finance}.`);}
 if(seat==='revenue')return [...fus].sort((a,b)=>a.treasury-b.treasury||b.shortage-a.shortage).slice(0,3).map(f=>`${name(f.id)}: quỹ ${f.treasury.toFixed(1)} lượng, tổng phần thiếu khẩu phần ${f.shortage.toFixed(2)} (cộng các Huyện).`);
 if(seat==='rites')return [`${Object.values(sim.counties).filter(c=>c.shortage>.1).length} Huyện đang thiếu trên 10% khẩu phần. Nghi lễ chỉ được tổ chức khi không còn Huyện ở mức này.`,`Chính thống hiện ${s.dynasty.legitimacy.toFixed(1)}/100; tác động ổn định mỗi Huyện ${(s.dynasty.legitimacy-70)*.01>=0?'+':''}${((s.dynasty.legitimacy-70)*.01).toFixed(2)} điểm/tháng.`];
 if(seat==='war')return s.militaryUnits.length?s.militaryUnits.map(a=>`${a.id}: sĩ khí ${a.morale.toFixed(1)}, tiếp tế ${a.supply.status}.`).slice(0,3):['Chưa có đơn vị quân trong hồ sơ này; chưa thể xếp kiểm tra hậu cần.'];
 if(seat==='justice')return court.cases.filter(c=>c.status==='concluded'&&c.reviewDue===undefined).slice(0,3).map(c=>`${c.id}: kết luận về ${s.characters.find(p=>p.id===c.subjectId)?.name}, mức chứng cứ hồ sơ ${c.evidence}/100.`);
 if(seat==='works')return court.decisions.filter(d=>!d.started).slice(-3).reverse().map(d=>`${name(d.targetId)} · ${d.building}: ${d.reason}.`);
 return urgent.slice(0,3).map(f=>`${name(f.id)}: chi hành chính đáp ứng ${(f.service*100).toFixed(1)}% định mức tháng, tổng phần thiếu khẩu phần ${f.shortage.toFixed(2)} (cộng các Huyện); đây là căn cứ chọn nơi giám sát, chưa là chứng cứ kết tội.`);
}
