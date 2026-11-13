import { gameStateSchema,type GameState } from '../domain/schema';
import { initialMapView } from '../domain/territory';
import { createLegacyGame } from './legacyFoundation';
import { fictional,territoryData } from './territories';
export function createNewGame(seed=1701):GameState{
 const old=createLegacyGame(seed),data=territoryData('capital',old.country.id);
 return gameStateSchema.parse({...old,campaignVersion:'0.2.0',currency:'silver-tael',mapView:{...initialMapView},geography:data.geography,administrativeUnits:[{...old.administrativeUnits[0],terrain:'plain',controllerId:old.country.id,control:100,provenance:fictional,bounds:null},...data.units]});
}
