import {migrateBuildingRules} from './buildingMigration';
import type { GameState } from '../domain/schema';
import type { GameState as OldState } from '../domain/schemaV4';
import { initializeEconomy as initializeOld } from './legacyEconomyFoundation';
import { upgradeEconomy } from './upgradeEconomy';
export function initializeEconomy(state:GameState,endowment=false):GameState{
 if(state.simulation)return migrateBuildingRules(state);
 const old={...state,administrativeUnits:state.administrativeUnits.map(u=>({...u,treasury:u.treasury??0}))} as unknown as OldState;
 return migrateBuildingRules(upgradeEconomy(initializeOld(old,endowment),endowment),endowment);
}
