import {moneyNumber,grainNumber} from '../domain/economicUnits';
import { Modal } from './Modal';
import type { Report } from '../domain/economy';
import { useCallback,useEffect,useRef,useState } from 'react';
import { useGameStore } from '../state/gameStore';
import { writeSave } from '../persistence/saves';
export function TimeControls({paused=false,onAdvance}:{paused?:boolean;onAdvance?:(change:{treasury:number;grain:number})=>void}){
 const [summary,setSummary]=useState<Report|null>(null);
 const [running,setRunning]=useState(false),[speed,setSpeed]=useState(1),[error,setError]=useState(''),[saving,setSaving]=useState(false);const busy=useRef(false);
 const tick=useCallback(async()=>{if(busy.current)return;busy.current=true;setSaving(true);try{const before=useGameStore.getState().game;useGameStore.getState().advance();const s=useGameStore.getState().game;if(s){if(before?.decisionTurn==='mid')onAdvance?.({treasury:s.country.treasury-before.country.treasury,grain:s.country.grainReserve-before.country.grainReserve});await writeSave('autosave',s);const annual=s.simulation?.annual.at(-1);if(before?.decisionTurn==='mid'&&s.calendar.month===1&&annual?.year===s.calendar.year-1){setRunning(false);setSummary(annual);}}}catch(e){setRunning(false);setError(e instanceof Error?e.message:'Lỗi mô phỏng');}finally{busy.current=false;setSaving(false);}},[onAdvance]);
 useEffect(()=>{if(!running||paused)return;const timer=globalThis.setInterval(()=>void tick(),1200/speed);return()=>clearInterval(timer);},[running,speed,paused,tick]);
 return <div className="time-controls"><button disabled={paused} onClick={()=>setRunning(!running)} aria-pressed={running}>{running?'Tạm dừng':'Chạy thời gian'}</button><button disabled={running||saving||paused} onClick={()=>void tick()}>Tiến 1 lượt</button><select aria-label="Tốc độ thời gian" value={speed} onChange={e=>setSpeed(Number(e.target.value))}>{[1,2,4].map(n=><option value={n} key={n}>{n}×</option>)}</select>{error&&<p role="alert">{error}</p>}{summary&&!paused&&<Modal title={`Tổng kết kinh tế năm ${summary.year}`} onClose={()=>setSummary(null)}><div className="dialog-body"><p>Dân số cuối năm {summary.population.toLocaleString('vi-VN')}</p><p>Thu {moneyNumber(summary.tax)} lượng · chi {moneyNumber(summary.spending)} lượng</p><p>Thu hoạch {grainNumber(summary.harvest)} thạch lương · tiêu dùng {grainNumber(summary.consumed)} thạch lương · hao hụt {grainNumber(summary.loss)} thạch lương</p><button onClick={()=>setSummary(null)}>Tiếp tục ngự lãm</button></div></Modal>}</div>;
}

