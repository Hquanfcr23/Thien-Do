import { armyCounty,bound,effectFor,policyFor,type MonthContext } from './economyContext';
export function allocateLabour(ctx:MonthContext){
 const militaryByCounty=new Map<string,number>();
 for(const army of ctx.s.militaryUnits){const u=armyCounty(ctx.s,army.locationId);if(u)militaryByCounty.set(u.id,(militaryByCounty.get(u.id)??0)+army.branches.reduce((n,b)=>n+b.strength,0));}
 for(const [id,c] of Object.entries(ctx.s.simulation.counties)){
  const p=policyFor(ctx,id),u=ctx.units.get(id)!;c.workingAge=Math.floor(u.population*.55);const actual=(militaryByCounty.get(id)??0);
  const military=Math.min(c.workingAge,actual+c.workingAge*p.reserveShare),available=c.workingAge-military;
  const projectCount=c.projects.length+Object.values(ctx.s.simulation.prefectures).filter(f=>f.seatCountyId===id).reduce((n,f)=>n+f.projects.length,0);const construction=projectCount?Math.min(available*.3,400*projectCount):0;
  const farm=Math.min(available-construction,c.workingAge*p.farmShare),industry=Math.min(available-construction-farm,c.workingAge*p.industryShare);
  const commerce=Math.min(available-construction-farm-industry,c.workingAge*.12);c.lastWorkers=farm+industry+commerce;c.lastConstruction=construction;c.lastMilitary=military;c.unemployment=1-(farm+industry+commerce+construction+military)/Math.max(1,c.workingAge);
  ctx.labour.set(id,{farm,industry,construction,military,commerce,total:c.workingAge});
 }
}
export function updatePopulation(ctx:MonthContext){
 const {s}=ctx;
 for(const [id,c] of Object.entries(s.simulation.counties)){
  const u=ctx.units.get(id)!,weather=ctx.weather.get(id)!;
  const births=Math.floor(u.population*.0022*bound(c.livingStandard+.2)*bound(1-policyFor(ctx,id).landTax));
  const deaths=Math.min(u.population,Math.floor(u.population*(.0012+c.shortage*.018+weather.disaster*.002)));
  u.population+=births-deaths;c.lastBirths=births;c.lastDeaths=deaths;c.lastMigration=0;
  c.livingStandard=bound(c.livingStandard*.75+(1-c.shortage)*.25-c.unemployment*.03-policyFor(ctx,id).landTax*.04);
  u.stability=bound(u.stability+(c.livingStandard-.65)*4-c.shortage*8-Math.max(0,policyFor(ctx,id).landTax-.2)*8+effectFor(ctx,id,'fort')*.05,0,100);
  ctx.report.births+=births;ctx.report.deaths+=deaths;
 }
 // Snapshot push/pull: no cascading migration within a month; destination must be connected.
 const moves:{from:string;to:string;amount:number}[]=[],neighbors=new Map<string,string[]>();
 for(const r of s.simulation.routes)if(!r.blocked){if(!neighbors.has(r.from))neighbors.set(r.from,[]);if(!neighbors.has(r.to))neighbors.set(r.to,[]);neighbors.get(r.from)!.push(r.to);neighbors.get(r.to)!.push(r.from);}
 for(const [id,c] of Object.entries(s.simulation.counties)){
  if(c.shortage<.15)continue;const targets=(neighbors.get(id)??[]);
  const target=targets.sort((a,b)=>s.simulation.counties[b]!.livingStandard-s.simulation.counties[a]!.livingStandard||a.localeCompare(b))[0];
  if(target&&s.simulation.counties[target]!.shortage<c.shortage*.5)moves.push({from:id,to:target,amount:Math.floor(ctx.units.get(id)!.population*c.shortage*.008)});
 }
 for(const m of moves){ctx.units.get(m.from)!.population-=m.amount;ctx.units.get(m.to)!.population+=m.amount;s.simulation.counties[m.from]!.lastMigration-=m.amount;s.simulation.counties[m.to]!.lastMigration+=m.amount;ctx.report.migration+=m.amount;}
 for(const [id,c] of Object.entries(s.simulation.counties)){const pop=ctx.units.get(id)!.population;c.households=Math.ceil(pop/5);c.workingAge=Math.floor(pop*.55);c.farmers=Math.floor(pop*.76);c.landowners=Math.floor(pop*.06);c.artisans=pop-c.farmers-c.landowners;}
}
