import type {Route} from '../domain/economy';
import {marketAccess,metricsFor,prefectureId,type MonthContext} from './economyContext';

type RoutingContext=Pick<MonthContext,'s'|'units'|'access'|'routing'|'metrics'>;
export interface PrefectureCorridor {from:string;to:string;path:Route[];months:number;cost:number;loss:number;capacity:number}
const networks=new WeakMap<object,PrefectureCorridor[]>();

/** Derived corridors retain physical route IDs: saves and cargo never need virtual stock. */
export function prefectureCorridors(ctx:RoutingContext):PrefectureCorridor[]{
 const first=Object.values(ctx.s.simulation.prefectures)[0];if(!first)return [];
 marketAccess(ctx,first.seatCountyId);
 const cached=networks.get(ctx.routing!);if(cached)return cached;
 const pairs=new Map<string,PrefectureCorridor>();
 for(const route of ctx.s.simulation.routes){
  if(route.blocked)continue;
  const a=prefectureId(ctx,route.from),b=prefectureId(ctx,route.to);if(a===b)continue;
  const fa=ctx.s.simulation.prefectures[a]!,fb=ctx.s.simulation.prefectures[b]!;
  const left=marketAccess(ctx,route.from).path,right=marketAccess(ctx,route.to).path;
  if(route.from!==fa.seatCountyId&&!left.length||route.to!==fb.seatCountyId&&!right.length)continue;
  const forward=a<b,path=forward?[...left].reverse().concat(route,right):[...right].reverse().concat(route,left);
  const metrics=path.map(r=>metricsFor(ctx,r)),corridor:PrefectureCorridor={from:forward?a:b,to:forward?b:a,path,months:metrics.reduce((n,m)=>n+m.months,0),cost:metrics.reduce((n,m)=>n+m.cost,0),loss:1-metrics.reduce((n,m)=>n*(1-m.loss),1),capacity:Math.min(...metrics.map(m=>m.capacity))};
  const key=[a,b].sort().join('|'),old=pairs.get(key);
  if(!old||corridor.months<old.months||corridor.months===old.months&&corridor.cost<old.cost)pairs.set(key,corridor);
 }
 const result=[...pairs.values()];networks.set(ctx.routing!,result);return result;
}

/** Long-distance routing searches Phủ hubs, with only a local first/last mile. */
export function hubPath(ctx:RoutingContext,from:string,to:string):Route[]{
 if(from===to)return [];
 if(!ctx.s.simulation.counties[from]||!ctx.s.simulation.counties[to])return [];
 const source=prefectureId(ctx,from),dest=prefectureId(ctx,to),a=marketAccess(ctx,from).path,b=marketAccess(ctx,to).path;
 if(from!==ctx.s.simulation.prefectures[source]!.seatCountyId&&!a.length||to!==ctx.s.simulation.prefectures[dest]!.seatCountyId&&!b.length)return [];
 if(source===dest)return [...a,...[...b].reverse()];
 const links=prefectureCorridors(ctx),open=new Set(Object.keys(ctx.s.simulation.prefectures)),dist=new Map([[source,0]]),prev=new Map<string,{at:string;path:Route[]}>();
 while(open.size){let at:string|undefined,best=Infinity;for(const id of open){const d=dist.get(id)??Infinity;if(d<best){at=id;best=d;}}if(!at||at===dest)break;open.delete(at);
  for(const link of links){if(link.from!==at&&link.to!==at)continue;const next=link.from===at?link.to:link.from;if(!open.has(next))continue;const d=best+link.months;if(d<(dist.get(next)??Infinity)){dist.set(next,d);prev.set(next,{at,path:link.from===at?link.path:[...link.path].reverse()});}}
 }
 const middle:Route[][]=[];let at=dest;while(at!==source){const step=prev.get(at);if(!step)return [];middle.unshift(step.path);at=step.at;}
 return [...a,...middle.flat(),...[...b].reverse()];
}
