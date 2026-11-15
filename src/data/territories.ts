import type { AdministrativeUnit,GameState,Provenance } from '../domain/schema';
import type { Bounds } from '../domain/territory';
export const fictional:Provenance={kind:'Fictional',note:'Địa danh, ranh giới và dữ liệu khởi đầu Đại Ninh do game sáng tạo; không phải địa giới lịch sử.'};
// Fictional starting census: 24 counties, 1,680,000 people (70,000 per county on average).
// County order follows the stable legacy IDs within each prefecture. Mountains are less dense;
// the capital and river settlements are denser. No existing save is rewritten by this table.
const provinceSpecs=[
 {id:'tay-linh',name:'Tây Lĩnh',width:.3,prefectures:['Lâm An','Sơn Bình'],countyPopulations:[[68000,54000,62000,50000,56000],[50000,60000]],terrain:'mountains'},
 {id:'trung-ninh',name:'Trung Ninh',width:.38,prefectures:['Ninh Kinh','Hà Dương','Bình Nguyên'],countyPopulations:[[100000,90000,80000,75000,65000],[75000,65000],[80000,70000,60000]],terrain:'plain'},
 {id:'dong-giang',name:'Đông Giang',width:.32,prefectures:['Giang Khẩu','Đông Hải'],countyPopulations:[[95000,85000,75000,65000,70000],[70000,60000]],terrain:'riverland'},
] as const;
export function territoryData(rootId:string,countryId:string){
 const units:AdministrativeUnit[]=[],cities:GameState['geography']['cities']=[];let x=0;
 function add(id:string,name:string,levelId:string,parentId:string,bounds:Bounds,terrain:AdministrativeUnit['terrain'],index:number,population=0){const leaf=levelId==='xian';units.push({id,name,levelId,parentId,locationId:`loc-${id}`,governorId:null,treasury:0,stability:leaf?60+index%25:0,development:leaf?35+index%30:0,population,resources:leaf?{wood:terrain==='mountains'?180:60,iron:terrain==='mountains'?85:12,grain:terrain==='plain'?400:240}:{},terrain,controllerId:countryId,control:leaf?75+index%20:0,provenance:fictional,bounds});}
 for(const [zi,spec]of provinceSpecs.entries()){
  const zId=`zhou-${spec.id}`,zb={x,y:0,w:spec.width,h:1};add(zId,`${spec.name} Châu`,'zhou',rootId,zb,spec.terrain,zi);
  for(const [fi,name]of spec.prefectures.entries()){
   const fId=`${zId}-fu-${fi+1}`,fb={x,y:fi/spec.prefectures.length,w:spec.width,h:1/spec.prefectures.length};add(fId,`${name} Phủ`,'fu',zId,fb,spec.terrain,fi);
   const junCount=fi===0?2:1;
   const countyCountByOldGroup=Array.from({length:junCount},(_,ji)=>(fi+ji)%2===0?3:2);
   const totalCounties=countyCountByOldGroup.reduce((sum,count)=>sum+count,0);let countyIndex=0;
   for(let ji=0;ji<junCount;ji++){
    const countyCount=countyCountByOldGroup[ji]!;
    for(let hi=0;hi<countyCount;hi++){
     // Keep county IDs stable for GIS, economy and save references; the old jun segment is historical ID data only.
     const hId=`${fId}-jun-${ji+1}-xian-${hi+1}`,hb={...fb,y:fb.y+countyIndex*fb.h/totalCounties,h:fb.h/totalCounties},population=spec.countyPopulations[fi]?.[countyIndex];if(population===undefined)throw Error(`Thiếu dân số khởi đầu: ${hId}`);countyIndex++;add(hId,`${name} ${ji===0?'Bắc':'Nam'} ${['An','Bình','Hòa'][hi]} Huyện`,'xian',fId,hb,spec.terrain,units.length,population);
     if(ji===0&&hi===0)cities.push({id:`city-${fId}`,name:`Thành ${name}`,unitId:hId});
    }
   }
   if(countyIndex!==spec.countyPopulations[fi]?.length)throw Error(`Sai số Huyện khởi đầu: ${fId}`);
  }
  x+=spec.width;
 }
 return{units,geography:{cities,roads:cities.slice(1).map((c,i)=>({id:`road-${i+1}`,from:cities[i]!.id,to:c.id}))}};
}
