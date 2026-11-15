import { initializeCourt } from './courtFoundation';
import { initializeEconomy } from './economyFoundation';
import { gameStateSchema,type GameState } from '../domain/schema';
import { initialMapView } from '../domain/territory';
import { createLegacyGame } from './legacyFoundation';
import { fictional,territoryData } from './territories';
export function createNewGame(seed=1701):GameState{
 const old=createLegacyGame(seed),data=territoryData('capital',old.country.id);
 // Preserve the old scenario's public silver per resident (12,000 / 527,250).
 // The new-game endowment alone changes; loaded saves keep their recorded purses.
 old.country.treasury=38000;
 const administrativeProfile={id:'fictional-default',levels:[{id:'central',name:'Trung ương',officeTitle:'Hoàng đế'},{id:'zhou',name:'Châu',officeTitle:'Tri châu'},{id:'fu',name:'Phủ',officeTitle:'Tri phủ'},{id:'xian',name:'Huyện',officeTitle:'Tri huyện'}]};
 return initializeCourt(initializeEconomy(gameStateSchema.parse({...old,campaignVersion:'0.2.0',currency:'silver-tael',administrativeProfile,mapView:{...initialMapView},geography:data.geography,administrativeUnits:[{...old.administrativeUnits[0],terrain:'plain',controllerId:old.country.id,control:100,provenance:fictional,bounds:null},...data.units]}),true));
}

