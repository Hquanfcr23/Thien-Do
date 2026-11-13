import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { describe, expect, it } from 'vitest';
import { createNewGame } from '../data/foundation';
import { latestSave, makeSave, readSave, writeSave } from '../persistence/saves';

describe('save recovery', () => {
  it('finds the actual newest instant and skips corrupt slots without modifying them', async () => {
    await writeSave('manual-1', createNewGame());
    const db = await openDB('de-nghiep');
    const older = { ...makeSave(createNewGame(1)), timestamp: '2026-11-12T05:00:00Z' };
    const newer = { ...makeSave(createNewGame(2)), timestamp: '2026-11-12T06:00:00Z' };
    const corrupt = { schemaVersion: 99, payload: 'retain original' };
    await db.put('saves', older, 'manual-1'); await db.put('saves', newer, 'manual-2');
    await db.put('saves', corrupt, 'manual-3'); await db.delete('saves', 'autosave');
    const result = await latestSave();
    expect(result.save?.state.seed).toBe(2); expect(result.rejectedSlots).toEqual(['manual-3']);
    await expect(readSave('manual-3')).rejects.toThrow();
    expect(await db.get('saves', 'manual-3')).toEqual(corrupt);
    db.close();
  });
  it('returns no save and identifies unreadable slots when none is valid', async () => {
    await writeSave('manual-1', createNewGame()); const db=await openDB('de-nghiep');
    for (const slot of ['manual-1','manual-2','manual-3','autosave']) await db.put('saves', {}, slot);
    const result=await latestSave(); expect(result.save).toBeUndefined(); expect(result.rejectedSlots).toHaveLength(4); db.close();
  });
});

