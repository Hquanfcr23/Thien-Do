import {describe,it,expect} from 'vitest';
import {createNewGame} from '../data/foundation';
import {emptyStock,type Report,type Route} from '../domain/economy';
import {gameStateSchema} from '../domain/schema';
import {marketAccess,goodsTotal,moneyTotal,type MonthContext,type EconomicState} from '../engine/economyContext';
import {hubPath,prefectureCorridors} from '../engine/prefectureTransport';
import {dispatch,transport} from '../engine/transport';
import {exportSave,importSave} from '../persistence/saves';

function fixture(){
 const s=createNewGame(42) as EconomicState,units=new Map(s.administrativeUnits.map(u=>[u.id,u]));
 const [fa,fb]=Object.keys(s.simulation.prefectures),a=Object.keys(s.simulation.counties).filter(id=>units.get(id)!.parentId===fa),b=Object.keys(s.simulation.counties).filter(id=>units.get(id)!.parentId===fb);
 const [as,ax]=a as [string,string], [bs,bx]=b as [string,string];s.simulation.prefectures[fa!]!.seatCountyId=as;s.simulation.prefectures[fb!]!.seatCountyId=bs;
 const route=(id:string,from:string,to:string):Route=>({id,from,to,mode:'road',km:20,capacity:1000,quality:1,blocked:false,used:0,lastCapacity:0});
 s.simulation.routes=[route('local-a',as,ax),route('border',ax,bx),route('local-b',bx,bs)];
 const report:Report={...s.calendar,produced:emptyStock(),used:emptyStock(),destroyed:emptyStock(),goodsError:emptyStock(),population:0,births:0,deaths:0,migration:0,harvest:0,consumed:0,loss:0,tax:0,spending:0,treasury:0,grain:0,shortageCount:0,moneyError:0,grainError:0,notes:[]};
 const ctx:MonthContext={s,units,report,labour:new Map(),weather:new Map()};return{ctx,as,ax,bs,bx};
}
describe('Phủ hubs and local collection',()=>{
 it('derives one physical corridor per Phủ pair and routes both directions through seats',()=>{
  const {ctx,as,ax,bs,bx}=fixture(),before=structuredClone(ctx.s);
  expect(prefectureCorridors(ctx)).toHaveLength(1);
  expect(hubPath(ctx,as,bs).map(r=>r.id)).toEqual(['local-a','border','local-b']);
  expect(hubPath(ctx,bs,as).map(r=>r.id)).toEqual(['local-b','border','local-a']);
  const path=hubPath(ctx,ax,bx);let at=ax;const visited=[at];for(const r of path){at=r.from===at?r.to:r.from;visited.push(at);}expect(at).toBe(bx);expect(visited).toContain(as);expect(visited).toContain(bs);expect(ctx.s).toEqual(before);
 });
 it('does not bypass a cut local feeder through another Phủ',()=>{
  const {ctx,as,ax,bs,bx}=fixture();ctx.s.simulation.routes[0]!.blocked=true;
  ctx.s.simulation.routes.push({id:'bypass',from:as,to:bx,mode:'river',km:10,capacity:1000,quality:1,blocked:false,used:0,lastCapacity:0});
  expect(marketAccess(ctx,ax).path).toHaveLength(0);expect(hubPath(ctx,ax,bs)).toHaveLength(0);
 });
 it('blocks the long-distance corridor when its only gate is closed',()=>{
  const {ctx,as,bs}=fixture();ctx.s.simulation.routes[1]!.blocked=true;expect(prefectureCorridors(ctx)).toHaveLength(0);expect(hubPath(ctx,as,bs)).toHaveLength(0);
 });
 it('preserves old direct cargo through save/load and completes it without rerouting or minting',()=>{
  const {ctx,ax,bx}=fixture(),cash=moneyTotal(ctx.s),wood=goodsTotal(ctx.s,'wood');
  expect(dispatch(ctx,ax,bx,'wood',10,[ctx.s.simulation.routes[1]!])).toBe(true);
  ctx.s=importSave(exportSave(ctx.s)) as EconomicState;ctx.units=new Map(ctx.s.administrativeUnits.map(u=>[u.id,u]));
  expect(ctx.s.simulation.shipments[0]!.path).toEqual(['border']);
  transport(ctx);expect(ctx.s.simulation.shipments).toHaveLength(1);transport(ctx);expect(ctx.s.simulation.shipments).toHaveLength(0);
  expect(moneyTotal(ctx.s)).toBe(cash);expect(goodsTotal(ctx.s,'wood')).toBeCloseTo(wood-ctx.report.destroyed.wood,8);expect(gameStateSchema.safeParse(ctx.s).success).toBe(true);
 });
});
