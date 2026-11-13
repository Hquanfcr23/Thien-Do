import { create } from 'zustand';
import { gameStateSchema, type GameState } from '../domain/schema';
import type { MapView } from '../domain/territory';
import { selectTerritory } from '../engine/administration';
interface GameStore { game: GameState | null; replaceGame: (state: GameState) => void; selectUnit:(id:string,focus?:boolean)=>void; updateView:(patch:Partial<MapView>)=>void }
export const useGameStore = create<GameStore>(set => ({ game: null, replaceGame: state => set({ game: gameStateSchema.parse(state) }),selectUnit:(id,focus=false)=>set(s=>({game:s.game?gameStateSchema.parse(selectTerritory(s.game,id,focus)):null})),updateView:patch=>set(s=>({game:s.game?gameStateSchema.parse({...s.game,mapView:{...s.game.mapView,...patch}}):null})) }));
