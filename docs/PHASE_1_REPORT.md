# Báo cáo Phase 1 Foundation

## Kết quả
Đã triển khai nền tảng nhỏ chạy được trong workspace D:/Project/Thiên Đồ. Repository GitHub ban đầu không có refs; workspace ban đầu trống. Chưa tạo commit, push hay deploy. Không triển khai Phase 2.

Đã đọc DOCX v1.1 qua OOXML, bao gồm đoạn văn và bảng theo thứ tự, 16 chương và phụ lục A/B; sao chép tài liệu gốc vào docs. Không chỉnh sửa DOCX hay tuyên bố kiểm định layout tài liệu. Các nguồn lịch sử trong phụ lục không được dùng để đưa dữ liệu lịch sử vào Foundation; seed hoàn toàn Fictional.

## Các file tạo
| Nhóm | File | Mục đích |
|---|---|---|
| Hướng dẫn | AGENTS.md, README.md | quy tắc dự án, cài/chạy/kiểm tra và thao tác save |
| Thiết kế | docs/De_Nghiep_Game_Design_Brief.docx, docs/DESIGN_SOURCE.txt | nguồn gốc và trích xuất toàn văn |
| Kế hoạch | docs/IMPLEMENTATION_PLAN.md | phân tích, kiến trúc, data models, phụ thuộc, pipeline, 8 phase và nghiệm thu |
| Cấu hình | package.json, package-lock.json, tsconfig.json, vite.config.ts, eslint.config.js, .gitignore, index.html | React/Vite, strict TS, dependency lock và scripts |
| Domain | src/domain/schema.ts | GameState, Calendar, Country, Profile, Unit, Character, Dynasty, MilitaryUnit, provenance; Zod và referential invariants |
| Engine | src/engine/calendar.ts, src/engine/selectors.ts | calendar thuần, mùa, children, population aggregation |
| Nội dung | src/data/foundation.ts | factory hồ sơ Đại Ninh giả tưởng có seed |
| State | src/state/gameStore.ts | Zustand, kiểm tra snapshot trước replace |
| Persistence | src/persistence/saves.ts | IndexedDB, 3 ô thủ công và autosave, version gate, JSON import/export |
| UI | src/main.tsx, src/ui/App.tsx, src/ui/theme.css | trang khởi đầu, tạo/lưu/tải/backup, lỗi và busy state, responsive theme |
| Test | src/tests/foundation.test.ts | 16 ca kiểm thử nền tảng |
| Báo cáo | docs/PHASE_1_REPORT.md | kết quả nghiệm thu và giới hạn |

## Kiểm tra đã chạy
Môi trường Node 24.12.0, npm 11.6.2 trên Windows. npm install thành công sau khi cấp quyền mạng. Dependency lock đã được tạo. Vitest được cập nhật lên 5.1.0 để loại cảnh báo critical trong bộ test.

| Kiểm tra | Kết quả |
|---|---|
| npm run typecheck | PASS, strict TypeScript |
| npm run lint | PASS |
| npm test | PASS, 16/16 (Vitest 5.1.0) |
| npm run build | PASS, static bundle; JS khoảng 332 kB / gzip 102 kB |
| npm run dev -- --port 5173 --strictPort | PASS, Vite sẵn sàng; dùng server ngoài sandbox vì sandbox chặn socket |
| Browser smoke test | PASS, tạo hồ sơ, lưu, reload, tải lại Ô 1: Ninh triều, tháng 1/năm 1, 12.000 quan, 6.000 thạch |
| Quan sát giao diện desktop | PASS, trang khởi đầu hiển thị theme và minh họa SVG; phần điều khiển tiếp tục bên dưới khi viewport thấp |
| JSON import/export | PASS ở unit test roundtrip, reject malformed/future/corrupt; chưa kiểm tra file picker/download trên browser |
| npm audit sau cập nhật | Còn 7 moderate trong dev-only typescript-eslint → minimatch; không còn high/critical. npm audit fix tương thích không giải quyết được; không force downgrade bộ lint |

16 test bao gồm 4 trường hợp tháng không hợp lệ, tất cả mùa, đổi năm không mutate, factory deterministic/independent, tham chiếu hoàng tộc/ID trùng, parent/cycle/ancestor population, profile thay đổi và aggregate, historical provenance, store rollback khi invalid, JSON roundtrip, reject corrupt/future, IndexedDB nhiều slot qua connection mới và invalid write giữ save cũ.

## Giới hạn có chủ đích
- Chỉ có trung ương và hoàng đế; chưa có dân số lãnh thổ. Số 0 thể hiện dữ liệu chưa khai báo, không phải mô phỏng đế quốc không dân.
- SVG là minh họa trang khởi đầu. Bản đồ có chọn/zoom/layers, 3–5 Châu, Phủ/Quận/Huyện thuộc Phase 2.
- Hàm calendar chỉ là primitive test được, không có nút tiến tháng hay tick giả. Economy/logistics/politics/war/diplomacy/events chưa hoạt động.
- Autosave Foundation là snapshot trước khởi lập mới; autosave sau tick thuộc Phase 3. Không cloud save. Chưa có schema cũ nên chưa có migration biến đổi, chỉ version gate giữ dữ liệu cũ.
- Production build có cảnh báo annotation comment từ Zod được Rollup loại bỏ; không lỗi compile/build.
- Chưa smoke test responsive viewport nhỏ, quota/storage denial thật, browser khác, hoặc import/export qua file chooser. Persistence failure được bắt và báo lỗi tại UI.
