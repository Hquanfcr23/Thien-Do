import { memo } from 'react';
import { baseLayers } from '../data/realGeography';
export const GeographicBase=memo(function GeographicBase({detailed}:{detailed:boolean}){
 return <g pointerEvents="none" aria-label="Địa lý Natural Earth">
 <g className="gis-land">{baseLayers.countries.map((f,i)=><path key={i} d={f.path}><title>{f.name}</title></path>)}</g>
 <g className="gis-relief">{baseLayers.terrain.map((f,i)=><path key={i} d={f.path}><title>{f.name}</title></path>)}</g>
 <g className="gis-lakes">{baseLayers.lakes.map((f,i)=><path key={i} d={f.path}><title>{f.name}</title></path>)}</g>
 <g className="gis-rivers">{baseLayers.rivers.filter(f=>detailed||['Huang','Yellow','Yangtze'].includes(f.name)).map((f,i)=><path key={i} d={f.path}><title>{f.name}</title></path>)}</g>
 </g>;
});
