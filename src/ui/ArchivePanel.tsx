import {grainNumber} from '../domain/economicUnits';
import { useState } from 'react';
import { formatSilver } from '../engine/money';
import { createNewGame } from '../data/foundation';
import { seasonOf } from '../engine/calendar';
import { totalPopulation } from '../engine/selectors';
import { exportSave, importSave, readSave, writeSave, type Slot } from '../persistence/saves';
import { useGameStore } from '../state/gameStore';

export function ArchivePanel({ onEnter, initialMessage }: { onEnter: () => void; initialMessage?: string }) {
  const { game, replaceGame: setGame } = useGameStore();
  function replaceGame(state: Parameters<typeof setGame>[0]) { setGame(state); onEnter(); }
  const [slot, setSlot] = useState<Slot>('manual-1');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(initialMessage || 'Hồ sơ được lưu cục bộ trên trình duyệt này.');
  async function perform(action: () => Promise<string>) {
    setBusy(true);
    try { setMessage(await action()); } catch (error) { setMessage(`Không thể hoàn tất: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`); }
    finally { setBusy(false); }
  }
  return <div className="archive-content">      <p className="eyebrow">{game ? 'HỒ SƠ ĐANG MỞ' : 'KHỞI LẬP TRIỀU ĐẠI'}</p><h2>{game?.dynasty.name ?? 'Thiên mệnh khởi đầu'}</h2>
      {game ? <><p>Hoàng đế {game.characters.find(c => c.id === game.dynasty.emperorId)?.name}</p><dl><div><dt>Niên lịch</dt><dd>Tháng {game.calendar.month}, năm {game.calendar.year} • {seasonOf(game.calendar.month)}</dd></div><div><dt>Ngân khố</dt><dd>{formatSilver(game.country.treasury)}</dd></div><div><dt>Kho lương</dt><dd>{grainNumber(game.country.grainReserve)} thạch lương</dd></div><div><dt>Dân số đã khai báo</dt><dd>{totalPopulation(game).toLocaleString('vi-VN')}</dd></div></dl><p className="note">Hồ sơ cũ được chuyển sang mô hình thị trường Phủ khi đọc; hàng hóa và tổng bạc được bảo toàn. Hồ sơ mới có mô phỏng kinh tế; 1 lượng bạc = 1000 đồng.</p></> : <p>Bắt đầu với Ninh triều, năm đầu tiên. Tạo hồ sơ nền tảng để kiểm tra lưu và tải trước khi mở rộng thế giới.</p>}
      <button className="primary" disabled={busy} onClick={() => void perform(async () => {
        if (game) await writeSave('autosave', game);
        const next = createNewGame();
        await writeSave('manual-1', next); replaceGame(next);
        return game ? 'Đã tạo hồ sơ tại Ô 1; hồ sơ trước đó được lưu vào Autosave.' : 'Đã tạo hồ sơ và lưu tại Ô 1.';
      })}>{game ? 'Khởi lập hồ sơ mới' : 'Khởi lập Đế Nghiệp'} <span>→</span></button>
      <label className="slot">Ô lưu<select value={slot} disabled={busy} onChange={e => setSlot(e.target.value as Slot)}><option value="manual-1">Ô 1</option><option value="manual-2">Ô 2</option><option value="manual-3">Ô 3</option><option value="autosave">Autosave trước khi khởi lập mới</option></select></label>
      <div className="actions"><button disabled={!game || busy} onClick={() => void perform(async () => { if (game) await writeSave(slot, game); return 'Đã lưu hồ sơ.'; })}>Lưu hồ sơ</button><button disabled={busy} onClick={() => void perform(async () => { const save = await readSave(slot); if (!save) return 'Ô này chưa có hồ sơ.'; replaceGame(save.state); return `Đã tải hồ sơ • ${new Date(save.timestamp).toLocaleString('vi-VN')}`; })}>Tải hồ sơ</button></div>
      <div className="actions"><button disabled={!game || busy} onClick={() => { if (!game) return; const url = URL.createObjectURL(new Blob([exportSave(game)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = 'de-nghiep-save.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }}>Xuất JSON</button><label className={`file-button ${busy ? 'disabled' : ''}`}>Nhập JSON<input type="file" accept=".json,application/json" disabled={busy} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void perform(async () => { if (file.size > 10 * 1024 * 1024) throw new Error('Giới hạn file 10 MB.'); const state = importSave(await file.text()); await writeSave(slot, state); replaceGame(state); return 'Đã kiểm tra, nhập và lưu hồ sơ.'; }); }}/></label></div>
      <p role="status" className="status">{busy ? 'Đang xử lý…' : message}</p>
</div>; }


