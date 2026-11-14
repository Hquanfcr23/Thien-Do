import {moneyNumber,grainNumber,silverAmount,grainAmount,canonicalOrder} from '../domain/economicUnits';
import {centralGranaryProfile} from '../data/economicConfig';
import {useState} from 'react';
import {centralPolicySchema,defaultCentral,type Order} from '../domain/economy';
import type {GameState} from '../domain/schema';
export function CentralBudget({game,submit}:{game:GameState;submit:(order:Order)=>void}){
 const central=game.simulation?.central??defaultCentral(),[draft,setDraft]=useState({...central.policy,aidSilverLimit:silverAmount(central.policy.aidSilverLimit),cashFloor:silverAmount(central.policy.cashFloor),aidGrainLimit:grainAmount(central.policy.aidGrainLimit),grainFloor:grainAmount(central.policy.grainFloor)}),a=central.accounts;

 return <details open className="central-budget"><summary>Ngân sách triều đình</summary><dl><div><dt>Ngân khố trung ương</dt><dd>{moneyNumber(game.country.treasury)} lượng</dd></div><div><dt>Kho lương trung ương</dt><dd>{grainNumber(game.country.grainReserve)} thạch lương</dd></div><div><dt>Bạc nhập / xuất tháng qua</dt><dd>{moneyNumber(a.silverIn)} / {moneyNumber(a.silverOut)}</dd></div><div><dt>Lương nhập / xuất tháng qua</dt><dd>{grainNumber(a.grainIn)} / {grainNumber(a.grainOut)}</dd></div><div><dt>Hao lương / chi bảo quản</dt><dd>{grainNumber(a.grainLoss)} thạch lương / {moneyNumber(a.storageCost)} lượng</dd></div><div><dt>Nộp bạc dự kiến / chưa đủ</dt><dd>{moneyNumber(a.remitDue)} / {moneyNumber(a.remitUnpaid)} lượng</dd></div></dl>
 <fieldset><legend>Chính sách thu và điều phối trung ương</legend>
 {([{key:'cashRemitRate',label:'Thu bạc Phủ nộp về (%)',rate:true},{key:'grainRemitRate',label:'Lương dư vận về kinh (%)',rate:true},{key:'aidSilverLimit',label:'Hạn mức hỗ trợ bạc mỗi tháng',rate:false},{key:'aidGrainLimit',label:'Hạn mức cứu đói mỗi tháng (thạch lương)',rate:false},{key:'cashFloor',label:'Bạc trung ương giữ lại (lượng)',rate:false},{key:'grainFloor',label:'Lương trung ương giữ lại (thạch lương)',rate:false}] as const).map(({key,label,rate})=><label key={key}>{label}<input aria-label={label} type="number" min="0" {...(rate?{max:100}:{})} value={Number.isNaN(draft[key])?'':draft[key]*(rate?100:1)} onChange={e=>setDraft({...draft,[key]:e.target.valueAsNumber/(rate?100:1)})}/></label>)}
 <button disabled={!centralPolicySchema.safeParse(draft).success} onClick={()=>submit(canonicalOrder({kind:'central-policy',policy:draft}))}>Ban chính sách trung ương</button>
 <p>Bạc nộp từ thu nhập thực, bảo vệ quỹ vận hành Phủ. Lương dư nộp một lần trong mùa thu hoạch của vùng, phải có đường và bạc cước. Kho kinh chứa {grainNumber(centralGranaryProfile.capacity)} thạch lương trước khi chịu hao hụt quá tải.</p><p>Hạn mức hỗ trợ là tổng cho toàn quốc mỗi tháng; đặt 0 để tắt. Ưu tiên Phủ thiếu quỹ và Huyện thiếu ăn; hỗ trợ lương tới dân qua vận tải. Mức giữ lại chỉ bảo vệ các lệnh tự động. Chính sách áp dụng khi quyết toán cuối tháng.</p>
 </fieldset></details>;
}

