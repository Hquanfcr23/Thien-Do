export interface LabelCandidate {id:string;text:string;x:number;y:number;kind:'province'|'district'|'city'|'capital';priority:number}
export interface PlacedLabel extends LabelCandidate {left:number;top:number;width:number;height:number}
export function layoutLabels(candidates:LabelCandidate[],width:number,height:number,reservedRight:number):PlacedLabel[]{
 const placed:PlacedLabel[]=[];
 for(const c of [...candidates].sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id))){
  const w=c.text.length*(c.kind==='city'?7:8.8)+18,h=c.kind==='city'?23:29;
  for(const dy of [0,-27,27,-52,52]){
   const box={...c,x:c.x,y:c.y+dy,left:c.x-w/2,top:c.y+dy-h/2,width:w,height:h};
   if(box.left<100||box.left+w>width-reservedRight-14||box.top<160||box.top+h>height-70)continue;
   if(placed.some(p=>box.left<p.left+p.width+8&&box.left+w+8>p.left&&box.top<p.top+p.height+6&&box.top+h+6>p.top))continue;
   placed.push(box);break;
  }
 }
 return placed;
}
