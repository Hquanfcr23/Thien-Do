import type { GameState } from '../domain/schema';
import type { Simulation } from '../domain/economy';

export function constructionPriorities(s:GameState,unitId:string){const unit=s.administrativeUnits.find(u=>u.id===unitId),court=s.court;return court?.constructionPolicies[unitId]??court?.constructionPolicies[unit?.parentId??'']??{};}

export function effectivePolicy(state:GameState,prefectureId:string):Simulation['policy']{
 const sim=state.simulation;if(!sim)throw Error('Chưa khởi tạo kinh tế');
 const fu=state.administrativeUnits.find(u=>u.id===prefectureId&&u.levelId==='fu');
 if(!fu)throw Error('Phủ không tồn tại');
 return sim.prefecturePolicies[prefectureId]??sim.zhouPolicies[fu.parentId??'']??sim.policy;
}
export function zhouPolicyStatus(state:GameState,zhouId:string){
 const sim=state.simulation;if(!sim)throw Error('Chưa khởi tạo kinh tế');
 const policies=state.administrativeUnits.filter(u=>u.parentId===zhouId&&u.levelId==='fu').map(u=>effectivePolicy(state,u.id));
 const same=(a:Simulation['policy'],b:Simulation['policy'])=>(Object.keys(a) as (keyof typeof a)[]).every(k=>a[k]===b[k]);
 return {defaultPolicy:sim.zhouPolicies[zhouId]??sim.policy,mixed:policies.some(p=>!same(p,policies[0]!))};
}
