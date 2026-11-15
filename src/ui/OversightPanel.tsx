import {Metric} from './Metric';
import { useState } from 'react';
import type { GameState } from '../domain/schema';
import type { Order } from '../domain/economy';
import { moneyNumber,economicText } from '../domain/economicUnits';

type Sentence='recover'|'dismiss'|'imprison'|'exile'|'execute';
const sentenceNames:Record<Sentence,string>={recover:'Truy thu',dismiss:'Truy thu & bãi nhiệm',imprison:'Truy thu & giam giữ',exile:'Truy thu & lưu đày',execute:'Truy thu & tử hình'};
const caseNames={pending:'Đang xử lý',clear:'Không phát hiện',suspected:'Nghi vấn',concluded:'Có kết luận',closed:'Đã kết thúc'};
export function OversightPanel({game,submit}:{game:GameState;submit:(o:Order)=>void}){
 const [fuId,setFuId]=useState(''),[subjectId,setSubjectId]=useState(''),[investigator,setInvestigator]=useState(''),[mode,setMode]=useState<'audit'|'investigation'>('audit'),[sentences,setSentences]=useState<Record<string,Sentence>>({});
 const court=game.court!;
 const fu=game.administrativeUnits.find(u=>u.id===fuId&&u.levelId==='fu')??game.administrativeUnits.find(u=>u.levelId==='fu');
 const current=court.offices.find(o=>o.unitId===fu?.id)?.holderId;
 const subjects=Object.keys(court.officers).filter(id=>id===current||Object.hasOwn(court.officers[id]!.unassessed,fu?.id??''));const subject=subjects.includes(subjectId)?subjectId:current;
 const name=(id:string)=>game.characters.find(c=>c.id===id)?.name??id;
 const investigatorPerson=game.characters.find(c=>c.id===investigator),investigatorOfficer=court.officers[investigator],skill=investigatorPerson&&investigatorOfficer?(investigatorPerson.ability+investigatorOfficer.finance)/200:null;
 return <section aria-label="Giám sát"><h3>Giám sát và xét xử</h3><p>Thanh tra: 20 lượng / 1 tháng. Điều tra: 60 lượng / 3 tháng. Chi phí trả dân tại trị sở, giữ quỹ an toàn 3 tháng. Nghi vấn cần điều tra trước khi xét xử; mức chứng cứ không phải xác suất có tội và kết luận có thể sai.</p>
 <label className="setting-row">Phủ giám sát<select aria-label="Phủ giám sát" value={fu?.id??''} onChange={e=>setFuId(e.target.value)}>{game.administrativeUnits.filter(u=>u.levelId==='fu').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
 <label className="setting-row">Quan bị giám sát<select aria-label="Quan bị giám sát" value={subject??''} onChange={e=>setSubjectId(e.target.value)}><option value="">Chọn quan đương nhiệm hoặc từng công vụ</option>{subjects.map(id=><option key={id} value={id}>{name(id)}{id===current?' · đương nhiệm':' · từng giữ chức'}</option>)}</select></label>
 <label className="setting-row">Điều tra viên<select aria-label="Điều tra viên" value={investigator} onChange={e=>setInvestigator(e.target.value)}><option value="">Chọn quan</option>{Object.keys(court.officers).filter(id=>id!==subject&&court.officers[id]!.status==='free'&&game.characters.find(c=>c.id===id)!.health>0).map(id=><option key={id} value={id}>{name(id)}</option>)}</select></label>
 <label className="setting-row">Hình thức<select aria-label="Hình thức giám sát" value={mode} onChange={e=>setMode(e.target.value as typeof mode)}><option value="audit">Thanh tra</option><option value="investigation">Điều tra</option></select></label>
 {skill!==null&&<p className="court-inspection-preview">Theo điều tra viên đã chọn: <Metric name="Khả năng phát hiện">Phát hiện khi có tang vật</Metric> {Math.min(95,(.2+.6*skill+(mode==='investigation'?.15:0))*100).toFixed(1)}%; <Metric name="Nguy cơ nghi oan"/> khi không có tang vật {(.1*(1-skill)*(mode==='investigation'?.5:1)*100).toFixed(1)}%. Đây là xác suất, không phải kết luận về quan bị giám sát.</p>}
 <button disabled={!fu||!investigator||investigator===subject||!subject} onClick={()=>submit({kind:'inspect',prefectureId:fu!.id,...(subject?{subjectId:subject}:{}),investigatorId:investigator,mode})}>Xếp giám sát</button>
 {court.cases.slice().reverse().map(c=><article className="record-entry" key={c.id}><h4>{name(c.subjectId)} · {game.administrativeUnits.find(u=>u.id===c.prefectureId)?.name}</h4><p>Điều tra viên {name(c.investigatorId)} · chi {moneyNumber(c.cost)} lượng · kỳ {c.started+1}–{c.due+1} · {caseNames[c.status]} · <Metric name="Mức chứng cứ"/> {c.evidence}/100</p><p>{economicText(c.outcome)}</p>{c.status!=='pending'&&c.status!=='closed'&&<><button onClick={()=>submit({kind:'resolve-case',caseId:c.id,action:'warn'})}>Cảnh cáo</button><button onClick={()=>submit({kind:'resolve-case',caseId:c.id,action:'dismiss'})}>Bãi nhiệm</button><button onClick={()=>submit({kind:'resolve-case',caseId:c.id,action:'close'})}>Đóng / bác hồ sơ</button>{c.status==='concluded'&&<><label className="setting-row">Hình phạt<select aria-label={`Hình phạt ${c.id}`} value={sentences[c.id]??'recover'} onChange={e=>setSentences({...sentences,[c.id]:e.target.value as Sentence})}>{(Object.keys(sentenceNames) as Sentence[]).map(k=><option value={k} key={k}>{sentenceNames[k]}</option>)}</select></label><button disabled={c.reviewDue!==undefined} onClick={()=>submit({kind:'resolve-case',caseId:c.id,action:'trial',sentence:sentences[c.id]??'recover'})}>Xếp xét xử</button><p>Kết án oan sẽ quy trách nhiệm cho điều tra viên; không tịch thu tài sản của người bị oan.</p>{c.reviewDue!==undefined&&<p>Bộ Hình đang xét lại; chờ kết quả kỳ sau.</p>}</>}</>}</article>)}
 <p>Truy tang đủ 100%: thu ví tang vật, gia sản và bán điền sản có người mua trả bạc; phần thiếu lưu thành nợ. Án oan: quan điều tra bị bãi nhiệm và mất 15 uy tín; không trừ uy tín hoàng đế. Giam/lưu đày kéo dài đến khi được tha; tử hình không thể phục hồi.</p></section>;
}

