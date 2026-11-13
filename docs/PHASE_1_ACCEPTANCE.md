# Nghiệm thu Phase 1 Foundation

Kết luận: **đạt phạm vi Foundation**, chưa đạt MVP hoàn chỉnh và không triển khai Phase 2. UI hiện tại được người dùng chấp nhận làm prototype; không thiết kế lại hoặc đầu tư đồ họa. Không kiểm tra/tối ưu mobile theo chỉ thị hoãn trong Phase 1–3.

## Căn cứ và checklist
Đối chiếu Game Design Brief v1.1, đặc biệt §15 và milestone 1 ở §16.2, IMPLEMENTATION_PLAN.md và tiêu chí Phase 1 của người dùng. Các tiêu chí MVP §16.3 thuộc nhiều phase sau, không dùng để mở rộng Foundation.

| Tiêu chí Phase 1 | Kết quả và bằng chứng |
|---|---|
| Chạy trên browser desktop | PASS: Vite localhost/127.0.0.1:5173, Playwright mở Main Menu/trị vì |
| TypeScript strict / cấu trúc thư mục | PASS: strict/noUncheckedIndexedAccess/exactOptionalPropertyTypes, domain/engine/data/state/persistence/ui |
| Không lỗi TypeScript/build nghiêm trọng | PASS: npm run check sau sửa |
| Engine độc lập React | PASS: src/engine chỉ import domain/schema, không React/Zustand/DOM/IndexedDB hoặc nguồn ngẫu nhiên/thời gian thực; unit test chạy Node |
| GameState/domain types | PASS: Zod inferred types; calendar, country, dynasty, profiles, units, characters, military; kiểm tra IDs, parent rank, tham chiếu, nonnegative/finite; factory Fictional |
| Save cơ bản | PASS: 3 manual slot + autosave, envelope/version/timestamp, validate trước load, export/import JSON, từ chối version lạ |
| UI khởi đầu | PASS: prototype hiện tại được chấp nhận, không sửa hình thức trong đợt nghiệm thu |
| README/AGENTS/roadmap/report | PASS: đã có và cập nhật giới hạn hiện tại |

## Checks và sửa lỗi
Lượt đầu typecheck/lint, 16 tests và build đạt. Rà soát phát hiện Continue dùng Promise.all: chỉ một slot hỏng cũng chặn mọi slot hợp lệ. Đã sửa bằng latestSave đọc từng slot với Promise.allSettled, chọn timestamp mới nhất trong save hợp lệ. Không sửa/xóa save hỏng. Khi không còn slot hợp lệ, mở thư khố và hiển thị lỗi để chọn ô hoặc import JSON.

File sửa chức năng: src/persistence/saves.ts, src/ui/App.tsx, src/ui/ArchivePanel.tsx. Thêm src/tests/save-recovery.test.ts (2 test). Không thay domain schema, công thức/calendar/selectors, factory, store, hình ảnh/CSS hay format save.

Fixture test mới ban đầu dùng timestamp offset +07:00, bị validator UTC từ chối đúng quy định schema hiện hành; đã sửa fixture về UTC. Không nới schema để che lỗi test.

Kết quả cuối: TypeScript PASS, ESLint PASS, Vitest **18/18 PASS**, production build PASS. Hai test mới chứng minh: slot lỗi không chặn save hợp lệ; dữ liệu thô lỗi giữ nguyên; không có save hợp lệ trả danh sách lỗi đầy đủ. Các test cũ kiểm tra calendar/mùa/đổi năm/không mutate, deterministic factory, profile linh hoạt, invariants, store không thay khi invalid, JSON roundtrip, IndexedDB multi-slot và invalid write bảo toàn save cũ.

## Playwright desktop thực tế
1. 127.0.0.1:5173: Continue từ save cũ → Ninh triều, tháng 1/năm 1, 12.000 quan, 6.000 thạch.
2. Mở thư khố, lưu Ô 3 → báo thành công.
3. Import fixture schema 1 với seed riêng, ngân khố **12.345 quan** vào Ô 3 → HUD cập nhật. Reload, mở thư khố, tải Ô 3 → vẫn 12.345 quan; xác nhận không âm thầm tạo lại default state.
4. Import file schemaVersion 99 → UI từ chối, state vẫn 12.345 quan. Sau kiểm tra, tải lại bản gốc Ô 1 và ghi lại Ô 3 (12.000 quan); không để fixture ảnh hưởng hồ sơ chơi đang dùng.
5. Origin riêng localhost:5173 để tránh ghi đè các slot ở 127.0.0.1: khởi lập → Nhận thiên mệnh → trị vì; reload → Continue → khôi phục thành công.
6. Console errors: không có trong hai phiên kiểm thử. Một locator ban đầu trùng tên nút menu/dialog, đã scope vào dialog rồi kiểm tra tiếp; đây là lỗi script kiểm thử, không lỗi app.

Ảnh ghi nhận: docs/screenshots/phase1-acceptance.jpg. Fixture kiểm tra: .audit/valid-save.json và future-save.json (dữ liệu giả tưởng). Không đưa save hỏng vào IndexedDB thật; tình huống slot thô bị hỏng được kiểm tra bằng fake-indexeddb trong unit tests.

## Chưa hoàn thành vì ngoài Phase 1
- Địa đồ chỉ là UI prototype; chưa có dataset 3–5 Châu, đầy đủ Phủ/Quận/Huyện, quyền kiểm soát hoặc bản đồ chiến lược mô phỏng.
- Chưa có monthly tick, sản xuất/tiêu dùng/thuế, logistics, dân số, phe phái, kế vị, chiến đấu, ngoại giao/sự kiện. Calendar primitive không được coi là engine mô phỏng đầy đủ.
- Chưa có autosave sau tháng vì chưa có tick. Autosave Foundation là snapshot trước khởi lập mới.
- Chưa có migration biến đổi vì chưa tồn tại schema cũ; hiện có version gate từ chối phiên bản không hỗ trợ.

## Giới hạn chưa kiểm thử
- Chưa gây quota exceeded, storage denied, mất điện/đóng browser giữa transaction, khác browser hoặc thiết bị thật.
- Export JSON đã được kiểm thử trình duyệt ở lượt UI trước; đợt này không lặp lại download/export, có unit roundtrip và kiểm tra file import thực tế.
- Chưa test migration từ schema cũ hoặc engine tick vì chưa có triển khai; không thể báo PASS cho chúng.
- Mobile bỏ qua theo yêu cầu. Không chứng nhận cross-browser hoặc hiệu năng dataset nhiều đơn vị.
- Build còn cảnh báo annotation từ Zod không chặn build; 7 moderate dev dependencies được ghi nhận từ lượt trước, không audit lại mạng trong đợt nghiệm thu này.

**Dừng tại Phase 1 và chờ chỉ thị.**
