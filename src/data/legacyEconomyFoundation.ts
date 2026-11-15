import type { GameState } from '../domain/schemaV4';
import { emptyStock,goods,type Simulation } from '../domain/economyV1';
import { goodsConfig } from './economicConfig';
import { buildAtlas,inside } from '../engine/mapGeometry';
import { counties,rivers,projectGeo } from './realGeography';
import { geoDistance } from 'd3-geo';
export function initializeEconomy(state:GameState,endowment=false):GameState{
 if(state.simulation)return state;
 const s=structuredClone(state),atlas=buildAtlas({...s,simulation:undefined} as unknown as Parameters<typeof buildAtlas>[0]),leaves=s.administrativeUnits.filter(u=>u.levelId===s.administrativeProfile.levels.at(-1)?.id);
 const sim:Simulation={revision:1,rng:s.seed>>>0,tick:0,nextId:1,policy:{landTax:.12,tradeTax:.04,farmShare:.64,industryShare:.24,reserveShare:0,tradeOpen:true},counties:{},routes:[],shipments:[],orders:[],reports:[],annual:[],weatherMode:'normal',lastMessages:[]};
 for(const [i,u] of leaves.entries()){
  // New mountain counties need enough cultivated land to bridge the next pre-harvest month.
  // Legacy migrations retain their previous land calibration.
  const land=u.population*.08*(u.terrain==='mountains'?(endowment?1:.8):u.terrain==='plain'?1.15:.9);
  if(endowment)for(const g of goods)u.resources[g]??=0;
  if(endowment){u.resources.grain!+=u.population*.26;u.resources.wood!+=160;u.resources.stone!+=160;
   // One harvest's tool requirement plus twelve months of normal wear; four months of cloth demand.
   u.resources.tools!+=Math.max(30,Math.ceil(land*(.01+12*.0003)));
   u.resources.fiber!+=30;u.resources.cloth!+=Math.max(50,Math.ceil(u.population*.0005*4));u.resources.equipment!+=12;}
  sim.counties[u.id]={households:Math.ceil(u.population/5),workingAge:Math.floor(u.population*.55),farmers:Math.floor(u.population*.76),landowners:Math.floor(u.population*.06),artisans:u.population-Math.floor(u.population*.76)-Math.floor(u.population*.06),unemployment:0,livingStandard:.7,privateMoney:u.population*.3,land,soil:u.terrain==='mountains'?.65:.8,water:u.terrain==='riverland'?.85:.6,crop:u.terrain==='riverland'?'wheat':'millet',sown:u.terrain==='riverland'?u.population*.08*.9:0,cropHealth:1,deposits:{wood:u.population*3,stone:u.population*8,ore:u.population*(i%3===0?2:.7)},buildings:{granary:{level:1,condition:1},workshop:{level:1,condition:1},mine:{level:1,condition:1}},projects:[],prices:{...emptyStock(),...Object.fromEntries(goods.map(g=>[g,goodsConfig[g].price]))},demand:emptyStock(),lastTaxNominal:0,lastTaxPaid:0,shortage:0,lastHarvest:0,lastBirths:0,lastDeaths:0,lastMigration:0,lastWorkers:0,lastConstruction:0,lastMilitary:0};
 }
 // Shared geographic edges, not list order, define the transport network.
 const edges=new Map<string,Set<string>>();
 for(const f of counties.features){const id=f.properties.unitId!;if(!sim.counties[id])continue;const g=f.geometry;if(g.type!=='Polygon'&&g.type!=='MultiPolygon')continue;for(const poly of g.type==='Polygon'?[g.coordinates]:g.coordinates)for(const r of poly)for(let i=1;i<r.length;i++){const k=[r[i-1]!.map(v=>v.toFixed(5)).join(','),r[i]!.map(v=>v.toFixed(5)).join(',')].sort().join('|');if(!edges.has(k))edges.set(k,new Set());edges.get(k)!.add(id);}}
 const pairs=new Set<string>();for(const ids of edges.values())for(const a of ids)for(const b of ids)if(a<b)pairs.add(`${a}|${b}`);
 const onRiver=new Set<string>();
 for(const f of rivers.features){if(!/huang|yellow/i.test(f.properties.name))continue;const g=f.geometry;if(g.type!=='LineString'&&g.type!=='MultiLineString')continue;for(const line of g.type==='LineString'?[g.coordinates]:g.coordinates)for(const p of line){const q=projectGeo(p);for(const u of leaves){const a=atlas.get(u.id);if(a?.shape.some(poly=>inside(q,poly[0]!)))onRiver.add(u.id);}}}
 for(const pair of [...pairs].sort()){const [a,b]=pair.split('|') as [string,string],pa=atlas.get(a),pb=atlas.get(b);if(!pa||!pb)continue;const km=Math.max(5,geoDistance(pa.coordinates,pb.coordinates)*6371.0088);sim.routes.push({id:`road:${pair}`,from:a,to:b,mode:'road',km,capacity:500,quality:.6,blocked:false,used:0,lastCapacity:0});if(onRiver.has(a)&&onRiver.has(b))sim.routes.push({id:`river:${pair}`,from:a,to:b,mode:'river',km:km*1.2,capacity:1600,quality:.7,blocked:false,used:0,lastCapacity:0});}
 s.simulation=sim;return s;
}
