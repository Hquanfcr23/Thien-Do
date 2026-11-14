import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { createNewGame } from '../data/foundation';
import { gameStateSchema, provenanceSchema } from '../domain/schema';
import { nextMonth, seasonOf } from '../engine/calendar';
import { childrenOf, totalPopulation } from '../engine/selectors';
import { decodeSave, exportSave, importSave, makeSave, readSave, writeSave } from '../persistence/saves';
import { useGameStore } from '../state/gameStore';

describe('calendar primitives', () => {
  it('maps all twelve months to four seasons', () => {
    expect(Array.from({ length: 12 }, (_, i) => seasonOf(i + 1))).toEqual(['Xuân','Xuân','Xuân','Hạ','Hạ','Hạ','Thu','Thu','Thu','Đông','Đông','Đông']);
  });
  it('advances twelve months with one year rollover without mutation', () => {
    const start = { year: 1, month: 1 }; let date = start;
    for (let i = 0; i < 12; i++) date = nextMonth(date);
    expect(date).toEqual({ year: 2, month: 1 }); expect(start.month).toBe(1);
  });
  it.each([0, 13, 1.5, NaN])('rejects invalid month %s', month => expect(() => seasonOf(month)).toThrow());
});
describe('domain invariants', () => {
  it('creates independent, deterministic fictional states', () => {
    const a = createNewGame(); const b = createNewGame(); expect(a).toEqual(b);
    a.country.treasury = 0; expect(b.country.treasury).toBe(6000);
    expect(b.characters[0]?.provenance.kind).toBe('Fictional');
  });
  it('rejects broken dynasty references and duplicated entity IDs', () => {
    const a = createNewGame(); a.dynasty.emperorId = 'missing'; expect(gameStateSchema.safeParse(a).success).toBe(false);
    const b = createNewGame(); b.characters.push({ ...b.characters[0]! }); expect(gameStateSchema.safeParse(b).success).toBe(false);
  });
  it('rejects invalid parent levels, cycles and ancestor population', () => {
    const a = createNewGame(); a.administrativeUnits[0]!.parentId = 'capital'; expect(gameStateSchema.safeParse(a).success).toBe(false);
    a.administrativeUnits[0]!.parentId = null; a.administrativeUnits[0]!.population = 2; expect(gameStateSchema.safeParse(a).success).toBe(false);
  });
  it('supports another profile and aggregates only leaf populations', () => {
    const a = createNewGame(); delete a.simulation; a.administrativeUnits = [a.administrativeUnits[0]!]; a.geography = { cities: [], roads: [] }; a.administrativeProfile.levels = [{ id: 'central', name: 'Triều đình', officeTitle: 'Đế' }, { id: 'district', name: 'Huyện', officeTitle: 'Lệnh' }];
    a.administrativeUnits.push({ ...a.administrativeUnits[0]!, id: 'leaf', parentId: 'capital', levelId: 'district', locationId: 'leaf-location', population: 120, bounds: {x:0,y:0,w:1,h:1} });
    expect(gameStateSchema.safeParse(a).success).toBe(true); expect(totalPopulation(a)).toBe(120); expect(childrenOf(a, 'capital')).toHaveLength(1);
  });
  it('requires historical period and sources for attested content', () => expect(provenanceSchema.safeParse({ kind: 'HistoricalAttested', period: 'Tang', sources: [] }).success).toBe(false));
  it('store validates before replacing active state', () => {
    const a = createNewGame(); useGameStore.getState().replaceGame(a);
    const invalid = { ...a, calendar: { year: 1, month: 13 } };
    expect(() => useGameStore.getState().replaceGame(invalid)).toThrow(); expect(useGameStore.getState().game).toEqual(a);
  });
});
describe('save boundary and IndexedDB', () => {
  it('JSON roundtrip retains all foundation state', () => expect(importSave(exportSave(createNewGame()))).toEqual(createNewGame()));
  it('rejects corruption and future versions', () => {
    const save = makeSave(createNewGame()); expect(() => decodeSave({ ...save, schemaVersion: 99 })).toThrow('chưa được hỗ trợ');
    expect(() => importSave('{')).toThrow(); expect(() => decodeSave({ ...save, state: {} })).toThrow();
  });
  it('persists independent slots across reopened connections', async () => {
    const a = createNewGame(); const b = createNewGame(99); b.country.treasury = 5;
    await writeSave('manual-1', a); await writeSave('manual-2', b); await writeSave('autosave', a);
    expect((await readSave('manual-1'))?.state).toEqual(a); expect((await readSave('manual-2'))?.state).toEqual(b); expect((await readSave('autosave'))?.state).toEqual(a);
    expect(await readSave('manual-3')).toBeUndefined();
  });
  it('invalid write preserves previous save', async () => {
    const a = createNewGame(); await writeSave('manual-1', a); a.country.treasury = -1;
    await expect(writeSave('manual-1', a)).rejects.toThrow(); expect((await readSave('manual-1'))?.state.country.treasury).toBe(6000);
  });
});



