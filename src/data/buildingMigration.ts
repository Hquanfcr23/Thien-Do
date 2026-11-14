import type {GameState} from '../domain/schema';

/** Additive v6 migration: retains every asset, level, project, cargo and paid fraction. */
export function migrateBuildingRules(input:GameState,newGame=false):GameState{
 if(!input.simulation||input.simulation.buildingRules)return input;
 const state=structuredClone(input),sim=state.simulation!;
 if(!newGame){
  for(const target of [...Object.values(sim.counties),...Object.values(sim.prefectures)]){
   for(const building of Object.values(target.buildings))building.legacy=true;
  }
  for(const order of sim.orders)if(order.kind==='build')order.legacy=true;
 }
 sim.buildingRules='core-v1';
 return state;
}
