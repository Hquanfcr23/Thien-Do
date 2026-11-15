import { describe,it,expect } from 'vitest';
import { createNewGame } from '../data/foundation';
import { emptyStock,goods,type Report } from '../domain/economy';
import { gameStateSchema } from '../domain/schema';
import { advanceMonth,queueOrder } from '../engine/month';
import { allocateLabour } from '../engine/population';
import { finance } from '../engine/finance';
import { construction } from '../engine/construction';
import { marketOrders } from '../engine/marketOrders';
import { autonomousConstruction,constructionPriorities } from '../engine/autonomousConstruction';
import { applyOversightOrder,finishOversight,recoverDebts } from '../engine/oversight';
import { finishCourt,governance,remember } from '../engine/court';
import { moneyTotal,goodsTotal,type MonthContext,type EconomicState } from '../engine/economyContext';
import { coreBuildingKinds } from '../data/economicConfig';
import { exportSave,importSave } from '../persistence/saves';

function context(seed=42):MonthContext{
 const s=createNewGame(seed) as EconomicState;
 const report:Report={...s.calendar,produced:emptyStock(),used:emptyStock(),destroyed:emptyStock(),goodsError:emptyStock(),population:0,births:0,deaths:0,migration:0,harvest:0,consumed:0,loss:0,tax:0,spending:0,treasury:0,grain:0,shortageCount:0,moneyError:0,grainError:0,notes:[]};
 return{s,units:new Map(s.administrativeUnits.map(u=>[u.id,u])),report,labour:new Map(),weather:new Map()};
}
function setup(ctx:MonthContext){const fu=Object.keys(ctx.s.simulation.prefectures)[0]!,f=ctx.s.simulation.prefectures[fu]!,subject=ctx.s.court!.offices.find(o=>o.unitId===fu)!.holderId!,investigator=Object.keys(ctx.s.court!.officers).find(id=>id!==subject)!;return{fu,f,subject,investigator};}
function focus(ctx:MonthContext,fu:string,kind='irrigation'){
 ctx.s.court!.constructionPolicies[fu]=Object.fromEntries(coreBuildingKinds.map(k=>[k,k===kind?'focus':'forbid']));
 const f=ctx.s.simulation.prefectures[fu]!;f.treasury=1e7;f.grainReserve=1e7;for(const g of goods)f.market.inventory[g]=1e7;
 for(const u of ctx.s.administrativeUnits.filter(u=>u.parentId===fu)){ctx.s.simulation.counties[u.id]!.buildings={};u.resources.grain=1e7;}
 allocateLabour(ctx);
}
describe('Phase 4.2 autonomous policy construction',()=>{
 it('pauses forbidden projects without reserving labour or buying materials, then resumes intact',()=>{
  const ctx=context(),{fu,f}=setup(ctx);focus(ctx,fu);const id=f.seatCountyId,c=ctx.s.simulation.counties[id]!;
  c.projects.push({building:'irrigation',work:0,required:1600,costScale:1,materials:emptyStock(),legacyFunded:false,pausedReason:null});
  ctx.s.court!.constructionPolicies[fu]!.irrigation='forbid';allocateLabour(ctx);const before=moneyTotal(ctx.s),inventory=structuredClone(f.market.inventory);
  construction(ctx);expect(c.projects[0]!.work).toBe(0);expect(c.projects[0]!.pausedReason).toContain('chính sách cấm');expect(c.lastConstruction).toBe(0);expect(f.market.inventory).toEqual(inventory);expect(moneyTotal(ctx.s)).toBeCloseTo(before,7);
  const withPaused=marketOrders(ctx).get(fu)!.buy;c.projects=[];expect(marketOrders(ctx).get(fu)!.buy).toEqual(withPaused);
  c.projects.push({building:'irrigation',work:0,required:1600,costScale:1,materials:emptyStock(),legacyFunded:false,pausedReason:null});ctx.s.court!.constructionPolicies[fu]!.irrigation='normal';allocateLabour(ctx);construction(ctx);expect(c.projects[0]!.work).toBeGreaterThan(0);
 });
 it('starts at most one focus project per Phủ when safe, with no creation of assets',()=>{
  const ctx=context(),{fu}=setup(ctx);focus(ctx,fu);const cash=moneyTotal(ctx.s),stock=goods.map(g=>goodsTotal(ctx.s,g));
  autonomousConstruction(ctx);expect(ctx.s.court!.decisions.filter(d=>d.prefectureId===fu&&d.started)).toHaveLength(1);
  expect(moneyTotal(ctx.s)).toBe(cash);expect(goods.map(g=>goodsTotal(ctx.s,g))).toEqual(stock);
  expect(ctx.s.court!.decisions.filter(d=>d.prefectureId===fu).every(d=>d.reviewTick===1&&d.reason.length>0)).toBe(true);
 });
 it('does not open another project while an active worksite lacks real funding',()=>{
  const ctx=context(),{fu,f}=setup(ctx);focus(ctx,fu);
  ctx.s.court!.constructionPolicies[fu]!.granary='normal';
  f.projects.push({building:'granary',work:100,required:1200,costScale:1,materials:emptyStock(),legacyFunded:false,pausedReason:'Ngân khố Phủ không đủ theo giá hiện tại'});
  autonomousConstruction(ctx);
  expect(ctx.s.court!.decisions.filter(d=>d.prefectureId===fu).every(d=>!d.started&&d.reason.includes('Công trường hiện có'))).toBe(true);
  expect(ctx.s.simulation.counties[f.seatCountyId]!.projects).toHaveLength(0);
  f.projects[0]!.pausedReason=null;autonomousConstruction(ctx);
  expect(ctx.s.court!.decisions.some(d=>d.prefectureId===fu&&d.started)).toBe(true);
 });
 it.each(['cash','materials','labour','reserve','vacancy','route','duplicate','max'] as const)('defers focus with an explicit reason for %s',block=>{
  const ctx=context(),{fu,f}=setup(ctx);focus(ctx,fu);
  const counties=ctx.s.administrativeUnits.filter(u=>u.parentId===fu);
  if(block==='cash')f.treasury=0;
  if(block==='materials')for(const g of goods)f.market.inventory[g]=0;
  if(block==='labour')for(const u of counties)ctx.labour.get(u.id)!.total=0;
  if(block==='reserve'){f.grainReserve=0;for(const u of counties)ctx.s.simulation.counties[u.id]!.shortage=.5;}
  if(block==='vacancy')ctx.s.court!.offices.find(o=>o.unitId===fu)!.holderId=null;
  if(block==='route'){for(const r of ctx.s.simulation.routes)r.blocked=true;ctx.s.simulation.counties[f.seatCountyId]!.buildings.irrigation={level:3,condition:1};}
  if(block==='duplicate')for(const u of counties)ctx.s.simulation.counties[u.id]!.projects.push({building:'irrigation',work:0,required:100,materials:emptyStock(),legacyFunded:false,pausedReason:null});
  if(block==='max')for(const u of counties)ctx.s.simulation.counties[u.id]!.buildings.irrigation={level:3,condition:1};
  autonomousConstruction(ctx);const decisions=ctx.s.court!.decisions.filter(d=>d.prefectureId===fu);expect(decisions.length).toBeGreaterThan(0);expect(decisions.every(d=>!d.started&&d.reason.length>0)).toBe(true);
 });
 it('inherits priorities, preserves overrides and honours forbids',()=>{
  let s=createNewGame();const fu=s.administrativeUnits.find(u=>u.levelId==='fu')!,zhou=fu.parentId!;
  s=advanceMonth(queueOrder(s,{kind:'construction-policy',unitId:zhou,priorities:{irrigation:'focus'}}));expect(constructionPriorities(s,fu.id).irrigation).toBe('focus');
  s=advanceMonth(queueOrder(s,{kind:'construction-policy',unitId:fu.id,priorities:{irrigation:'forbid'}}));
  s=advanceMonth(queueOrder(s,{kind:'construction-policy',unitId:zhou,priorities:{irrigation:'low'}}));expect(constructionPriorities(s,fu.id).irrigation).toBe('forbid');
  s=advanceMonth(queueOrder(s,{kind:'construction-policy',unitId:fu.id,priorities:null}));expect(constructionPriorities(s,fu.id).irrigation).toBe('low');
 });
});
describe('Phase 4.3–4.5 relationships, factions and oversight',()=>{
 it('keeps directed trust, lasting grudges and causal monthly faction reactions',()=>{
  const ctx=context(),{subject,investigator,fu}=setup(ctx),before=governance(ctx.s,fu);
  const boss=ctx.s.court!.offices.find(o=>o.unitId===ctx.units.get(fu)!.parentId)!.holderId!;
  remember(ctx.s,subject,boss,'Hợp tác cứu trợ',30);expect(governance(ctx.s,fu)).toBeGreaterThan(before);expect(ctx.s.court!.relations.some(r=>r.from===boss&&r.to===subject)).toBe(false);
  remember(ctx.s,subject,investigator,'Án oan',-30,'grudge');ctx.s.simulation.tick++;finishCourt(ctx);
  expect(ctx.s.court!.relations.find(r=>r.from===subject&&r.to===investigator)!.trust).toBe(50);
  expect(ctx.s.court!.factions.every(f=>f.lastReason.includes('kỳ sau'))).toBe(true);expect(gameStateSchema.safeParse(ctx.s).success).toBe(true);
 });
 it('moves actual administration funds into salary and stolen purses without losing money',()=>{
  const ctx=context(),{fu,f,subject}=setup(ctx);f.treasury=100000;f.fiscalPolicy.cashBufferMonths=0;
  const before=moneyTotal(ctx.s);finance(ctx);const o=ctx.s.court!.officers[subject]!;
  expect(o.assets).toBeGreaterThan(0);expect(o.privateMoney).toBeGreaterThan(0);expect(o.unassessed[fu]).toBeCloseTo(o.assets,8);expect(moneyTotal(ctx.s)).toBeCloseTo(before,7);
  expect(f.serviceLevel).toBeLessThan(1);expect(importSave(exportSave(ctx.s))).toEqual(ctx.s);
 });
 it('charges real cost, enforces a three-month investigation and never applies the result twice',()=>{
  const ctx=context(),{fu,f,subject,investigator}=setup(ctx);f.treasury=1e6;ctx.s.court!.officers[subject]!.unassessed[fu]=100;
  const before=moneyTotal(ctx.s),cash=f.treasury;applyOversightOrder(ctx,{kind:'inspect',prefectureId:fu,investigatorId:investigator,mode:'investigation'});
  expect(f.treasury).toBe(cash-7.5);expect(moneyTotal(ctx.s)).toBeCloseTo(before,7);finishOversight(ctx);expect(ctx.s.court!.cases[0]!.status).toBe('pending');
  ctx.s=importSave(exportSave(ctx.s)) as EconomicState;ctx.units=new Map(ctx.s.administrativeUnits.map(u=>[u.id,u]));ctx.s.simulation.tick=2;finishOversight(ctx);expect(ctx.s.court!.cases[0]!.status).not.toBe('pending');const result=structuredClone(ctx.s.court!.cases[0]);finishOversight(ctx);expect(ctx.s.court!.cases[0]).toEqual(result);
 });
 it('rejects self-investigation and unaffordable costs before mutating state',()=>{
  const ctx=context(),{fu,f,subject,investigator}=setup(ctx);f.treasury=1;const before=structuredClone(ctx.s);
  expect(()=>applyOversightOrder(ctx,{kind:'inspect',prefectureId:fu,investigatorId:subject,mode:'audit'})).toThrow();expect(()=>applyOversightOrder(ctx,{kind:'inspect',prefectureId:fu,investigatorId:investigator,mode:'audit'})).toThrow();expect(ctx.s).toEqual(before);
 });
 it.each(['recover','dismiss','imprison','exile','execute'] as const)('implements %s with full restitution debt and real estate buyers',sentence=>{
  const ctx=context(),{fu,subject,investigator}=setup(ctx),o=ctx.s.court!.officers[subject]!;
  o.unassessed[fu]=1000;o.assets=100;o.privateMoney=200;const county=ctx.s.simulation.prefectures[fu]!.seatCountyId;
  ctx.s.court!.estates.push({id:'estate-test',characterId:subject,countyId:county,value:500,confiscatedBy:null});ctx.s.simulation.counties[county]!.privateMoney=0;
  const c={id:'test',prefectureId:fu,subjectId:subject,investigatorId:investigator,mode:'investigation' as const,started:0,due:0,cost:0,status:'concluded' as const,evidence:85,alleged:true,falseFinding:false,recoverable:1000,outcome:'Chứng cứ'};ctx.s.court!.cases.push(c);
  const before=moneyTotal(ctx.s),treasury=ctx.s.simulation.prefectures[fu]!.treasury;applyOversightOrder(ctx,{kind:'resolve-case',caseId:'test',action:'trial',sentence});recoverDebts(ctx);
  expect(o.debts[fu]).toBe(700);expect(ctx.s.simulation.prefectures[fu]!.treasury).toBe(treasury+300);expect(moneyTotal(ctx.s)).toBeCloseTo(before,7);
  ctx.s.simulation.counties[county]!.privateMoney=10000;const withBuyer=moneyTotal(ctx.s);recoverDebts(ctx);expect(o.debts[fu]).toBe(200);expect(moneyTotal(ctx.s)).toBeCloseTo(withBuyer,7);
  expect(()=>applyOversightOrder(ctx,{kind:'resolve-case',caseId:'test',action:'trial',sentence})).toThrow();
  expect(o.status).toBe(sentence==='imprison'?'imprisoned':sentence==='exile'?'exiled':sentence==='execute'?'dead':'free');
  if(sentence==='imprison'||sentence==='exile'){applyOversightOrder(ctx,{kind:'pardon',characterId:subject});expect(o.status).toBe('free');expect(ctx.s.court!.offices.some(x=>x.holderId===subject)).toBe(false);}
 });
 it('holds the investigator responsible for wrongful conviction and preserves imperial prestige and victim assets',()=>{
  const ctx=context(),{fu,subject,investigator}=setup(ctx),emperor=ctx.s.characters.find(c=>c.id===ctx.s.dynasty.emperorId)!,officer=ctx.s.characters.find(c=>c.id===investigator)!;
  const before=emperor.prestige,prestige=officer.prestige;ctx.s.court!.officers[subject]!.privateMoney=200;
  ctx.s.court!.cases.push({id:'false',prefectureId:fu,subjectId:subject,investigatorId:investigator,mode:'investigation',started:0,due:0,cost:0,status:'concluded',evidence:85,alleged:true,falseFinding:true,recoverable:0,outcome:'Kết luận sai'});
  applyOversightOrder(ctx,{kind:'resolve-case',caseId:'false',action:'trial',sentence:'execute'});expect(emperor.prestige).toBe(before);expect(officer.prestige).toBe(prestige-15);expect(ctx.s.court!.officers[subject]!.privateMoney).toBe(200);expect(ctx.s.court!.officers[subject]!.status).toBe('free');expect(ctx.s.court!.offices.some(o=>o.holderId===investigator)).toBe(false);
 });
 it('replaces only retiring county officials at year end and keeps names across reload',()=>{
  const ctx=context(),locals=ctx.s.court!.countyOfficials,[id,old]=Object.entries(locals)[0]!;old.age=old.retirementAge-1;ctx.s.calendar.month=12;finishCourt(ctx);expect(locals[id]!.id).not.toBe(old.id);expect(locals[id]!.generation).toBe(old.generation+1);expect(importSave(exportSave(ctx.s)).court!.countyOfficials).toEqual(locals);
 });
});
