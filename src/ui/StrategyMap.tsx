import { useEffect,useMemo,useRef,useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { descendants,summarizeUnit } from '../engine/administration';
import { buildAtlas,fitShape } from '../engine/mapGeometry';
import { cameraModel,constrainCamera,fitPlayable,zoomCamera } from '../engine/mapCamera';
import { settlementPoint } from '../engine/mapFeatures';
import { mapLevelSchema,type MapLevel } from '../domain/territory';
import { chinaShape } from '../data/realGeography';
import { layoutLabels,type LabelCandidate } from './mapLabels';
import { GeographicBase } from './GeographicBase';
import type { Pair } from 'polygon-clipping';
export function StrategyMap({labels,panelOpen=false}:{labels:boolean;panelOpen?:boolean}){
 const {game,updateView,selectUnit}=useGameStore();
 const host=useRef<HTMLElement>(null),initialized=useRef(false);
 const [size,setSize]=useState({width:1400,height:850,measured:false});const [browseMode,setBrowseMode]=useState<MapLevel|null>(null);
 const drag=useRef<{startX:number;startY:number;originX:number;originY:number;id:string|null;moved:boolean}|null>(null);
 const atlas=useMemo(()=>game?buildAtlas(game):new Map(),[game]);
 useEffect(()=>{if(!host.current)return;const observer=new ResizeObserver(([entry])=>{if(entry)setSize({width:entry.contentRect.width,height:entry.contentRect.height,measured:true});});observer.observe(host.current);return()=>observer.disconnect();},[]);
 const root=game?.administrativeUnits.find(u=>u.parentId===null),outline=root?atlas.get(root.id):undefined,raw=game?.mapView;
 const reserve=20,scale=Math.min(size.width/1400,size.height/850),padX=(size.width-1400*scale)/2,padY=(size.height-850*scale)/2;
 const model=useMemo(()=>outline?cameraModel(outline.shape,chinaShape,{left:((panelOpen?680:110)-padX)/scale,right:(Math.max(450,size.width-reserve-18)-padX)/scale,top:(170-padY)/scale,bottom:(size.height-70-padY)/scale}):null,[outline,scale,padX,padY,size.width,size.height,reserve,panelOpen]);
 useEffect(()=>{
  if(!raw||!model||!outline||!size.measured)return;
  const constrained=constrainCamera(raw,model);
  let next=constrained;
  if(!initialized.current){initialized.current=true;if(raw.zoom===1&&raw.x===0&&raw.y===0||Math.abs(constrained.x-raw.x)>1||Math.abs(constrained.y-raw.y)>1)next=fitPlayable(outline.shape,model);}
  if(Math.abs(next.zoom-raw.zoom)>1e-7||Math.abs(next.x-raw.x)>1e-7||Math.abs(next.y-raw.y)>1e-7)updateView(next);
 },[raw,model,outline,size.measured,updateView]);
 useEffect(()=>{
  const element=host.current;if(!element||!raw||!model)return;
  const wheel=(e:WheelEvent)=>{if((e.target as Element).closest('button,select'))return;e.preventDefault();const r=element.getBoundingClientRect();const factor=Math.exp(-Math.max(-250,Math.min(250,e.deltaY))*.002);updateView(zoomCamera(raw,raw.zoom*factor,[(e.clientX-r.left-padX)/scale,(e.clientY-r.top-padY)/scale],model));};
  element.addEventListener('wheel',wheel,{passive:false});return()=>element.removeEventListener('wheel',wheel);
 },[raw,model,scale,padX,padY,updateView]);
 if(!game)return null;
 const view=model?{...game.mapView,...constrainCamera(game.mapView,model)}:game.mapView;
 const selected=game.administrativeUnits.find(u=>u.id===view.selectedId);const selectedFu=selected?.levelId==='xian'?game.administrativeUnits.find(u=>u.id===selected.parentId):selected;const selectedZhou=selected?.levelId==='zhou'?selected:selectedFu?.parentId?game.administrativeUnits.find(u=>u.id===selectedFu.parentId):undefined;const visible=game.administrativeUnits.filter(u=>{if(!atlas.has(u.id))return false;if(browseMode!==null)return u.levelId===browseMode;if(!selected)return u.levelId==='zhou';if(selected.levelId==='zhou')return u.levelId==='zhou'||u.levelId==='fu'&&u.parentId===selected.id;if(selected.levelId==='fu')return u.levelId==='zhou'||u.levelId==='fu'&&u.parentId===selectedZhou?.id||u.levelId==='xian'&&u.parentId===selected.id;return u.levelId==='zhou'||u.levelId==='fu'&&u.parentId===selectedZhou?.id||u.levelId==='xian'&&u.parentId===selectedFu?.id;});
 const related=(id:string)=>view.selectedId!==null&&(descendants(game,id).some(u=>u.id===view.selectedId)||descendants(game,view.selectedId).some(u=>u.id===id));
 const fill=(id:string)=>{const keys=Object.keys(summarizeUnit(game,id).controllers);return keys.length===1&&keys[0]===game.country.id?'#c6ca98':keys.length>1?'#d7c2a3':'#b5b1a4';};
 const choose=(id:string)=>{const unit=game.administrativeUnits.find(u=>u.id===id);if(!unit)return;selectUnit(id);if(browseMode===null)updateView({level:unit.levelId==='zhou'?'fu':unit.levelId==='fu'?'xian':'xian'});};
 const screen=(p:Pair):Pair=>[(view.x+700+(p[0]-700)*view.zoom)*scale+padX,(view.y+425+(p[1]-425)*view.zoom)*scale+padY];
 const cityPoint=(id:string):Pair|undefined=>{const city=game.geography.cities.find(c=>c.id===id),region=city?atlas.get(city.unitId):undefined;return region?settlementPoint(region.shape,region.label):undefined;};
 const relativeZoom=model&&outline?view.zoom/fitPlayable(outline.shape,model).zoom:view.zoom;
 const labelLevel=browseMode??(relativeZoom<1.15?'zhou':relativeZoom<1.65?'fu':'xian');
 const visibleIds=new Set(visible.map(u=>u.id));const candidates:LabelCandidate[]=visible.filter(u=>u.levelId===labelLevel&&visibleIds.has(u.id)).map(u=>{const[x,y]=screen(atlas.get(u.id)!.label);return{id:u.id,text:u.name,x,y,kind:u.levelId==='zhou'?'province':'district',priority:u.id===view.selectedId?100:60};});
 const placed=labels?layoutLabels(candidates,size.width,size.height,reserve):[];
 const zoom=(delta:number)=>{if(model)updateView(zoomCamera(view,view.zoom*Math.exp(delta),[(model.frame.left+model.frame.right)/2,(model.frame.top+model.frame.bottom)/2],model));};
 return <section ref={host} className="strategy-map natural-map real-map" aria-label="Bản đồ hành chính Đại Ninh">
 <svg viewBox="0 0 1400 850" role="group" aria-label="Lãnh thổ hành chính" onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();const id=(e.target as Element).closest('[data-unit-id]')?.getAttribute('data-unit-id')??null;drag.current={startX:e.clientX,startY:e.clientY,originX:view.x,originY:view.y,id,moved:false};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{const d=drag.current;if(!d||!model)return;if(e.buttons!==1){drag.current=null;return;}if(!d.moved&&Math.hypot(e.clientX-d.startX,e.clientY-d.startY)<4)return;d.moved=true;updateView(constrainCamera({zoom:view.zoom,x:d.originX+(e.clientX-d.startX)/scale,y:d.originY+(e.clientY-d.startY)/scale},model));}} onPointerUp={()=>{const d=drag.current;drag.current=null;if(d?.id&&!d.moved)choose(d.id);}} onPointerCancel={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>
 <defs><pattern id="water" width="38" height="24" patternUnits="userSpaceOnUse"><path d="M0 12q9-5 19 0t19 0" fill="none" stroke="#5c86781f"/></pattern></defs>
 <rect width="1400" height="850" fill="#aec8c3"/><rect width="1400" height="850" fill="url(#water)"/>
 <g data-testid="map-camera" transform={`translate(${view.x} ${view.y}) translate(700 425) scale(${view.zoom}) translate(-700 -425)`}>
 <GeographicBase detailed={view.zoom>.35}/>
 {outline&&<path data-testid="playable-outline" className="national-outline" d={outline.path} fill="none" stroke="#6c4930" strokeWidth="2"/>}
 <g className="territories">{visible.map(u=><path key={u.id} d={atlas.get(u.id)!.path} data-unit-id={u.id} data-testid={`territory-${u.id}`} role="button" tabIndex={0} aria-label={u.name} aria-pressed={related(u.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(u.id);}}} fill={fill(u.id)} fillOpacity=".5" fillRule="evenodd" className={related(u.id)?'selected-territory':''}><title>{u.name} · {summarizeUnit(game,u.id).population.toLocaleString('vi-VN')} dân</title></path>)}</g>
 <g className="terrain-decoration" pointerEvents="none">
 {view.zoom>=1.2&&game.simulation?.routes.map(r=>{const a=atlas.get(r.from)?.label,b=atlas.get(r.to)?.label;if(!a||!b)return null;return <path key={r.id} d={`M${a.join(',')}L${b.join(',')}`} stroke={r.blocked?'#9c3028':r.mode==='river'?'#32758a':'#886b45'} strokeWidth={r.mode==='river'?1.4:1} strokeOpacity={r.blocked?.8:.45} vectorEffect="non-scaling-stroke" strokeDasharray={r.mode==='river'?'5 3':'3 4'} fill="none"/>;})}
 {!game.simulation&&view.zoom>=1.2&&game.geography.roads.map(r=>{const a=cityPoint(r.from),b=cityPoint(r.to);if(!a||!b)return null;return <path key={r.id} d={`M${a.join(',')}L${b.join(',')}`} stroke="#886b45" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="3 4" fill="none"/>;})}
 {game.geography.cities.map(c=>{const p=cityPoint(c.id);if(!p)return null;const important=c.name.includes('Ninh Kinh');if(view.zoom<1.2&&!important)return null;return <g key={c.id} transform={`translate(${p.join(',')}) scale(${1/view.zoom})`}><circle r={important?7:4} fill="#fff5d6" stroke="#71392c" strokeWidth="1.5"/><path d="m-4 1 4-4 4 4v3H-4Z" fill="#963d31"/></g>;})}
 </g></g>
 <g className="placed-map-labels" pointerEvents="none">{placed.map(l=><text key={l.id} x={(l.x-padX)/scale} y={(l.y-padY)/scale} fontSize={(l.kind==='city'?11:14)/scale} textAnchor="middle" dominantBaseline="middle" data-testid="map-label" data-kind={l.kind}>{l.text}</text>)}</g>
 </svg>
 <div className="map-layer" role="group" aria-label="Chế độ bản đồ"><button aria-pressed={browseMode===null} onClick={()=>setBrowseMode(null)}>Mặc định</button>{(['zhou','fu','xian'] as MapLevel[]).map(level=><button key={level} aria-pressed={browseMode===level} onClick={()=>{setBrowseMode(level);updateView({level:mapLevelSchema.parse(level)});}}>{game.administrativeProfile.levels.find(l=>l.id===level)?.name}</button>)}</div>
 <button className="china-overview" onClick={()=>{if(model){const fit=fitShape(chinaShape,model.frame.right-model.frame.left,model.frame.bottom-model.frame.top);updateView(constrainCamera({...fit,x:fit.x+(model.frame.left+model.frame.right)/2-700,y:fit.y+(model.frame.top+model.frame.bottom)/2-425},model));}}}>Toàn cảnh Trung Hoa</button>
 <div className="map-controls" aria-label="Điều khiển bản đồ"><button aria-label="Thu nhỏ bản đồ" onClick={()=>zoom(-.2)}>−</button><span>{Math.round(view.zoom*100)}%</span><button aria-label="Phóng to bản đồ" onClick={()=>zoom(.2)}>+</button><button aria-label="Reset View" onClick={()=>{if(model&&outline)updateView(fitPlayable(outline.shape,model));}}>⌖</button></div>
 
 </section>;
}
