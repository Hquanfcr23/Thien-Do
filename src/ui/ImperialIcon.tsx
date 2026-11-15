type ImperialIconName='economy'|'country'|'admin'|'construction'|'court'|'docket'|'journal'|'archive';
export function ImperialIcon({name}:{name:ImperialIconName}){return <span className={`imperial-icon painted-imperial painted-imperial-${name}`} aria-hidden="true"/>;}
