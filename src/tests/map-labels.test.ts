import { describe,it,expect } from 'vitest';
import { layoutLabels,type LabelCandidate } from '../ui/mapLabels';
import { createNewGame } from '../data/foundation';
import { buildAtlas } from '../engine/mapGeometry';
import { settlementPoint,containsPoint } from '../engine/mapFeatures';

describe('map legibility and settlements',()=>{
 it('resolves dense candidates without overlapping accepted boxes',()=>{
  const candidates:LabelCandidate[]=Array.from({length:24},(_,i)=>({id:String(i),text:'Ninh Kinh Bắc Bình Huyện',x:450+(i%4)*13,y:300+Math.floor(i/4)*9,kind:'district',priority:i}));
  const labels=layoutLabels(candidates,1280,650,375);expect(labels.length).toBeLessThan(candidates.length);expect(labels.length).toBeGreaterThan(0);
  for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i]!,b=labels[j]!;expect(a.left<b.left+b.width&&a.left+a.width>b.left&&a.top<b.top+b.height&&a.top+a.height>b.top).toBe(false);}
 });
 it('retains the capital before lower priority names at the same position',()=>{
  const base={text:'Thành Ninh Kinh',x:450,y:330};const labels=layoutLabels([{...base,id:'capital',kind:'capital',priority:110},{...base,id:'district',kind:'district',priority:60}],1280,650,375);expect(labels[0]?.id).toBe('capital');
 });
 it('places all seven settlements inside their actual county',()=>{
  const s=createNewGame(),atlas=buildAtlas(s);for(const city of s.geography.cities){const region=atlas.get(city.unitId)!;const point=settlementPoint(region.shape,region.label);expect(containsPoint(region.shape,point),city.name).toBe(true);}
 });
});

