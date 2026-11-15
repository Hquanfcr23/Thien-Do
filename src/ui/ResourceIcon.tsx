type Resource='silver'|'grain'|'population'|'legitimacy';
export function ResourceIcon({kind}:{kind:Resource}){return <span className={`resource-icon painted-imperial painted-imperial-${kind}`} aria-hidden="true"/>;}
