import {buildingPackage,buildingUpkeep,buildings,upkeepScale,coreBuildingKinds} from '../data/economicConfig';
import type {BuildingKind,Route} from '../domain/economy';
import type {EconomicState} from './economyContext';

export function routeBuildScale(s:EconomicState,route:Route){
 const terrains=s.administrativeUnits.filter(u=>u.id===route.from||u.id===route.to).map(u=>u.terrain);
 const terrain=terrains.includes('mountains')?1.75:terrains.includes('hills')?1.25:1;
 return route.km/100*terrain;
}
export function routeUpkeep(route:Route){return route.upgrade?buildings.road.maintenance*upkeepScale(route.upgrade.level)*route.upgrade.baseScale:0;}
export function quoteBuilding(s:EconomicState,id:string,kind:BuildingKind,routeId?:string){
 const target=s.simulation.counties[id]??s.simulation.prefectures[id];
 if(!target)throw Error('Chọn một Phủ hoặc Huyện để xây');
 if(!coreBuildingKinds.some(k=>k===kind))throw Error('Công trình cũ được giữ nguyên, không xây mới từ danh sách chính');
 const isFu=!!s.simulation.prefectures[id];
 if(kind==='granary'&&!isFu)throw Error('Kho công chỉ xây ở Phủ');
 if(['farm','irrigation','mine','workshop','administration'].includes(kind)&&isFu)throw Error('Công trình này chỉ xây tại Huyện');
 const route=kind==='road'?s.simulation.routes.find(r=>r.id===routeId):undefined;
 if(kind==='road'){
  if(!route)throw Error('Chọn tuyến giao thông cần nâng cấp');
  const seat=s.simulation.prefectures[id]?.seatCountyId??id;
  if(route.from!==seat&&route.to!==seat)throw Error('Chọn tuyến nối trực tiếp với Huyện hoặc trị sở đang quản lý');
  if(route.blocked)throw Error('Mở lại tuyến trước khi nâng cấp');
  if([...Object.values(s.simulation.counties),...Object.values(s.simulation.prefectures)].some(c=>c.projects.some(p=>p.routeId===routeId)))throw Error('Tuyến đã có công trường đang thi công');
 }
 const level=route?.upgrade?.level??(kind==='road'?0:target.buildings[kind]?.level??0);
 if(level>=3)throw Error('Đã đạt giới hạn 3 cấp; công trình cũ cấp cao hơn vẫn được giữ');
 if(target.projects.some(p=>p.building===kind))throw Error('Địa điểm đã có công trình cùng loại đang thi công');
 const baseScale=route?routeBuildScale(s,route):1;
 return {level,baseScale,definition:buildingPackage(kind,level,baseScale)};
}
export function targetUpkeep(target:{buildings:EconomicState['simulation']['counties'][string]['buildings']}){
 return Object.entries(target.buildings).reduce((n,[kind,b])=>n+buildingUpkeep(kind as BuildingKind,b),0);
}
