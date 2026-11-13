import { useEffect, useState } from 'react';
import { createNewGame } from '../data/foundation';
import { seasonOf } from '../engine/calendar';
import { totalPopulation } from '../engine/selectors';
import { latestSave, writeSave } from '../persistence/saves';
import { useGameStore } from '../state/gameStore';
import { ArchivePanel } from './ArchivePanel';
import { Modal } from './Modal';
import { StrategyMap } from './StrategyMap';
import { AdministrationPanel } from './AdministrationPanel';
import { formatSilver } from '../engine/money';

type WindowName = 'archive' | 'settings' | 'new' | null;
type PanelName = 'country' | 'admin' | 'court' | 'journal' | null;
const panels = [{ id: 'country', icon: '印', name: 'Đế quốc' }, { id: 'admin', icon: '府', name: 'Hành chính' }, { id: 'court', icon: '廷', name: 'Triều đình' }, { id: 'journal', icon: '史', name: 'Sử quan' }] as const;
export function App() {
  const { game, replaceGame } = useGameStore();
  const [screen, setScreen] = useState<'menu' | 'reign'>('menu');
  const [window, setWindow] = useState<WindowName>(null);
  const [panel, setPanel] = useState<PanelName>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [labels, setLabels] = useState(true);
  const [largeText, setLargeText] = useState(false);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setPanel('admin'); };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, []);
  const enter = () => { setScreen('reign'); setWindow(null); setPanel('admin'); };
  async function continueReign() {
    if (game) { enter(); return; }
    setBusy(true);
    try {
      const { save, rejectedSlots } = await latestSave();
      if (rejectedSlots.length && !save) { setMessage(`Không đọc được ${rejectedSlots.join(', ')}. Hãy chọn ô khác hoặc nhập bản sao JSON; các hồ sơ gốc được giữ nguyên.`); setWindow('archive'); return; }
      if (!save) { setMessage('Chưa có hồ sơ. Hãy khởi lập triều đại hoặc nhập hồ sơ từ thư khố.'); return; }
      replaceGame(save.state); enter();
    } catch (error) { setMessage(`Không thể tiếp tục: ${error instanceof Error ? error.message : 'Lỗi đọc hồ sơ'}`); }
    finally { setBusy(false); }
  }
  async function startReign() {
    setBusy(true);
    try {
      if (game) await writeSave('autosave',game);
      const next = createNewGame(); await writeSave('manual-1',next); replaceGame(next); enter(); setMessage('Đã khởi lập Ninh triều và lưu tại Ô 1.');
    } catch (error) { setMessage(`Không thể khởi lập: ${error instanceof Error ? error.message : 'Lỗi lưu trữ'}`); }
    finally { setBusy(false); }
  }
  const emperor = game?.characters.find(c => c.id === game.dynasty.emperorId);
  return <main className={`game-app ${largeText ? 'large-text' : ''}`}>
    {screen === 'menu' || !game ? <section className="main-menu" aria-label="Main Menu Đế Nghiệp">
      <img className="menu-painting" src={`${import.meta.env.BASE_URL}images/imperial-landscape.png`} alt="Hoàng cung và giang sơn Đại Ninh"/>
      <div className="menu-vignette"/>
      <div className="menu-content"><div className="menu-seal" aria-hidden="true">ĐN</div><p className="menu-kicker">TRUNG HOA HOÀNG TRIỀU</p><h1>ĐẾ NGHIỆP</h1><p className="menu-motto">Giữ vững sơn hà · Tiếp nối cơ nghiệp</p>
        <nav className="menu-buttons" aria-label="Menu chính"><button className="continue-button" disabled={busy} onClick={()=>void continueReign()}><span>Tiếp tục trị vì</span><small>{game ? `${game.dynasty.name} · Tháng ${game.calendar.month}, năm ${game.calendar.year}` : 'Mở hồ sơ gần nhất'}</small></button><button disabled={busy} onClick={()=>setWindow('new')}>Khởi lập triều đại</button><button disabled={busy} onClick={()=>setWindow('archive')}>Tải hồ sơ</button><button onClick={()=>setWindow('settings')}>Thiết lập</button></nav>
        <p role="status" className="menu-message">{busy ? 'Đang mở thư khố…' : message}</p>
      </div><div className="menu-footer"><span>ĐẠI NINH · THẾ GIỚI GIẢ TƯỞNG</span><span>MAP & ADMIN 0.2 · SINGLE PLAYER</span></div>
    </section> : <section className="reign-screen" aria-label="Màn hình trị vì">
      <header className="empire-bar"><button className="dynasty-button" onClick={()=>setScreen('menu')} aria-label="Về Main Menu"><span className="small-seal">ĐN</span><span>{game.dynasty.name}<small>Hoàng đế {emperor?.name}</small></span></button><div className="empire-resource"><span>Ngân khố</span><strong>{formatSilver(game.country.treasury)}</strong></div><div className="empire-resource"><span>Kho lương</span><strong>{game.country.grainReserve.toLocaleString('vi-VN')} <small>thạch</small></strong></div><div className="empire-resource legitimacy"><span>Chính thống</span><strong>{game.dynasty.legitimacy}<small> / 100</small></strong></div><div className="imperial-date"><strong>Tháng {game.calendar.month} · Năm {game.calendar.year}</strong><span>{seasonOf(game.calendar.month)} · Chưa mô phỏng lượt</span></div><button className="system-button" aria-label="Mở thiết lập" onClick={()=>setWindow('settings')}>⚙</button></header>
      <div className="map-stage"><StrategyMap panelOpen={panel!==null} labels={labels} onCapital={()=>setPanel('admin')}/>
        <nav className="command-rail" aria-label="Các bảng quản lý">{panels.map(p=><button key={p.id} aria-pressed={panel===p.id} onClick={()=>setPanel(panel===p.id?null:p.id)}><span aria-hidden="true">{p.icon}</span>{p.name}</button>)}<div className="rail-rule"/><button onClick={()=>setWindow('archive')}><span aria-hidden="true">▤</span>Thư khố</button></nav>
        {panel && <aside className="management-panel" aria-label={`Bảng ${panels.find(p=>p.id===panel)?.name}`}><div className="panel-heading"><div><p className="eyebrow">NGỰ LÃM</p><h2>{panels.find(p=>p.id===panel)?.name}</h2></div><button onClick={()=>setPanel(null)} aria-label="Đóng bảng quản lý">×</button></div>
          {panel==='country' && <><p className="panel-subtitle">{game.country.name} · {game.dynasty.name}</p><dl><div><dt>Ngân khố</dt><dd>{formatSilver(game.country.treasury)}</dd></div><div><dt>Lương thực dự trữ</dt><dd>{game.country.grainReserve.toLocaleString('vi-VN')} thạch</dd></div><div><dt>Năng lực hành chính</dt><dd>{game.country.administrativeCapacity}/100</dd></div><div><dt>Dân số đã khai báo</dt><dd>{totalPopulation(game).toLocaleString('vi-VN')}</dd></div></dl><p className="context-note">Dân số tổng hợp từ Huyện; 1 lượng bạc = 1000 đồng.</p></>}
          {panel==='admin' && <AdministrationPanel/>}
          {panel==='court' && <><p className="panel-subtitle">Ngự tiền · {game.dynasty.name}</p>{game.characters.map(c=><article className="record-entry" key={c.id}><span className="portrait-seal" aria-hidden="true">{c.id===game.dynasty.emperorId?'ĐẾ':'QUAN'}</span><h3>{c.name}</h3><p>{c.id===game.dynasty.emperorId?'Hoàng đế':'Nhân vật'} · {c.age} tuổi</p><dl><div><dt>Năng lực</dt><dd>{c.ability}/100</dd></div><div><dt>Uy tín</dt><dd>{c.prestige}/100</dd></div></dl></article>)}<p className="context-note">Người kế vị: {game.dynasty.heirId ? game.characters.find(c=>c.id===game.dynasty.heirId)?.name : 'Chưa chỉ định'}.</p></>}
          {panel==='journal' && <><p className="panel-subtitle">Biên niên triều đại</p>{game.history.map((entry,i)=><article key={i} className="journal-entry"><small>Tháng {entry.date.month} · Năm {entry.date.year}</small><p>{entry.message}</p></article>)}</>}
        </aside>}
      </div><footer className="reign-footer"><span><i/> TĨNH TRIỀU</span><p>{panel ? 'Esc để đóng bảng · Kéo địa đồ để di chuyển' : 'Chọn bảng bên trái để ngự lãm tình hình đế quốc'}</p><span>PHASE 2 · HÀNH CHÍNH</span></footer>
    </section>}
    {window && <Modal title={window==='archive'?'Thư khố triều đại':window==='new'?'Khởi lập triều đại':'Thiết lập'} onClose={()=>setWindow(null)}>
      {window==='archive' && <ArchivePanel onEnter={enter} initialMessage={message}/>}
      {window==='new' && <div className="dialog-body"><p className="eyebrow">ĐẠI NINH · NĂM ĐẦU TIÊN</p><h3>Thiên mệnh khởi nguyên</h3><p>Khởi lập Ninh triều dưới quyền hoàng đế Ninh Thế An. Hồ sơ mới được lưu tại Ô 1 và thay thế nội dung ô này. Nếu đang có phiên trị vì, phiên đó sẽ được giữ tại Autosave.</p><p className="context-note">Thế giới giả tưởng với 3 Châu và đầy đủ Phủ, Quận, Huyện. Chưa có mô phỏng lượt tháng.</p><button className="primary" disabled={busy} onClick={()=>void startReign()}>Nhận thiên mệnh</button><p role="status">{busy?'Đang khởi lập…':message}</p></div>}
      {window==='settings' && <div className="dialog-body"><p className="panel-subtitle">Hiển thị & thao tác</p><label className="setting-row"><span>Địa danh trên bản đồ<small>Hiện tên vùng, sông và biển</small></span><input type="checkbox" checked={labels} onChange={e=>setLabels(e.target.checked)}/></label><label className="setting-row"><span>Chữ quản lý lớn hơn<small>Tăng cỡ chữ trong bảng thông tin</small></span><input type="checkbox" checked={largeText} onChange={e=>setLargeText(e.target.checked)}/></label><p className="context-note">Thiết lập hiển thị áp dụng trong phiên này; không sửa hồ sơ game. Kéo bản đồ để di chuyển, dùng + / − để phóng thu. Esc đóng cửa sổ hoặc bảng đang mở.</p></div>}
    </Modal>}
  </main>;
}


