import { z } from 'zod';

const id = z.string().min(1);
const amount = z.number().finite().nonnegative();
const score = z.number().finite().min(0).max(100);
export const calendarSchema = z.object({ year: z.number().int().min(1), month: z.number().int().min(1).max(12) }).strict();
export const provenanceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('Fictional'), note: z.string() }).strict(),
  z.object({ kind: z.literal('HistoricalInspired'), note: z.string(), period: id }).strict(),
  z.object({ kind: z.literal('HistoricalAttested'), period: id, sources: z.array(z.string().url()).min(1) }).strict(),
  z.object({ kind: z.literal('Unverified'), note: z.string() }).strict(),
]);
export const administrativeProfileSchema = z.object({ id, levels: z.array(z.object({ id, name: id, officeTitle: id }).strict()).min(1) }).strict();
export const administrativeUnitSchema = z.object({
  id, name: id, levelId: id, parentId: id.nullable(), governorId: id.nullable(), locationId: id,
  treasury: amount, stability: score, development: score,
  // Population and goods belong to leaf units only; ancestors aggregate on demand.
  population: z.number().int().nonnegative(), resources: z.record(id, amount),
}).strict();
export const characterSchema = z.object({ id, name: id, age: amount, health: score, ability: score, loyalty: score, ambition: score, corruption: score, prestige: score, factionId: id.nullable(), provenance: provenanceSchema }).strict();
export const militaryUnitSchema = z.object({
  id, displayName: id, formalName: id,
  forceCategory: z.enum(['CentralStanding', 'ImperialGuard', 'LocalGarrison', 'Frontier', 'Militia', 'Expeditionary', 'Naval']),
  roleTags: z.array(z.enum(['PalaceGuard', 'CapitalDefense', 'BorderDefense', 'ShockCavalry', 'Siege', 'Escort'])),
  branches: z.array(z.object({ kind: z.enum(['infantry', 'lightCavalry', 'heavyCavalry', 'archers', 'crossbow', 'engineers', 'navy']), strength: z.number().int().nonnegative() }).strict()),
  commanderId: id.nullable(), locationId: id, quality: score, morale: score, loyalty: score,
  supply: z.object({ food: amount, equipment: amount, status: z.enum(['supplied', 'strained', 'isolated']) }).strict(),
  upkeep: z.object({ money: amount, food: amount }).strict(), recruitmentProfileId: id,
  history: z.array(z.string()), honors: z.array(z.string()), predecessorIds: z.array(id), provenance: provenanceSchema,
}).strict();
export const legacyGameStateSchema = z.object({
  campaignId: z.literal('foundation-sandbox'), campaignVersion: z.literal('0.1.0'), seed: z.number().int().nonnegative(), calendar: calendarSchema,
  country: z.object({ id, name: id, treasury: amount, grainReserve: amount, administrativeCapacity: score }).strict(),
  dynasty: z.object({ id, name: id, emperorId: id, heirId: id.nullable(), legitimacy: score, successionRule: z.enum(['designated', 'primogeniture', 'courtElection']) }).strict(),
  administrativeProfile: administrativeProfileSchema, administrativeUnits: z.array(administrativeUnitSchema), characters: z.array(characterSchema), militaryUnits: z.array(militaryUnitSchema),
  flags: z.record(id, z.boolean()), history: z.array(z.object({ date: calendarSchema, message: z.string() }).strict()),
}).strict().superRefine((state, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  const units = new Map(state.administrativeUnits.map(u => [u.id, u]));
  const people = new Set(state.characters.map(c => c.id));
  const levels = state.administrativeProfile.levels.map(l => l.id);
  if (units.size !== state.administrativeUnits.length || people.size !== state.characters.length || new Set(state.militaryUnits.map(u => u.id)).size !== state.militaryUnits.length || new Set(levels).size !== levels.length) fail('ID phải duy nhất trong từng loại thực thể.');
  if (!people.has(state.dynasty.emperorId) || (state.dynasty.heirId !== null && !people.has(state.dynasty.heirId))) fail('Hoàng tộc tham chiếu nhân vật không tồn tại.');
  for (const unit of units.values()) {
    const rank = levels.indexOf(unit.levelId);
    const parent = unit.parentId === null ? undefined : units.get(unit.parentId);
    if (rank < 0 || (rank === 0 ? unit.parentId !== null : !parent || levels.indexOf(parent.levelId) !== rank - 1)) fail(`Cây hành chính không hợp lệ: ${unit.id}`);
    if (rank !== levels.length - 1 && (unit.population !== 0 || Object.keys(unit.resources).length > 0)) fail('Dân số và hàng hóa chỉ lưu tại cấp cơ sở.');
    if (unit.governorId !== null && !people.has(unit.governorId)) fail('Quan chức không tồn tại.');
  }
  if (state.administrativeUnits.filter(u => u.parentId === null).length !== 1) fail('Cần đúng một đơn vị trung ương.');
  const locations = new Set(state.administrativeUnits.map(u => u.locationId));
  for (const army of state.militaryUnits) {
    if (!locations.has(army.locationId) || (army.commanderId !== null && !people.has(army.commanderId))) fail('Tham chiếu quân đội không hợp lệ.');
  }
});
export type Calendar = z.infer<typeof calendarSchema>;
export type LegacyGameState = z.infer<typeof legacyGameStateSchema>;
export type Country = LegacyGameState['country'];
export type AdministrativeUnit = z.infer<typeof administrativeUnitSchema>;
export type AdministrativeProfile = z.infer<typeof administrativeProfileSchema>;
export type MilitaryUnit = z.infer<typeof militaryUnitSchema>;
export type Character = z.infer<typeof characterSchema>;
export type Provenance = z.infer<typeof provenanceSchema>;

