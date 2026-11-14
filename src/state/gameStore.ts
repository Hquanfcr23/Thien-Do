import { mapViewSchema } from '../domain/territory';
import { queueOrder } from '../engine/month';
import { advanceDecisionTurn } from '../engine/decisionTurn';
import type { Order } from '../domain/economy';
import { create } from 'zustand';
import { gameStateSchema, type GameState } from '../domain/schema';
import type { MapView } from '../domain/territory';
import { selectTerritory } from '../engine/administration';
interface GameStore { advance:()=>void;order:(order:Order)=>void; game: GameState | null; replaceGame: (state: GameState) => void; selectUnit:(id:string,focus?:boolean)=>void; updateView:(patch:Partial<MapView>)=>void }
export const useGameStore = create<GameStore>(set => ({ game: null, advance:()=>set(s=>({game:s.game?advanceDecisionTurn(s.game):null})),order:order=>set(s=>({game:s.game?queueOrder(s.game,order):null})), replaceGame: state => set({ game: gameStateSchema.parse(state) }),selectUnit:(id,focus=false)=>set(s=>({game:s.game?selectTerritory(s.game,id,focus):null})),updateView:patch=>set(s=>{if(!s.game)return{game:null};const view=mapViewSchema.parse({...s.game.mapView,...patch});if(view.selectedId!==null&&!s.game.administrativeUnits.some(u=>u.id===view.selectedId))throw Error('Đơn vị đang chọn không tồn tại.');return{game:{...s.game,mapView:view}};}) }));
