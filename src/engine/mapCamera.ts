import type { MapView } from '../domain/territory';
import type { MultiPolygon } from 'polygon-clipping';
import { shapeBounds,fitShape,area,largest } from './mapGeometry';
import clipping from 'polygon-clipping';
import polylabel from 'polylabel';
export interface Frame {left:number;right:number;top:number;bottom:number}
export interface CameraModel {bounds:ReturnType<typeof shapeBounds>;frame:Frame;minZoom:number;maxZoom:number;shape:MultiPolygon;anchor:number[]}
export function cameraModel(playable:MultiPolygon,china:MultiPolygon,frame:Frame):CameraModel{return{shape:playable,anchor:polylabel(largest(playable)),bounds:shapeBounds(playable),frame,minZoom:Math.max(.02,fitShape(china,frame.right-frame.left,frame.bottom-frame.top).zoom),maxZoom:4};}
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
function constrainAxis(min:number,max:number,start:number,end:number,k:number,t:number,pivot:number){
 const a=pivot+(min-pivot)*k,b=pivot+(max-pivot)*k;
 return b-a<=end-start?clamp(t,start-a,end-b):clamp(t,end-b,start-a);
}
export function constrainCamera(view:Pick<MapView,'zoom'|'x'|'y'>,model:CameraModel){
 const zoom=clamp(view.zoom,model.minZoom,model.maxZoom),b=model.bounds,f=model.frame;
 const result={zoom,x:constrainAxis(b.minX,b.maxX,f.left,f.right,zoom,view.x,700),y:constrainAxis(b.minY,b.maxY,f.top,f.bottom,zoom,view.y,425)};
 const point=(x:number,y:number):[number,number]=>[700+(x-700-result.x)/zoom,425+(y-425-result.y)/zoom];
 const viewport:MultiPolygon=[[[point(f.left,f.top),point(f.right,f.top),point(f.right,f.bottom),point(f.left,f.bottom),point(f.left,f.top)]]];
 if(area(clipping.intersection(model.shape,viewport))<.1){result.x=(f.left+f.right)/2-700-(model.anchor[0]!-700)*zoom;result.y=(f.top+f.bottom)/2-425-(model.anchor[1]!-425)*zoom;}
 return result;
}
export function fitPlayable(shape:MultiPolygon,model:CameraModel){const f=model.frame,fit=fitShape(shape,f.right-f.left,f.bottom-f.top);return constrainCamera({...fit,x:fit.x+(f.left+f.right)/2-700,y:fit.y+(f.top+f.bottom)/2-425},model);}
export function zoomCamera(view:Pick<MapView,'zoom'|'x'|'y'>,target:number,anchor:[number,number],model:CameraModel){const zoom=clamp(target,model.minZoom,model.maxZoom),ratio=zoom/view.zoom;return constrainCamera({zoom,x:anchor[0]-700-(anchor[0]-700-view.x)*ratio,y:anchor[1]-425-(anchor[1]-425-view.y)*ratio},model);}
