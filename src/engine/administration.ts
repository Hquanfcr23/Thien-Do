import { buildAtlas,fitShape } from './mapGeometry';
import type { GameState } from '../domain/schema';
import type { Bounds,MapLevel } from '../domain/territory';
export function descendants(state:GameState,id:string):GameState['administrativeUnits']{
 const result:GameState['administrativeUnits']=[],queue=[id],seen=new Set<string>();
 while(queue.length){const next=queue.shift()!;if(seen.has(next))throw new Error('Vòng lặp hành chính.');seen.add(next);const unit=state.administrativeUnits.find(u=>u.id===next);if(!unit)throw new Error('Không tìm thấy đơn vị.');result.push(unit);queue.push(...state.administrativeUnits.filter(u=>u.parentId===next).map(u=>u.id));}return result;
}
export function summarizeUnit(state:GameState,id:string){
 const unit=state.administrativeUnits.find(u=>u.id===id);if(!unit)throw new Error('Không tìm thấy đơn vị.');
 const leaves=descendants(state,id).filter(u=>u.levelId===state.administrativeProfile.levels.at(-1)?.id);
 const population=leaves.reduce((s,u)=>s+u.population,0),resources:Record<string,number>={},controllers:Record<string,number>={};let stability=0,control=0,weight=0;
 for(const leaf of leaves){const w=population>0?leaf.population:1;weight+=w;stability+=leaf.stability*w;control+=leaf.control*w;controllers[leaf.controllerId]=(controllers[leaf.controllerId]??0)+leaf.population;for(const [key,value]of Object.entries(leaf.resources))resources[key]=(resources[key]??0)+value;}
 return {population,resources,stability:weight?stability/weight:unit.stability,control:weight?control/weight:unit.control,controllers,countyCount:leaves.length};
}
export function project(x:number,y:number):[number,number]{return[350+x*540+y*35,200+y*340+x*20+x*y*25];}
export function center(b:Bounds):[number,number]{return project(b.x+b.w/2,b.y+b.h/2);}
export function polygon(b:Bounds):string{return[project(b.x,b.y),project(b.x+b.w,b.y),project(b.x+b.w,b.y+b.h),project(b.x,b.y+b.h)].map(p=>p.join(',')).join(' ');}
export function selectTerritory(state:GameState,id:string,focus=false):GameState{
 const unit=state.administrativeUnits.find(u=>u.id===id);if(!unit)throw new Error('Không tìm thấy đơn vị.');const view={...state.mapView,selectedId:id};
 if(focus&&unit.bounds){view.level=unit.levelId as MapLevel;const shape=buildAtlas(state).get(id);if(shape){const fit=fitShape(shape.shape,700,550);view.zoom=fit.zoom;view.x=fit.x-170;view.y=fit.y;}}return{...state,mapView:view};
}


