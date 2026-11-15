import { initializeCourt } from '../data/courtFoundation';
import { gameStateSchema as v6StateSchema } from '../domain/schemaV6';
import {migrateBuildingRules} from '../data/buildingMigration';
import { initializeEconomy } from '../data/economyFoundation';
import { openDB, type DBSchema } from 'idb';
import { z } from 'zod';
import { gameStateSchema, type GameState } from '../domain/schema';
import { gameStateSchema as oldStateSchema } from '../domain/schemaV4';
import { initializeEconomy as initializeOld } from '../data/legacyEconomyFoundation';
import { upgradeEconomy } from '../data/upgradeEconomy';
import { gameStateSchema as v5StateSchema } from '../domain/schemaV5';
import { defaultFiscalPolicy,emptyAccounts,defaultCentral } from '../domain/economy';
import { migrateV1, migrateV3 } from './migrations';
import { renameAllCharacters } from '../data/personNames';

export const saveSchema = z.object({ schemaVersion: z.literal(9), campaignVersion: z.literal('0.2.0'), timestamp: z.string().datetime(), state: gameStateSchema.refine(s=>s.simulation!==undefined&&s.court?.centralOffices!==undefined,'Save v9 cần mô phỏng và ghế triều đình') }).strict();
export type Save = z.infer<typeof saveSchema>;
export const slots = ['manual-1', 'manual-2', 'manual-3', 'autosave'] as const;
export type Slot = typeof slots[number];
interface SaveDB extends DBSchema { saves: { key: Slot; value: Save } }
const connect = () => openDB<SaveDB>('de-nghiep', 1, { upgrade(db) { db.createObjectStore('saves'); } });
function normalizeSave(value:unknown):Save{const save=saveSchema.parse(value);save.state=initializeCourt(migrateBuildingRules(save.state));return save;}
function migrateCourtSave(value:{campaignVersion:'0.2.0';timestamp:string;state:unknown}):Save{const state=initializeCourt(gameStateSchema.parse(value.state));renameAllCharacters(state);return normalizeSave({...value,schemaVersion:9,state});}
export function decodeSave(value: unknown): Save {
  // Version gate. Add explicit vN -> vN+1 migrations here when a legacy schema exists.
  const version = z.object({ schemaVersion: z.number() }).parse(value).schemaVersion;
  if(version>=1&&version<=4){
   let old;
   if(version===1){const v2=migrateV1(value),initialized=initializeOld(v2.state);for(const c of Object.values(initialized.simulation!.counties))c.privateMoney=0;old=migrateV3({...v2,schemaVersion:3,state:initialized});}
   else if(version===2){const v2=z.object({schemaVersion:z.literal(2),campaignVersion:z.literal('0.2.0'),timestamp:z.string().datetime(),state:oldStateSchema}).strict().parse(value);const initialized=initializeOld(v2.state);for(const c of Object.values(initialized.simulation!.counties))c.privateMoney=0;old=migrateV3({...v2,schemaVersion:3,state:initialized});}
   else if(version===3)old=migrateV3(value);
   else old=z.object({schemaVersion:z.literal(4),campaignVersion:z.literal('0.2.0'),timestamp:z.string().datetime(),state:oldStateSchema.refine(s=>s.simulation!==undefined,'Save v4 cần mô phỏng')}).strict().parse(value);
   return migrateCourtSave({...old,state:upgradeEconomy(initializeOld(old.state))});
  }
  if(version===5){const old=z.object({schemaVersion:z.literal(5),campaignVersion:z.literal('0.2.0'),timestamp:z.string().datetime(),state:v5StateSchema.refine(s=>s.simulation!==undefined)}).strict().parse(value);const state=old.state;const sim=state.simulation!;return migrateCourtSave({...old,state:{...state,simulation:{...sim,revision:3,central:defaultCentral(),prefectures:Object.fromEntries(Object.entries(sim.prefectures).map(([id,f])=>[id,{...f,fiscalPolicy:defaultFiscalPolicy(),accounts:emptyAccounts(),serviceLevel:1}]))}}});}
  if(version===6){const old=z.object({schemaVersion:z.literal(6),campaignVersion:z.literal('0.2.0'),timestamp:z.string().datetime(),state:v6StateSchema.refine(s=>s.simulation!==undefined)}).strict().parse(value);return migrateCourtSave({...old,state:old.state});}
  if(version===7){const old=z.object({schemaVersion:z.literal(7),campaignVersion:z.literal('0.2.0'),timestamp:z.string().datetime(),state:gameStateSchema}).strict().parse(value);return migrateCourtSave(old);}
  if(version===8){const old=z.object({schemaVersion:z.literal(8),campaignVersion:z.literal('0.2.0'),timestamp:z.string().datetime(),state:gameStateSchema}).strict().parse(value);renameAllCharacters(old.state);return normalizeSave({...old,schemaVersion:9});}
  if(version!==9)throw new Error(`Phiên bản save ${version} chưa được hỗ trợ. Bản gốc được giữ nguyên.`);
  const parsed=normalizeSave(value);
  if(parsed.state.simulation&&!parsed.state.simulation.central)parsed.state.simulation.central=defaultCentral();
  return parsed;
}
export function makeSave(state: GameState): Save {
  return normalizeSave({ schemaVersion: 9, campaignVersion: state.campaignVersion, timestamp: new Date().toISOString(), state:initializeCourt(initializeEconomy(gameStateSchema.parse(state))) });
}
export async function writeSave(slot: Slot, state: GameState): Promise<void> {
  const save = makeSave(state);
  const db = await connect();
  try { const tx=db.transaction('saves','readwrite');await tx.store.put(save,slot);await tx.done; } finally { db.close(); }
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
