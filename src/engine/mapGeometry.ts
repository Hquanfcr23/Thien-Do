import clipping from 'polygon-clipping';
import type {Pair,MultiPolygon,Polygon} from 'polygon-clipping';
import polylabel from 'polylabel';
import type { GameState } from '../domain/schema';
import { counties,projectPolygon,projection } from '../data/realGeography';
export type TerritoryShape={id:string;shape:MultiPolygon;label:Pair;path:string;sourceName:string;coordinates:Pair};
export type Atlas=Map<string,TerritoryShape>;
export function ringArea(ring:Pair[]):number {let area=0;for(let i=0;i<ring.length-1;i++){const a=ring[i]!,b=ring[i+1]!;area+=a[0]*b[1]-b[0]*a[1];}return Math.abs(area)/2;}
export function area(shape:MultiPolygon):number{return shape.reduce((s,p)=>s+ringArea(p[0]!)-p.slice(1).reduce((n,h)=>n+ringArea(h),0),0);}
export function largest(shape:MultiPolygon):Polygon {const p=[...shape].sort((a,b)=>ringArea(b[0]!)-ringArea(a[0]!))[0];if(!p)throw new Error('Lãnh thổ rỗng.');return p;}
function svgPath(shape:MultiPolygon){return shape.map(p=>p.map(r=>`M${r.map(v=>v.join(',')).join('L')}Z`).join('')).join('');}
export function inside(p:Pair,ring:Pair[]){let result=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i]!,b=ring[j]!;if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])result=!result;}return result;}
const sourceById=new Map(counties.features.map(f=>[f.properties.unitId!,f]));
let cacheKey='',cached:Atlas=new Map();
export function buildAtlas(state:GameState):Atlas{
 const key=state.administrativeUnits.map(u=>`${u.id}:${u.parentId}`).join('|');if(key===cacheKey)return cached;
 const atlas:Atlas=new Map();
 function assemble(id:string):MultiPolygon{
  const children=state.administrativeUnits.filter(u=>u.parentId===id),source=sourceById.get(id);
  const parts=children.map(u=>assemble(u.id)).filter(p=>p.length);
  const shape=parts.length?clipping.union(parts[0]!,...parts.slice(1)):source?projectPolygon(source):[];
  if(shape.length){const label=polylabel(largest(shape),.03),coordinates=projection.invert?.(label)??[0,0];atlas.set(id,{id,shape,label:[label[0],label[1]],path:svgPath(shape),sourceName:source?.properties.sourceNames?.join(' + ')??source?.properties.name??'Hoàng Hà · hợp nhất các Huyện GIS',coordinates:[coordinates[0],coordinates[1]]});}return shape;
 }
 for(const root of state.administrativeUnits.filter(u=>u.parentId===null))assemble(root.id);
 cacheKey=key;cached=atlas;return atlas;
}
export function shapeBounds(shape:MultiPolygon){const p=shape.flat(2);return{minX:Math.min(...p.map(v=>v[0])),maxX:Math.max(...p.map(v=>v[0])),minY:Math.min(...p.map(v=>v[1])),maxY:Math.max(...p.map(v=>v[1]))};}
export function fitShape(shape:MultiPolygon,width=1120,height=670){const b=shapeBounds(shape),zoom=Math.min(4,Math.max(.02,Math.min(width/(b.maxX-b.minX),height/(b.maxY-b.minY))*.86));return{zoom,x:zoom*(700-(b.minX+b.maxX)/2),y:zoom*(425-(b.minY+b.maxY)/2)};}
