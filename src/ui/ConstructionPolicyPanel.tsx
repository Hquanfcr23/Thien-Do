import { economicText } from '../domain/economicUnits';
import { useState } from 'react';
import type { GameState } from '../domain/schema';
import type { Order } from '../domain/economy';
import { prioritySchema,type Priority } from '../domain/court';
import { coreBuildingKinds,buildings } from '../data/economicConfig';
import { constructionPriorities } from '../engine/autonomousConstruction';
import { BuildingIcon } from './BuildingIcon';

const labels:Record<Priority,string>={forbid:'Cấm',low:'Thấp',normal:'Bình thường',high:'Cao',focus:'Chỉ thị trọng tâm'};
export function ConstructionPolicyPanel({game,unitId,submit}:{game:GameState;unitId:string;submit:(o:Order)=>void}){
 const unit=game.administrativeUnits.find(u=>u.id===unitId)!;
 const id=unit.levelId==='xian'?unit.parentId!:unitId;
 const current=constructionPriorities(game,id),[draft,setDraft]=useState<Record<string,Priority>>(current);
 if(!['zhou','fu','xian'].includes(unit.levelId))return <p>Chọn Châu hoặc Phủ để đặt ưu tiên xây dựng.</p>;
 const scope=game.administrativeUnits.find(u=>u.id===id)!;
 const own=game.court?.constructionPolicies[id];
 const fus=game.administrativeUnits.filter(u=>u.parentId===id&&u.levelId==='fu');
 const signature=(p:Record<string,Priority>)=>coreBuildingKinds.map(k=>p[k]??'normal').join(':');
 const mixed=fus.some(f=>signature(constructionPriorities(game,f.id))!==signature(constructionPriorities(game,fus[0]!.id)));
 return <section aria-label="Ưu tiên xây dựng"><h3>Ưu tiên tại {scope.name}</h3><p>{scope.levelId==='fu'?(own?'Phủ dùng ưu tiên riêng':'Phủ kế thừa ưu tiên Châu'):mixed?'Tùy chỉnh — các Phủ có ưu tiên hiệu lực khác nhau':'Mặc định Châu cho Phủ kế thừa'}. Tri phủ chọn tối đa một dự án mới mỗi tháng, giữ quỹ vận hành/bảo trì và cứu thiếu khẩu phần 3 tháng.</p>
 {coreBuildingKinds.map(k=><label className="setting-row construction-priority-row" key={k}><BuildingIcon kind={k}/><span className="construction-priority-name">{buildings[k].name}<small>Ưu tiên xây dựng</small></span><select aria-label={`Ưu tiên ${buildings[k].name}`} value={draft[k]??'normal'} onChange={e=>setDraft({...draft,[k]:prioritySchema.parse(e.target.value)})}>{prioritySchema.options.map(p=><option value={p} key={p}>{labels[p]}</option>)}</select></label>)}
 <button onClick={()=>submit({kind:'construction-policy',unitId:id,priorities:draft})}>Xếp ưu tiên xây dựng</button>{scope.levelId==='fu'&&<button onClick={()=>submit({kind:'construction-policy',unitId:id,priorities:null})}>Kế thừa ưu tiên Châu</button>}
 <p>Cấm sẽ đình chỉ mua vật tư và thi công cùng loại, giữ tiến độ/vật tư; bỏ cấm thì tiếp tục. Công trình đã hoàn thành vẫn cần bảo trì. Chỉ thị trọng tâm vẫn phải đủ bạc, vật tư, lao động, tuyến và dự trữ an toàn.</p>
 {game.court?.decisions.filter(d=>d.prefectureId===id||fus.some(f=>f.id===d.prefectureId)).map((d,i)=><p key={i}>{game.administrativeUnits.find(u=>u.id===d.targetId)?.name} · {buildings[d.building as keyof typeof buildings]?.name}: {economicText(d.reason)}. Xét lại kỳ {d.reviewTick+1}.</p>)}</section>;
}
