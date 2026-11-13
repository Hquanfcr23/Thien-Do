import type { AdministrativeUnit,GameState,Provenance } from '../domain/schema';
import type { Bounds } from '../domain/territory';
export const fictional:Provenance={kind:'Fictional',note:'Địa danh, ranh giới và dữ liệu khởi đầu Đại Ninh do game sáng tạo; không phải địa giới lịch sử.'};
const provinceSpecs=[{id:'tay-linh',name:'Tây Lĩnh',width:.3,prefectures:['Lâm An','Sơn Bình'],terrain:'mountains'},{id:'trung-ninh',name:'Trung Ninh',width:.38,prefectures:['Ninh Kinh','Hà Dương','Bình Nguyên'],terrain:'plain'},{id:'dong-giang',name:'Đông Giang',width:.32,prefectures:['Giang Khẩu','Đông Hải'],terrain:'riverland'}] as const;
export function territoryData(rootId:string,countryId:string){
 const units:AdministrativeUnit[]=[],cities:GameState['geography']['cities']=[];let x=0;
 function add(id:string,name:string,levelId:string,parentId:string,bounds:Bounds,terrain:AdministrativeUnit['terrain'],index:number){const leaf=levelId==='xian';units.push({id,name,levelId,parentId,locationId:`loc-${id}`,governorId:null,treasury:0,stability:leaf?60+index%25:0,development:leaf?35+index%30:0,population:leaf?9000+index*750:0,resources:leaf?{wood:terrain==='mountains'?180:60,iron:terrain==='mountains'?85:12,grain:terrain==='plain'?400:240}:{},terrain,controllerId:countryId,control:leaf?75+index%20:0,provenance:fictional,bounds});}
 for(const [zi,spec]of provinceSpecs.entries()){
  const zId=`zhou-${spec.id}`,zb={x,y:0,w:spec.width,h:1};add(zId,`${spec.name} Châu`,'zhou',rootId,zb,spec.terrain,zi);
  for(const [fi,name]of spec.prefectures.entries()){
   const fId=`${zId}-fu-${fi+1}`,fb={x,y:fi/spec.prefectures.length,w:spec.width,h:1/spec.prefectures.length};add(fId,`${name} Phủ`,'fu',zId,fb,spec.terrain,fi);
   const junCount=fi===0?2:1;
   for(let ji=0;ji<junCount;ji++){
    const jId=`${fId}-jun-${ji+1}`,jb={...fb,x:fb.x+ji*fb.w/junCount,w:fb.w/junCount};add(jId,`${name} ${ji===0?'Thượng':'Hạ'} Quận`,'jun',fId,jb,spec.terrain,ji);
    const countyCount=(fi+ji)%2===0?3:2;
    for(let hi=0;hi<countyCount;hi++){
     const hId=`${jId}-xian-${hi+1}`,hb={...jb,y:jb.y+hi*jb.h/countyCount,h:jb.h/countyCount};add(hId,`${name} ${ji===0?'Bắc':'Nam'} ${['An','Bình','Hòa'][hi]} Huyện`,'xian',jId,hb,spec.terrain,units.length);
     if(ji===0&&hi===0)cities.push({id:`city-${fId}`,name:`Thành ${name}`,unitId:hId});
    }
   }
  }
  x+=spec.width;
 }
 return{units,geography:{cities,roads:cities.slice(1).map((c,i)=>({id:`road-${i+1}`,from:cities[i]!.id,to:c.id}))}};
}
