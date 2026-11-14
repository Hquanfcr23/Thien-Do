import { describe, expect, it } from 'vitest';
import { createNewGame } from '../data/foundation';
import { advanceDecisionTurn } from '../engine/decisionTurn';
import { advanceMonth, queueOrder } from '../engine/month';
import { decodeSave, exportSave, importSave } from '../persistence/saves';

describe('24 decision turns, 12 economic months', () => {
  it('keeps orders, resources and reports unchanged in the first half', () => {
    const initial = createNewGame();
    const zhouId = initial.administrativeUnits.find(u => u.levelId === 'zhou')!.id;
    const queued = queueOrder(initial, { kind: 'policy', zhouId, policy: { ...initial.simulation!.policy, landTax: 0.2 } });
    const mid = advanceDecisionTurn(queued);
    expect(mid.decisionTurn).toBe('mid');
    expect(mid.calendar).toEqual(queued.calendar);
    expect(mid.simulation).toEqual(queued.simulation);
    expect(mid.country).toEqual(queued.country);
    expect(advanceDecisionTurn(mid)).toEqual({ ...advanceMonth(queued), decisionTurn: 'early' });
  });

  it('settles 12 months in 24 turns and resumes exactly from a mid-month save', () => {
    let state = createNewGame();
    const mid = advanceDecisionTurn(state);
    expect(importSave(exportSave(mid))).toEqual(mid);
    expect(advanceDecisionTurn(importSave(exportSave(mid)))).toEqual(advanceDecisionTurn(mid));
    for (let i = 0; i < 24; i++) state = advanceDecisionTurn(state);
    expect(state.calendar).toEqual({ year: 2, month: 1 });
    expect(state.decisionTurn).toBe('early');
    expect(state.simulation!.tick).toBe(12);
    expect(state.simulation!.annual).toHaveLength(1);
  });

  it('loads an existing v6 save at the start of its month', () => {
    const old = JSON.parse(exportSave(createNewGame())) as { state: Record<string, unknown> };
    delete old.state.decisionTurn;
    expect(decodeSave(old).state.decisionTurn).toBe('early');
  });
});
