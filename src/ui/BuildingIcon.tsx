import type {BuildingKind} from '../domain/economy';
export function BuildingIcon({kind}:{kind:BuildingKind}){return <span className={`building-emblem painted-building painted-building-${kind}`} aria-hidden="true"><span className="painted-building-image"/></span>;}
