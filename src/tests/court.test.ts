import { describe,it,expect } from 'vitest';
import { createNewGame } from '../data/foundation';
import { advanceMonth,queueOrder } from '../engine/month';
import { advanceDecisionTurn } from '../engine/decisionTurn';
import { effectivePolicy,zhouPolicyStatus } from '../engine/policies';
import { governance,remember } from '../engine/court';
import { gameStateSchema } from '../domain/schema';
import { decodeSave,exportSave,importSave } from '../persistence/saves';
import { moneyTotal,goodsTotal,type EconomicState } from '../engine/economyContext';
import { goods } from '../domain/economy';
import fixture from './fixtures/phase3-v6.json';

describe('Phase 4.1 offices and political state',()=>{
 it('creates the approved roster deterministically with minimal stable county officials',()=>{
  const s=createNewGame(41),c=s.court!;expect(s).toEqual(createNewGame(41));
  expect(Object.keys(c.officers)).toHaveLength(c.offices.length+Math.max(2,Math.ceil(c.offices.length*.25))+8);
  expect(c.factions).toHaveLength(3);expect(Object.keys(c.countyOfficials)).toHaveLength(Object.keys(s.simulation!.counties).length);
  const copy=importSave(exportSave(s));expect(copy.court).toEqual(c);
  for(const local of Object.values(c.countyOfficials))expect(local).not.toHaveProperty('ability');
 });
 it('applies local and central appointments after one decision turn without duplicate full-time offices',()=>{
  const s=createNewGame(),before=structuredClone(s),[source,destination]=s.court!.offices;
  const queued=queueOrder(s,{kind:'appoint',unitId:destination!.unitId,characterId:source!.holderId});
  const mid=advanceDecisionTurn(queued);expect(mid.decisionTurn).toBe('mid');expect(mid.court!.offices.find(o=>o.unitId===destination!.unitId)!.holderId).toBe(source!.holderId);expect(mid.court!.offices.find(o=>o.unitId===source!.unitId)!.holderId).toBeNull();
  const applicant=Object.keys(s.court!.officers).find(id=>!s.court!.offices.some(o=>o.holderId===id)&&!s.court!.centralOffices!.some(o=>o.holderId===id))!;
  const formerChief=s.court!.centralOffices!.find(o=>o.seat==='chief')!.holderId!,central=advanceDecisionTurn(queueOrder(s,{kind:'central-appoint',seat:'chief',characterId:applicant}));expect(central.court!.centralOffices!.find(o=>o.seat==='chief')!.holderId).toBe(applicant);
  const relation=(state:typeof s,id:string)=>state.court!.relations.find(r=>r.from===id&&r.to===state.dynasty.emperorId)?.trust??50;
  expect(relation(central,formerChief)).toBe(relation(s,formerChief)-8);expect(relation(central,applicant)).toBe(relation(s,applicant)+5);
  const legacy=advanceMonth(queueOrder(s,{kind:'appoint',unitId:destination!.unitId,characterId:source!.holderId}));expect(legacy.court!.offices.find(o=>o.unitId===destination!.unitId)!.pending).not.toBeNull();const settled=advanceDecisionTurn(legacy);expect(settled.court!.offices.find(o=>o.unitId===destination!.unitId)!.holderId).toBe(source!.holderId);
  expect(gameStateSchema.safeParse(mid).success).toBe(true);expect(gameStateSchema.safeParse(central).success).toBe(true);expect(s).toEqual(before);
 });
 it('rejects invalid/duplicate appointments and malformed references',()=>{
  const s=createNewGame(),[a,b]=s.court!.offices,candidate=Object.keys(s.court!.officers).find(id=>!s.court!.offices.some(o=>o.holderId===id))!;
  const next=advanceMonth(queueOrder(queueOrder(s,{kind:'appoint',unitId:a!.unitId,characterId:candidate}),{kind:'appoint',unitId:b!.unitId,characterId:candidate}));
  expect(next.simulation!.lastMessages.some(m=>m.includes('đang chuyển giao'))).toBe(true);
  const broken=structuredClone(s);broken.court!.offices[1]!.holderId=a!.holderId;expect(gameStateSchema.safeParse(broken).success).toBe(false);
 });
 it('uses role stats, directed trust and faction support in actual fiscal delivery',()=>{
  const s=createNewGame(),o=s.court!.offices.find(o=>s.simulation!.prefectures[o.unitId])!,c=s.characters.find(c=>c.id===o.holderId)!;
  const low=governance(s,o.unitId);c.ability=100;s.court!.officers[c.id]!.finance=100;s.court!.officers[c.id]!.communication=100;c.health=100;c.loyalty=100;expect(governance(s,o.unitId)).toBeGreaterThan(low);
  const boss=s.court!.offices.find(x=>x.unitId===s.administrativeUnits.find(u=>u.id===o.unitId)!.parentId)!.holderId!;
  remember(s,c.id,boss,'Phối hợp cấp lương',10);expect(s.court!.relations.find(r=>r.from===boss&&r.to===c.id)).toBeUndefined();
  expect(importSave(exportSave(s)).court!.relations).toEqual(s.court!.relations);
 });
});
describe('Châu defaults and Phủ overrides',()=>{
 it('preserves independent overrides, derives mixed from effective values and restores inheritance',()=>{
  let s=createNewGame();const z=s.administrativeUnits.find(u=>u.levelId==='zhou'&&s.administrativeUnits.filter(f=>f.parentId===u.id).length>1)!,fu=s.administrativeUnits.find(u=>u.parentId===z.id)!;
  s=advanceMonth(queueOrder(s,{kind:'prefecture-policy',prefectureId:fu.id,policy:{...s.simulation!.policy,landTax:.3}}));
  expect(zhouPolicyStatus(s,z.id).mixed).toBe(true);
  s=advanceMonth(queueOrder(s,{kind:'policy',zhouId:z.id,policy:{...s.simulation!.policy,landTax:.2}}));expect(effectivePolicy(s,fu.id).landTax).toBe(.3);
  s=advanceMonth(queueOrder(s,{kind:'prefecture-policy',prefectureId:fu.id,policy:null}));expect(effectivePolicy(s,fu.id).landTax).toBe(.2);expect(zhouPolicyStatus(s,z.id).mixed).toBe(false);
  expect(importSave(exportSave(s))).toEqual(s);
 });
 it('migrates v6 without changing assets, calendar, RNG, existing policies or the original file',()=>{
  const original=JSON.stringify(fixture),s=decodeSave(fixture).state as EconomicState;
  expect(decodeSave(fixture).schemaVersion).toBe(9);expect(s.simulation.prefecturePolicies).toEqual({});expect(s.simulation.zhouPolicies).toEqual(fixture.state.simulation.zhouPolicies);
  expect(s.calendar).toEqual(fixture.state.calendar);expect(s.simulation.rng).toBe(fixture.state.simulation.rng);
  const old=fixture.state as unknown as EconomicState;expect(moneyTotal(s)).toBeCloseTo(moneyTotal(old),7);for(const g of goods)expect(goodsTotal(s,g)).toBeCloseTo(goodsTotal(old,g),7);
  expect(Object.values(s.court!.officers).every(o=>o.assets===0)).toBe(true);expect(JSON.stringify(fixture)).toBe(original);const broken=JSON.parse(exportSave(s)) as {state:Record<string,unknown>};delete broken.state.court;expect(()=>decodeSave(broken)).toThrow();
 });
});

