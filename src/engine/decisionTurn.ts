import type { GameState } from '../domain/schema';
import { advanceMonth } from './month';

/** Two order windows per month; physical and financial flows settle once. */
export function advanceDecisionTurn(state: GameState): GameState {
  if (state.decisionTurn === 'early') return { ...state, decisionTurn: 'mid' };
  return { ...advanceMonth(state), decisionTurn: 'early' };
}
