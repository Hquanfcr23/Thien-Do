import type { GameState } from '../domain/schema';
export function totalPopulation(state: GameState): number {
  return state.administrativeUnits.reduce((total, unit) => total + unit.population, 0);
}
export function childrenOf(state: GameState, parentId: string) {
  return state.administrativeUnits.filter(unit => unit.parentId === parentId);
}
