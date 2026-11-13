import { legacyGameStateSchema, type LegacyGameState } from '../domain/legacy';

export function createLegacyGame(seed = 1701): LegacyGameState {
  return legacyGameStateSchema.parse({
    campaignId: 'foundation-sandbox', campaignVersion: '0.1.0', seed, calendar: { year: 1, month: 1 },
    country: { id: 'dai-ninh', name: 'Đại Ninh', treasury: 12000, grainReserve: 6000, administrativeCapacity: 60 },
    dynasty: { id: 'ninh', name: 'Ninh triều', emperorId: 'emperor', heirId: null, legitimacy: 70, successionRule: 'designated' },
    administrativeProfile: { id: 'fictional-default', levels: [
      { id: 'central', name: 'Trung ương', officeTitle: 'Hoàng đế' }, { id: 'zhou', name: 'Châu', officeTitle: 'Châu mục' },
      { id: 'fu', name: 'Phủ', officeTitle: 'Tri phủ' }, { id: 'jun', name: 'Quận', officeTitle: 'Quận thủ' }, { id: 'xian', name: 'Huyện', officeTitle: 'Huyện lệnh' },
    ] },
    administrativeUnits: [{ id: 'capital', name: 'Ninh Kinh', levelId: 'central', parentId: null, governorId: 'emperor', locationId: 'capital-location', treasury: 0, stability: 70, development: 50, population: 0, resources: {} }],
    characters: [{ id: 'emperor', name: 'Ninh Thế An', age: 32, health: 85, ability: 65, loyalty: 100, ambition: 55, corruption: 0, prestige: 60, factionId: null, provenance: { kind: 'Fictional', note: 'Nhân vật sáng tạo cho dữ liệu kiểm thử Foundation.' } }],
    militaryUnits: [], flags: {}, history: [{ date: { year: 1, month: 1 }, message: 'Khởi lập hồ sơ Ninh triều. Dữ liệu giả tưởng phục vụ Foundation; chưa mô phỏng gameplay.' }],
  });
}

