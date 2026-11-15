import type { GameState } from '../domain/schema';
import type { Order } from '../domain/economy';
import { advanceMonth } from './month';
import { remember } from './court';
import { seatNames } from './centralCourt';

function applyAppointmentOrders(state:GameState):GameState {
  const court=state.court,simulation=state.simulation;
  if(!court||!simulation)return state;
  const next=structuredClone(state),c=next.court!,sim=next.simulation!,messages:string[]=[],assignedThisTurn=new Set<string>();
  const orders=sim.orders.filter((order):order is Extract<Order,{kind:'appoint'|'central-appoint'}>=>order.kind==='appoint'||order.kind==='central-appoint');
  const dueLocal=c.offices.some(office=>office.pending&&office.pending.effectiveTick<=sim.tick),dueCentral=(c.centralOffices??[]).some(office=>office.pending&&office.pending.effectiveTick<=sim.tick);
  if(!orders.length&&!dueLocal&&!dueCentral)return state;
  const person=(id:string)=>next.characters.find(character=>character.id===id);
  for(const order of orders){
    sim.orders=sim.orders.filter(item=>item!==order);
    if(order.kind==='appoint'){
      const office=c.offices.find(item=>item.unitId===order.unitId);
      if(!office||office.pending){messages.push('Lệnh bổ nhiệm bị từ chối: chức vụ không tồn tại hoặc đang chuyển giao.');continue;}
      const candidate=order.characterId?person(order.characterId):undefined;
      if(order.characterId&&(!candidate||!c.officers[order.characterId]||c.officers[order.characterId]!.status!=='free'||candidate.health<=0||office.holderId===order.characterId||assignedThisTurn.has(order.characterId)||c.offices.some(item=>item.pending?.characterId===order.characterId)||c.centralOffices?.some(item=>item.pending?.characterId===order.characterId))){messages.push('Lệnh bổ nhiệm bị từ chối: ứng viên không hợp lệ hoặc đã có lệnh chuyển giao.');continue;}
      const previous=office.holderId;
      if(order.characterId){
        for(const source of c.offices)if(source!==office&&source.holderId===order.characterId){source.holderId=null;const unit=next.administrativeUnits.find(item=>item.id===source.unitId);if(unit)unit.governorId=null;source.history.push({tick:sim.tick,event:`Điều chuyển đến ${order.unitId}`});}
        for(const source of c.centralOffices??[])if(source.holderId===order.characterId)source.holderId=null;
      }
      office.holderId=order.characterId;office.since=sim.tick;office.pending=null;
      if(order.characterId)assignedThisTurn.add(order.characterId);
      const unit=next.administrativeUnits.find(item=>item.id===office.unitId);if(unit)unit.governorId=office.holderId;
      if(previous)remember(next,previous,next.dynasty.emperorId,`Rời chức ${office.unitId}`,-8,'rival');
      if(order.characterId)remember(next,order.characterId,next.dynasty.emperorId,`Bổ nhiệm ${office.unitId}`,5,'patron');
      const name=unit?.name??office.unitId;messages.push(`${name}: ${candidate?.name??'chức vụ khuyết'} nhận trách nhiệm.`);
    }else{
      const office=c.centralOffices?.find(item=>item.seat===order.seat);
      if(!office||office.pending){messages.push('Lệnh bổ nhiệm bị từ chối: chức vụ không tồn tại hoặc đang chuyển giao.');continue;}
      const candidate=order.characterId?person(order.characterId):undefined;
      if(order.characterId&&(!candidate||!c.officers[order.characterId]||c.officers[order.characterId]!.status!=='free'||candidate.health<=0||office.holderId===order.characterId||assignedThisTurn.has(order.characterId)||c.offices.some(item=>item.pending?.characterId===order.characterId)||c.centralOffices?.some(item=>item.pending?.characterId===order.characterId))){messages.push('Lệnh bổ nhiệm bị từ chối: ứng viên không hợp lệ hoặc đã có lệnh chuyển giao.');continue;}
      if(order.characterId){
        for(const source of c.offices)if(source.holderId===order.characterId){source.holderId=null;const unit=next.administrativeUnits.find(item=>item.id===source.unitId);if(unit)unit.governorId=null;source.history.push({tick:sim.tick,event:`Điều chuyển vào triều đình trung ương`});}
        for(const source of c.centralOffices??[])if(source!==office&&source.holderId===order.characterId)source.holderId=null;
      }
      const previous=office.holderId;
      office.holderId=order.characterId;office.since=sim.tick;office.pending=null;office.lastAction=null;delete office.lastTarget;delete office.lastBuilding;
      if(previous&&previous!==order.characterId)remember(next,previous,next.dynasty.emperorId,`Rời chức ${seatNames[office.seat]}`,-8,'rival');
      if(order.characterId&&previous!==order.characterId)remember(next,order.characterId,next.dynasty.emperorId,`Bổ nhiệm ${seatNames[office.seat]}`,5,'patron');
      if(order.characterId)assignedThisTurn.add(order.characterId);
      messages.push(`${order.seat}: ${candidate?.name??'chức vụ khuyết'} nhận trách nhiệm.`);
    }
  }
  for(const office of c.offices){
    const pending=office.pending;if(!pending||pending.effectiveTick>sim.tick)continue;
    const id=pending.characterId,candidate=id?person(id):undefined;
    if(id&&(!candidate||c.officers[id]?.status!=='free'||candidate.health<=0||assignedThisTurn.has(id))){office.pending=null;messages.push('Hủy chuyển giao: ứng viên không còn đủ tư cách hoặc đã nhận chức khác.');continue;}
    const previous=office.holderId;
    if(id){for(const source of c.offices)if(source!==office&&source.holderId===id){source.holderId=null;const unit=next.administrativeUnits.find(item=>item.id===source.unitId);if(unit)unit.governorId=null;}for(const source of c.centralOffices??[])if(source.holderId===id)source.holderId=null;assignedThisTurn.add(id);}
    office.holderId=id;office.since=sim.tick;office.pending=null;const unit=next.administrativeUnits.find(item=>item.id===office.unitId);if(unit)unit.governorId=id;
    if(previous)remember(next,previous,next.dynasty.emperorId,`Rời chức ${office.unitId}`,-8,'rival');if(id)remember(next,id,next.dynasty.emperorId,`Bổ nhiệm ${office.unitId}`,5,'patron');
    messages.push(`${unit?.name??office.unitId}: ${candidate?.name??'chức vụ khuyết'} nhận trách nhiệm.`);
  }
  for(const office of c.centralOffices??[]){
    const pending=office.pending;if(!pending||pending.effectiveTick>sim.tick)continue;
    const id=pending.characterId,candidate=id?person(id):undefined;
    if(id&&(!candidate||c.officers[id]?.status!=='free'||candidate.health<=0||assignedThisTurn.has(id))){office.pending=null;messages.push('Hủy chuyển giao: ứng viên không còn đủ tư cách hoặc đã nhận chức khác.');continue;}
    if(id){for(const source of c.offices)if(source.holderId===id){source.holderId=null;const unit=next.administrativeUnits.find(item=>item.id===source.unitId);if(unit)unit.governorId=null;}for(const source of c.centralOffices??[])if(source!==office&&source.holderId===id)source.holderId=null;assignedThisTurn.add(id);}
    const previous=office.holderId;
    office.holderId=id;office.since=sim.tick;office.pending=null;office.lastAction=null;delete office.lastTarget;delete office.lastBuilding;
    if(previous&&previous!==id)remember(next,previous,next.dynasty.emperorId,`Rời chức ${seatNames[office.seat]}`,-8,'rival');
    if(id&&previous!==id)remember(next,id,next.dynasty.emperorId,`Bổ nhiệm ${seatNames[office.seat]}`,5,'patron');
    messages.push(`${office.seat}: ${candidate?.name??'chức vụ khuyết'} nhận trách nhiệm.`);
  }
  if(!messages.length)return state;
  next.history.push({date:{...next.calendar},message:`Bổ nhiệm sau một lượt: ${messages.join(' ')}`});
  next.history=next.history.slice(-500);
  return next;
}

/** Two order windows per month; physical and financial flows settle once. */
export function advanceDecisionTurn(state: GameState): GameState {
  const appointed=applyAppointmentOrders(state);
  if (state.decisionTurn === 'early') return { ...appointed, decisionTurn: 'mid' };
  return { ...advanceMonth(appointed), decisionTurn: 'early' };
}
