import type { GameState } from '../domain/schema';
import type { Order } from '../domain/economy';
import type { MonthContext } from './economyContext';
import { bound } from './economyContext';
import { countyOfficial } from '../data/courtFoundation';
import {centralScore} from './centralCourt';

export function remember(s:GameState,from:string,to:string,cause:string,delta:number,type:'colleague'|'patron'|'rival'|'grudge'='colleague'){
 const court=s.court;if(!court||from===to)return;
 let r=court.relations.find(r=>r.from===from&&r.to===to);
 if(!r){r={from,to,type,trust:50,memories:[]};court.relations.push(r);}
 if(type==='grudge')r.type=type;
 r.trust=bound(r.trust+delta,0,100);r.memories.push({tick:s.simulation?.tick??0,cause,delta,lasting:type==='grudge'});r.memories=r.memories.slice(-50);
}
export function applyAppointment(ctx:MonthContext,order:Order){
 if(order.kind!=='appoint')return;
 const {s}=ctx,court=s.court;if(!court)throw Error('Chưa khởi tạo triều đình');
 const office=court.offices.find(o=>o.unitId===order.unitId);if(!office)throw Error('Chỉ bổ nhiệm Châu/Phủ');
 if(office.pending)throw Error('Chức vụ đang chuyển giao');
 if(order.characterId!==null){const c=s.characters.find(c=>c.id===order.characterId);if(!c||!court.officers[c.id]||c.health<=0||court.officers[c.id]!.status!=='free')throw Error('Ứng viên không hợp lệ');if(office.holderId===c.id)throw Error('Quan đã giữ chức này');
 if(court.offices.some(o=>o.pending?.characterId===c.id))throw Error('Ứng viên đang chuyển giao');}
 office.pending={characterId:order.characterId,effectiveTick:s.simulation.tick+1};
 ctx.report.notes.push(`${ctx.units.get(office.unitId)!.name}: chuyển giao có hiệu lực kỳ sau.`);
}
export function beginCourt(ctx:MonthContext){
 const {s}=ctx,court=s.court;if(!court)return;
 for(const office of court.offices){const pending=office.pending;if(!pending||pending.effectiveTick>s.simulation.tick)continue;
  if(pending.characterId&&(court.officers[pending.characterId]?.status!=='free'||(s.characters.find(c=>c.id===pending.characterId)?.health??0)<=0)){office.pending=null;ctx.report.notes.push(`${office.unitId}: hủy chuyển giao vì ứng viên không còn đủ tư cách.`);continue;}
  const previous=office.holderId;
  // A transfer vacates the previous full-time post at the same instant.
  if(pending.characterId)for(const source of court.offices)if(source!==office&&source.holderId===pending.characterId){source.holderId=null;ctx.units.get(source.unitId)!.governorId=null;source.history.push({tick:s.simulation.tick,event:`Điều chuyển đến ${office.unitId}`});}
  if(pending.characterId)for(const source of court.centralOffices??[])if(source.holderId===pending.characterId)source.holderId=null;
  office.holderId=pending.characterId;office.since=s.simulation.tick;office.pending=null;ctx.units.get(office.unitId)!.governorId=office.holderId;
  if(previous)remember(s,previous,s.dynasty.emperorId,`Rời chức ${office.unitId}`,-8,'rival');
  if(office.holderId)remember(s,office.holderId,s.dynasty.emperorId,`Bổ nhiệm ${office.unitId}`,5,'patron');
  const event=`${ctx.units.get(office.unitId)!.name}: ${office.holderId?s.characters.find(c=>c.id===office.holderId)!.name:'khuyết chức'} nhận trách nhiệm.`;office.history.push({tick:s.simulation.tick,event});ctx.report.notes.push(event);
 }
 for(const office of court.offices)office.history=office.history.slice(-100);
}
export function governance(s:GameState,fuId:string){
 const court=s.court,fu=s.administrativeUnits.find(u=>u.id===fuId);if(!court||!fu)return 1;
 const person=s.characters.find(c=>c.id===court.offices.find(o=>o.unitId===fuId)?.holderId),boss=s.characters.find(c=>c.id===court.offices.find(o=>o.unitId===fu.parentId)?.holderId);
 if(!person)return .5;
 const o=court.officers[person.id]!;
 const trust=court.relations.find(r=>r.from===person.id&&r.to===(boss?.id??s.dynasty.emperorId))?.trust??50;
 const backing=court.factions.find(f=>f.members.includes(person.id))?.support??50;
 // All terms are rates, not extra resources. A vacancy and poor health reduce delivery.
 const chief=court.centralOffices?.find(o=>o.seat==='chief');const coordination=chief?.lastAction!==null&&chief?.lastAction!==undefined&&s.simulation&&s.simulation.tick-chief.lastAction<3?.06*centralScore(s,'chief')/100:0;
 return bound(.65+.35*(.3*person.ability+.2*o.finance+.15*o.communication+.1*(boss?.ability??0)+.1*person.health+.075*person.loyalty+.05*trust+.025*backing)/100+coordination);
}
export function finishCourt(ctx:MonthContext){
 const {s}=ctx,court=s.court;if(!court)return;
 const aged=new Set<string>();
 for(const office of court.offices){if(!office.holderId)continue;const holder=s.characters.find(c=>c.id===office.holderId)!;
  if(s.calendar.month===12){aged.add(holder.id);holder.age++;holder.health=bound(holder.health-Math.max(0,(holder.age-50)/20),0,100);}
  if(holder.health<=0){office.holderId=null;ctx.units.get(office.unitId)!.governorId=null;office.history.push({tick:s.simulation.tick,event:'Qua đời; chức vụ khuyết.'});ctx.report.notes.push(`${ctx.units.get(office.unitId)!.name}: quan qua đời, cần bổ nhiệm.`);}
  if(ctx.units.get(office.unitId)?.levelId==='fu'){
   const boss=court.offices.find(o=>o.unitId===ctx.units.get(office.unitId)?.parentId)?.holderId??s.dynasty.emperorId;
   const f=s.simulation.prefectures[office.unitId]!;
   if(f.accounts.administration>0)remember(s,holder.id,boss,`Phối hợp công vụ ${office.unitId}, chi hành chính ${f.accounts.administration.toFixed(2)} lượng`,.1*(court.officers[holder.id]!.communication/100),'colleague');
  }
 }
 if(s.calendar.month===12){
  const holders=new Set(court.offices.flatMap(o=>o.holderId?[o.holderId]:[]));
  for(const c of s.characters.filter(c=>court.officers[c.id]&&!holders.has(c.id)&&!aged.has(c.id))){c.age++;c.health=bound(c.health-Math.max(0,(c.age-50)/20),0,100);}
  for(const [id,c]of Object.entries(court.countyOfficials)){c.age++;if(c.age>=c.retirementAge){court.countyOfficials[id]=countyOfficial(s.seed,id,s.calendar.year+1,c.generation+1);ctx.report.notes.push(`${ctx.units.get(id)!.name}: thay Tri huyện mãn nhiệm.`);}}
 }
 for(const [id,o]of Object.entries(court.officers))if((s.characters.find(c=>c.id===id)?.health??0)<=0){o.status='dead';for(const office of court.offices)if(office.pending?.characterId===id)office.pending=null;}
 for(const r of court.relations){if(r.type==='kinship'||r.memories.some(m=>m.lasting)||r.memories.at(-1)?.tick===s.simulation.tick)continue;r.trust+=Math.sign(50-r.trust)*Math.min(.1,Math.abs(50-r.trust));}
 for(const faction of court.factions){
  const held=court.offices.filter(o=>o.holderId&&faction.members.includes(o.holderId)),fus=held.filter(o=>s.simulation.prefectures[o.unitId]);
  const people=faction.members.map(id=>s.characters.find(c=>c.id===id)!);
  const ambition=people.reduce((n,c)=>n+c.ambition,0)/Math.max(1,people.length);
  const prestige=people.reduce((n,c)=>n+c.prestige,0)/Math.max(1,people.length);
  const centralHeld=(court.centralOffices??[]).filter(o=>o.holderId&&faction.members.includes(o.holderId)).length;
  const representation=(held.length+centralHeld)/Math.max(1,faction.members.length);
  let outcome=0,reason='';
  if(faction.interest==='finance'){outcome=fus.reduce((n,o)=>{const f=s.simulation.prefectures[o.unitId]!;return n+(f.accounts.tax+f.accounts.sales-f.accounts.administration-f.accounts.maintenance-f.accounts.construction-f.accounts.freight>=0?1:-1);},0)/Math.max(1,fus.length);reason='Thu thực nhận so với chi công tại Phủ do thành viên cai quản';}
  if(faction.interest==='welfare'){const counties=s.administrativeUnits.filter(u=>fus.some(o=>o.unitId===u.parentId));outcome=counties.reduce((n,u)=>n+(s.simulation.counties[u.id]!.shortage<.1?1:-1),0)/Math.max(1,counties.length);reason='Khẩu phần thực tế tại các Huyện do thành viên phụ trách';}
  if(faction.interest==='local'){outcome=representation*2-1;reason='Tỷ lệ thành viên được giao chức vụ địa phương';}
  const expectation=ambition/100*(1-representation);
  faction.support=bound(faction.support+outcome*.5*(.5+prestige/200)-expectation*.25,0,100);faction.lastReason=`${reason}; tham vọng chưa được đáp ứng ${(expectation*100).toFixed(0)}%. Ủng hộ ảnh hưởng tỷ lệ thi hành kỳ sau.`;
 }
}
