import type { MapView } from '../domain/territory';
import type { MultiPolygon } from 'polygon-clipping';
import { shapeBounds,fitShape } from './mapGeometry';
export interface Frame {left:number;right:number;top:number;bottom:number}
export interface CameraModel {bounds:ReturnType<typeof shapeBounds>;frame:Frame;minZoom:number;maxZoom:number;shape:MultiPolygon;anchor:number[]}
export function cameraModel(playable:MultiPolygon,china:MultiPolygon,frame:Frame):CameraModel{return{shape:playable,anchor:[],bounds:shapeBounds(playable),frame,minZoom:Math.max(.02,fitShape(china,frame.right-frame.left,frame.bottom-frame.top).zoom),maxZoom:4};}
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
export function constrainCamera(view:Pick<MapView,'zoom'|'x'|'y'>,model:CameraModel){return{zoom:clamp(view.zoom,model.minZoom,model.maxZoom),x:view.x,y:view.y};}
export function fitPlayable(shape:MultiPolygon,model:CameraModel){const f=model.frame,fit=fitShape(shape,f.right-f.left,f.bottom-f.top);return constrainCamera({...fit,x:fit.x+(f.left+f.right)/2-700,y:fit.y+(f.top+f.bottom)/2-425},model);}
export function zoomCamera(view:Pick<MapView,'zoom'|'x'|'y'>,target:number,anchor:[number,number],model:CameraModel){const zoom=clamp(target,model.minZoom,model.maxZoom),ratio=zoom/view.zoom;return constrainCamera({zoom,x:anchor[0]-700-(anchor[0]-700-view.x)*ratio,y:anchor[1]-425-(anchor[1]-425-view.y)*ratio},model);}
