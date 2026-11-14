import {describe,it,expect} from 'vitest';
import {canonicalOrder,economicText,goodsPrice,goodsAmount,silverAmount,grainAmount,moneyNumber} from '../domain/economicUnits';
import {createNewGame} from '../data/foundation';
import {buildings} from '../data/economicConfig';
import {advanceMonth,queueOrder} from '../engine/month';
import {exportSave,importSave} from '../persistence/saves';
import {moneyTotal,grainTotal,type EconomicState} from '../engine/economyContext';
describe('Ming inspired unit calibration without extra purchasing power',()=>{
 it('anchors consumption and grain prices and preserves a purchase invoice',()=>{
  expect(grainAmount(.025)).toBe(.4);expect(goodsPrice(1,'grain')).toBe(.5);
  for(const good of ['grain','wood','tools'] as const){const amount=23.25,price=1.75;expect(goodsAmount(amount,good)*goodsPrice(price,good)).toBeCloseTo(silverAmount(amount*price),10);}
  expect(silverAmount(6000)/silverAmount(180)).toBeCloseTo(6000/180);
  expect(grainAmount(6000)/grainAmount(12500)).toBeCloseTo(6000/12500);
 });
 it('converts every amount-bearing command exactly once and leaves policies and counts intact',()=>{
  expect(canonicalOrder({kind:'budget-transfer',from:'central',to:'fu',amount:800})).toMatchObject({amount:100});
  for(const kind of ['sell-grain','buy-grain','withdraw-grain'] as const)expect(canonicalOrder({kind,prefectureId:'fu',amount:1600})).toMatchObject({amount:100});
  expect(canonicalOrder({kind:'reserve-transfer',from:'central',to:'fu',amount:1600})).toMatchObject({amount:100});
  expect(canonicalOrder({kind:'relief',countyId:'xian',amount:1600})).toMatchObject({amount:100});
  expect(canonicalOrder({kind:'grant',countyId:'xian',amount:800})).toMatchObject({amount:100});
  expect(canonicalOrder({kind:'transfer',from:'a',to:'b',good:'grain',amount:1600})).toMatchObject({amount:100});
  expect(canonicalOrder({kind:'transfer',from:'a',to:'b',good:'wood',amount:100})).toMatchObject({amount:100});
  const policy={cashRemitRate:.15,grainRemitRate:.1,aidSilverLimit:800,aidGrainLimit:1600,cashFloor:8000,grainFloor:16000};
  expect(canonicalOrder({kind:'central-policy',policy})).toMatchObject({policy:{cashRemitRate:.15,grainRemitRate:.1,aidSilverLimit:100,aidGrainLimit:100,cashFloor:1000,grainFloor:1000}});
  expect(policy.cashFloor).toBe(8000);
 });
 it('provides engine-matched numeric explanations for every building',()=>{
  expect(Object.keys(buildings)).toHaveLength(14);
  for(const b of Object.values(buildings))expect(b.details.length).toBeGreaterThan(0);
  expect(buildings.mine.details[0]).toContain('12 đơn vị gỗ và đá');
  expect(buildings.administration.details[0]).toContain('+5/+9/+12 điểm phần trăm');
 });
 it('renders old narrative notes once, including grouped amounts',()=>{
  expect(economicText('nhận 10.0, chi 2.0 lượng; nhập 3.0, xuất 1.0, hao 0.5 thạch.')).toBe('nhận 80, chi 16 lượng; nhập 48, xuất 16, hao 8 thạch lương.');
 });
 it('rounds all displayed silver amounts to whole taels while preserving precise internal values',()=>{
  expect(moneyNumber(1.06)).toBe('8');
  expect(moneyNumber(1.07)).toBe('9');
  expect(silverAmount(1.07)).toBeCloseTo(8.56,8);
 });
 it.each([42,1701,99])('retains exact gameplay, queued orders and saved purchasing power over 12 months (seed %s)',seed=>{
  let baseline=createNewGame(seed);const fu=Object.keys(baseline.simulation!.prefectures)[0]!;
  baseline=queueOrder(baseline,{kind:'budget-transfer',from:'central',to:fu,amount:100});
  let converted=queueOrder(createNewGame(seed),canonicalOrder({kind:'budget-transfer',from:'central',to:fu,amount:800}));
  expect(converted).toEqual(baseline);expect(importSave(exportSave(converted))).toEqual(baseline);
  for(let m=0;m<12;m++){
   baseline=advanceMonth(baseline);converted=advanceMonth(importSave(exportSave(converted)));
   expect(converted).toEqual(baseline);
   const r=converted.simulation!.reports.at(-1)!;
   expect(Math.abs(r.moneyError)*8).toBeLessThan(1e-5);expect(Math.abs(r.grainError)*16).toBeLessThan(1e-5);
   expect(silverAmount(moneyTotal(converted as EconomicState))).toBeCloseTo(silverAmount(moneyTotal(baseline as EconomicState)),8);
   expect(grainAmount(grainTotal(converted as EconomicState))).toBeCloseTo(grainAmount(grainTotal(baseline as EconomicState)),8);
  }
 });
});
