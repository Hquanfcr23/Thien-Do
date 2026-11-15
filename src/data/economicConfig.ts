import type { BuildingKind,Good,Stock,CountyEconomy,Route } from '../domain/economy';
export const goodsConfig:Record<Good,{name:string;unit:string;price:number}>={grain:{name:'Lương thực',unit:'thạch lương',price:1},wood:{name:'Gỗ',unit:'đơn vị',price:2},stone:{name:'Đá',unit:'đơn vị',price:1.5},ore:{name:'Quặng sắt',unit:'đơn vị',price:3},iron:{name:'Sắt',unit:'đơn vị',price:6},tools:{name:'Công cụ',unit:'bộ',price:12},fiber:{name:'Sợi gai',unit:'bó',price:2},cloth:{name:'Vải',unit:'cuộn',price:4},equipment:{name:'Quân trang',unit:'bộ',price:20}};
// Shared monthly administrative cost per household, used by both budgeting and settlement.
export const administrationCostPerHousehold=.0025;
export const crops={millet:{name:'Kê xuân',sow:4,harvest:9,months:[4,5,6,7,8,9],yield:9},wheat:{name:'Lúa mì đông',sow:10,harvest:6,months:[10,11,12,1,2,3,4,5,6],yield:10}} as const;
export interface BuildingDefinition {name:string;money:number;materials:Partial<Stock>;work:number;maintenance:number;effect:string;details:string[]}
const effectDetails:Record<BuildingKind,string[]>={
 farm:['Mỗi cấp đủ tình trạng tăng 10% diện tích đất được tính vào sản xuất. Sản lượng thực còn phụ thuộc đất, nước, mùa vụ, công cụ và lao động.'],
 irrigation:['Mỗi cấp đủ tình trạng cộng 0,15 vào nguồn nước hữu hiệu trong các tháng cây đang sinh trưởng (giới hạn 0–1). Tác dụng giảm dần khi nguồn nước đã gần mức tối đa; không cộng thẳng 15% sản lượng.'],
 granary:['Tại Huyện: mỗi cấp tăng sức chứa lương thêm 0,3 thạch nội bộ/người và giảm hao hụt nền từ 1,2% xuống 1,2%/(1 + số cấp).','Tại Phủ: mỗi cấp tăng ngưỡng kho vùng thêm 0,05 thạch nội bộ/người và giảm hao hụt nền theo cùng công thức. Vượt ngưỡng vẫn chịu hao hụt quá tải.'],
 mine:['Mỗi cấp đủ tình trạng tăng trần khai thác hàng tháng thêm 12 đơn vị gỗ và đá, 6 đơn vị quặng sắt. Không vượt trữ lượng mỏ, lao động, vốn tư nhân hoặc nguyên liệu sẵn có.'],
 workshop:['Mỗi cấp đủ tình trạng tăng tối đa 100% năng lực của từng công thức chế biến; cấp 1 cho trần tối đa gấp 2. Lao động, bạc và đầu vào vẫn giới hạn sản lượng thực.'],
 market:['Mỗi cấp đủ tình trạng tăng 20% năng lực lao động thương mại của Huyện/Phủ; không tạo hàng hoặc người mua mới.'],
 road:['Trên tuyến bộ, hiệu quả được tính trung bình ở hai đầu tuyến: mỗi điểm hiệu quả tăng tải tối đa 40%, tốc độ 30% và giảm cước 20% (theo mẫu số). Cấp 1 ở một đầu tương ứng +20% tải, +15% tốc độ, cước giảm khoảng 11%.'],
 bridge:['Trên tuyến có sẵn, hiệu quả trung bình hai đầu tăng tải tối đa 15% và tốc độ 10% mỗi điểm. Cấp 1 ở một đầu cho khoảng +7,5% tải và +5% tốc độ. Không tự tạo tuyến qua sông.'],
 canal:['Trên tuyến thủy có sẵn, dùng cùng hệ số hạ tầng đường thủy: mỗi điểm hiệu quả tăng tải tối đa 40%, tốc độ 30% và giảm cước 20% theo mẫu số. Cấp 1 ở một đầu cho khoảng +20% tải, +15% tốc độ, cước giảm khoảng 11%.'],
 port:['Trên tuyến thủy có sẵn, tác động hiện tại giống kênh đào: mỗi điểm hiệu quả tăng tải tối đa 40%, tốc độ 30% và giảm cước 20% theo mẫu số. Cấp 1 ở một đầu cho khoảng +20% tải, +15% tốc độ, cước giảm khoảng 11%.'],
 relay:['Mỗi điểm hiệu quả ở đầu tuyến tăng tốc độ vận chuyển 20%; cấp 1 ở một đầu tương ứng khoảng +10%. Đồng thời cộng 2 điểm phần trăm vào mức tuân thủ thuế trước các hệ số kiểm soát, tham nhũng và dịch vụ công.'],
 depot:['Hiệu quả trung bình hai đầu tuyến: mỗi điểm tăng tải tối đa 15%. Kho trung chuyển cũng giảm một thành phần hao hụt; hiệu quả phụ thuộc chiều dài tuyến, chất lượng và địa hình. Cấp 1 ở một đầu tương ứng +7,5% tải.'],
 administration:['Cộng 3 điểm phần trăm tuân thủ thuế cho mỗi cấp đủ tình trạng, trước khi áp dụng kiểm soát, ổn định, tham nhũng và dịch vụ hành chính. Không bảo đảm thu đủ nếu các yếu tố này thấp.'],
 fort:['Mỗi cấp tại đầu tuyến làm giảm một thành phần hao hụt vận tải bằng cách tăng mẫu số bảo vệ. Hiệu quả chính xác tùy chất lượng, chiều dài, địa hình và công trình ở đầu còn lại; chưa có bonus sức chiến đấu riêng.'],
};
const buildingProfiles:Record<BuildingKind,Omit<BuildingDefinition,'maintenance'>>={
 farm:{name:'Khai khẩn ruộng',money:180,materials:{wood:30,tools:5},work:1200,effect:'Mở rộng diện tích đất tính vào sản xuất',details:effectDetails.farm},
 irrigation:{name:'Thủy lợi',money:300,materials:{stone:60,wood:30,tools:8},work:1600,effect:'Bổ sung nước hữu hiệu cho cây trồng',details:effectDetails.irrigation},
 granary:{name:'Kho lương',money:180,materials:{wood:70,stone:30},work:1200,effect:'Tăng sức chứa và giảm hao hụt lương',details:effectDetails.granary},
 mine:{name:'Mỏ và bãi khai thác',money:240,materials:{wood:40,tools:12},work:1600,effect:'Tăng trần khai thác từ trữ lượng hữu hạn',details:effectDetails.mine},
 workshop:{name:'Công xưởng',money:260,materials:{wood:60,stone:35,tools:10},work:2000,effect:'Tăng công suất tối đa của các công thức chế biến',details:effectDetails.workshop},
 market:{name:'Chợ',money:160,materials:{wood:40,stone:20},work:500,effect:'Tăng năng lực lao động thương mại',details:effectDetails.market},
 road:{name:'Quan lộ',money:260,materials:{stone:100,tools:10},work:2000,effect:'Cải thiện tải, tốc độ và cước vận tải đường bộ',details:effectDetails.road},
 bridge:{name:'Cầu',money:300,materials:{stone:70,wood:80,tools:8},work:900,effect:'Cải thiện tải và tốc độ trên tuyến qua sông có sẵn',details:effectDetails.bridge},
 canal:{name:'Kênh đào',money:600,materials:{stone:140,tools:20},work:1800,effect:'Cải thiện tải, tốc độ và cước trên tuyến thủy có sẵn',details:effectDetails.canal},
 port:{name:'Bến cảng',money:300,materials:{wood:90,stone:50},work:900,effect:'Cải thiện tải, tốc độ và cước trên tuyến thủy có sẵn',details:effectDetails.port},
 relay:{name:'Trạm dịch',money:180,materials:{wood:50,cloth:15},work:500,effect:'Tăng tốc độ vận tải và hỗ trợ tuân thủ thuế',details:effectDetails.relay},
 depot:{name:'Kho trung chuyển',money:220,materials:{wood:70,stone:40},work:700,effect:'Tăng tải tuyến và giảm một phần hao hụt',details:effectDetails.depot},
 administration:{name:'Huyện nha',money:260,materials:{wood:60,stone:60,cloth:10},work:1600,effect:'Cộng điểm tuân thủ thuế',details:effectDetails.administration},
 fort:{name:'Đồn phòng thủ',money:350,materials:{stone:120,wood:80,equipment:5},work:1100,effect:'Giảm một phần hao hụt vận tải',details:effectDetails.fort},
};
// Monthly upkeep is 0.25% of configured replacement capital (labour plus base-price materials), 3% annually.
export const buildings=Object.fromEntries(Object.entries(buildingProfiles).map(([kind,def])=>[kind,{...def,maintenance:(def.money+Object.entries(def.materials).reduce((n,[good,amount])=>n+amount*goodsConfig[good as Good].price,0))*.0025}])) as Record<BuildingKind,BuildingDefinition>;
export const recipes=[
 {output:'iron',inputs:{ore:2,wood:1},workers:80,rate:5},
 {output:'tools',inputs:{iron:1,wood:1},workers:60,rate:3},
 {output:'cloth',inputs:{fiber:2,wood:.2},workers:60,rate:7},
 {output:'equipment',inputs:{iron:2,wood:1,cloth:1},workers:100,rate:2},
] satisfies {output:Good;inputs:Partial<Stock>;workers:number;rate:number}[];

export const economicProvenance={kind:'Fictional',note:'Tất cả định mức, mùa vụ, giá cơ sở và cấu hình công trình là hiệu chỉnh gameplay, không phải số liệu lịch sử.'} as const;

export const economicScenario={capitalCityId:'city-zhou-trung-ninh-fu-1'} as const;

// Fictional central granary and emergency transport calibration.
export const centralGranaryProfile={capacity:12000,storageWage:.0005,baseLoss:.006,unfundedLoss:.006,overflowLoss:.04,aidRouteShare:.2} as const;




export const coreBuildingKinds=['farm','irrigation','granary','mine','workshop','road','administration'] as const;
export const tierBonus=(level:number,values:readonly number[])=>values[Math.min(3,Math.max(0,Math.floor(level)))]??0;
export const upgradeScale=(level:number)=>level===0?1:level===1?1.5:2;
export const upkeepScale=(level:number)=>level<=1?level:level===2?2.5:4.5+(level-3)*2;
export function buildingPackage(kind:BuildingKind,level:number,baseScale=1){const def=buildings[kind],scale=upgradeScale(level)*baseScale;return {...def,money:def.money*scale,work:def.work*scale,materials:Object.fromEntries(Object.entries(def.materials).map(([g,n])=>[g,n*scale])) as Partial<Stock>,maintenance:def.maintenance*upkeepScale(level+1)*baseScale};}
export function projectDefinition(p:CountyEconomy['projects'][number]){const base=buildings[p.building],scale=p.costScale??1;return {...base,money:base.money*scale,work:p.required,materials:Object.fromEntries(Object.entries(base.materials).map(([g,n])=>[g,n*scale])) as Partial<Stock>};}
export function buildingUpkeep(kind:BuildingKind,b:CountyEconomy['buildings'][string]){return buildings[kind].maintenance*(b.legacy?b.level:upkeepScale(b.level));}
export function tierEffect(b:CountyEconomy['buildings'][string]|undefined,values:readonly number[],legacyStep:number){return b?(b.legacy?b.level*legacyStep:tierBonus(b.level,values))*b.condition:0;}
export function routeBonus(route:Route,values:readonly number[]){return route.upgrade?tierBonus(route.upgrade.level,values)*route.upgrade.condition:0;}
export const routeBonuses={capacity:[0,.25,.45,.6],speed:[0,.15,.25,.35],discount:[0,.1,.18,.25]} as const;

// Current core-building descriptions; legacy types remain readable in old saves.
buildings.farm.details=['Cấp 1/2/3: +10%/+18%/+24% diện tích sản xuất so với nền gốc. Cần giống và lao động, thu hoạch đúng mùa.'];
buildings.irrigation.details=['Cấp 1/2/3: +0,10/+0,18/+0,24 nguồn nước hữu hiệu; hiệu quả giảm khi đã đủ nước.'];
buildings.granary.details=['Chỉ xây tại Phủ. Mỗi cấp thêm 40.000 thạch lương sức chứa kho công. Hao hụt nền cấp 1/2/3: 0,9%/0,75%/0,6% mỗi tháng; hàng tư nhân không hưởng giảm hao kho công.'];
buildings.workshop.details=['Cấp 1/2/3 có trần chế biến 150%/200%/250% nền. Vẫn cần đủ nguyên liệu, lao động và vốn.'];
buildings.administration.details=['Cấp 1/2/3: +5/+9/+12 điểm phần trăm thực thi thuế tại Huyện, tối đa 100%. Ngân sách hành chính thiếu chi và tình trạng thấp làm giảm hiệu quả.'];

buildings.road.name='Giao thông';
buildings.road.details=['Chọn một tuyến cụ thể. Cấp 1/2/3 tăng tải 25%/45%/60%, tốc độ 15%/25%/35%; cước và tỷ lệ hao hụt giảm tương đối 10%/18%/25%.','Chi phí theo chiều dài: tuyến 100 km địa hình thường là mức chuẩn; đồi nhân 1,25, núi nhân 1,75. Thời gian đi được làm tròn lên theo tháng, tối thiểu 1 tháng.'];
