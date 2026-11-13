import { openDB, type DBSchema } from 'idb';
import { z } from 'zod';
import { gameStateSchema, type GameState } from '../domain/schema';
import { migrateV1 } from './migrations';

export const saveSchema = z.object({ schemaVersion: z.literal(2), campaignVersion: z.literal('0.2.0'), timestamp: z.string().datetime(), state: gameStateSchema }).strict();
export type Save = z.infer<typeof saveSchema>;
export const slots = ['manual-1', 'manual-2', 'manual-3', 'autosave'] as const;
export type Slot = typeof slots[number];
interface SaveDB extends DBSchema { saves: { key: Slot; value: Save } }
const connect = () => openDB<SaveDB>('de-nghiep', 1, { upgrade(db) { db.createObjectStore('saves'); } });
export function decodeSave(value: unknown): Save {
  // Version gate. Add explicit vN -> vN+1 migrations here when a legacy schema exists.
  const version = z.object({ schemaVersion: z.number() }).parse(value).schemaVersion;
  if (version === 1) return saveSchema.parse(migrateV1(value));
  if (version !== 2) throw new Error(`Phiên bản save ${version} chưa được hỗ trợ. Bản gốc được giữ nguyên.`);
  return saveSchema.parse(value);
}
export function makeSave(state: GameState): Save {
  return saveSchema.parse({ schemaVersion: 2, campaignVersion: state.campaignVersion, timestamp: new Date().toISOString(), state });
}
export async function writeSave(slot: Slot, state: GameState): Promise<void> {
  const save = makeSave(state);
  const db = await connect();
  try { await db.put('saves', save, slot); } finally { db.close(); }
}
export async function readSave(slot: Slot): Promise<Save | undefined> {
  const db = await connect();
  try { const value: unknown = await db.get('saves', slot); return value === undefined ? undefined : decodeSave(value); } finally { db.close(); }
}
// A corrupt slot must not prevent access to other valid saves.
export async function latestSave(): Promise<{ save: Save | undefined; rejectedSlots: Slot[] }> {
  const results = await Promise.allSettled(slots.map(readSave));
  const valid: Save[] = [];
  const rejectedSlots: Slot[] = [];
  results.forEach((result, index) => {
    if (result.status === 'rejected') rejectedSlots.push(slots[index]!);
    else if (result.value) valid.push(result.value);
  });
  valid.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  return { save: valid[0], rejectedSlots };
}
export const exportSave = (state: GameState) => JSON.stringify(makeSave(state), null, 2);
export const importSave = (json: string) => decodeSave(JSON.parse(json) as unknown).state;
