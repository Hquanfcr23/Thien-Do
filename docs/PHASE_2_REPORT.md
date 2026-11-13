# Phase 2 Bản đồ và Hành chính

## Kết quả
Đã triển khai Phase 2 theo brief v1.1 và yêu cầu trực tiếp mới. Giữ trang chủ/phong cách cổ phong. Không triển khai Phase 3 hoặc responsive mobile.

Campaign mới có **3 Châu, 7 Phủ, 10 Quận, 24 Huyện**; tổng 45 đơn vị gồm Trung ương. Số Phủ theo Châu là 2/3/2; mỗi Phủ có 1–2 Quận, mỗi Quận có 2–3 Huyện. Toàn quốc **624.750 dân**, Trung Ninh **261.000 dân/10 Huyện**. Các tên và dữ liệu được đánh dấu Fictional, không dùng tên gọi như dữ kiện lịch sử.

## Tính năng và dữ liệu
- Mỗi đơn vị: ID ổn định, parentId, levelId, governorId, locationId, terrain, controllerId/control, provenance, bounds; các trường dân số, tài nguyên, ổn định, development và treasury được validate.
- Huyện là nguồn dân số/hàng hóa duy nhất. Selectors tổng hợp từ lá, không cộng lại cấp cha; ổn định và cường độ kiểm soát bình quân theo dân số, khi tổng dân số 0 dùng bình quân số Huyện. Phân bố controller trả theo dân số; bản đồ dùng xanh/ngoài kiểm soát/hỗn hợp theo các controller ở lá.
- Cây cha–con một nguồn parentId. Validator kiểm tra ID trùng, root, rank/parent, orphan, cycle gián tiếp qua thứ tự cấp, vùng con trong cha, diện tích phủ cha, vùng anh em không chồng lấn, ID chọn hợp lệ và liên kết thành/đường.
- SVG lấy vùng trực tiếp từ AdministrativeUnit.bounds, không có bảng ID trang trí độc lập. Bốn lớp Châu/Phủ/Quận/Huyện; mouse/keyboard selection, hover/focus, highlight cùng quan hệ cha–con, pan/zoom/reset. Lựa chọn/cấp/camera nằm trong GameState.
- Cây danh sách mở/đóng theo nhánh; chọn đơn vị/cha/con sẽ focus camera và đổi lớp phù hợp. Panel hiển thị nguồn dữ liệu, tổng hợp, quan phụ trách/chưa bổ nhiệm. Không có nút bổ nhiệm, thuế hoặc xây dựng giả.
- Bảy thành gắn với Huyện thật; sáu tuyến nối các thành có endpoint được validate. Sông, núi và đường là lớp không gian cơ bản; không có vận tải hoặc công thức kinh tế.
- Đơn vị tiền tệ chung là lượng bạc, tỷ lệ 1000 đồng/lượng. HUD và thư khố đổi nhãn nhất quán, helper chuyển đổi/format có test. Số liệu tiền v1 giữ nguyên nominal 1:1, không áp dụng tỷ giá lịch sử không được đặc tả.

## Save và migration
Schema save 2, campaign 0.2.0; schema v1 được giữ riêng để validate trước migration. Migration giữ country, dynasty, characters, units, tài nguyên, quân đội và history cũ; thêm metadata, camera mặc định và hình học lồng nhau cho đơn vị cũ nếu có. Không tự thêm 24 Huyện vào save chỉ có trung ương. Tải v1 không ghi lại database; chỉ lưu thủ công mới tạo v2. Từ chối version chưa hỗ trợ.

Lựa chọn, lớp, zoom, pan được validate và lưu cùng GameState. Settings cỡ chữ/nhãn không phải trạng thái chiến dịch quan trọng và vẫn là cấu hình phiên UI.

## Kiểm thử
`npm run check`: **TypeScript PASS, ESLint PASS, 36/36 Vitest PASS, production build PASS**. Engine không import React/DOM/Zustand. Test mới bao phủ phân nhánh không đều, 10 loại dữ liệu sai, aggregation độc lập kiểm tra tổng/số bình quân, dân số 0/kiểm soát hỗn hợp, hình học lồng nhau, selection/camera roundtrip JSON + IndexedDB, migration không mutate và tỷ lệ tiền.

Playwright desktop trên localhost:5173:
1. Tạo game mới: HUD 12.000 lượng bạc, cây đủ cấp.
2. Đổi bốn lớp: đếm đúng **3/7/10/24** polygon/button vùng tương ứng; click vùng Huyện mở đúng dữ liệu (Lâm An Bắc An: 11.250 dân).
3. Click Trung Ninh: 261.000 dân/10 Huyện, gỗ 600, sắt 120, ngũ cốc 4.000. Điều hướng cây đến Ninh Kinh Bắc Bình: 21.750 dân, gỗ 60, sắt 12, ngũ cốc 400; camera focus và lớp Huyện.
4. Zoom tăng, reset, pan bằng drag: transform thay đổi. Trong lượt đầu phát hiện camera còn dịch sau kéo/mở thư khố; đã sửa kết thúc drag khi nhả nút/mất capture và tính delta từ điểm bắt đầu (tránh mất cập nhật khi render gộp), chặn chọn text khi kéo.
5. Kiểm tra lại pan → mở thư khố: transform không đổi. Lưu Ô 3 → reload → Continue: camera trước/sau khớp chính xác `translate(69.93642143505903 38.14713896457766) ... scale(1)`, cấp Phủ và Giang Khẩu Phủ khôi phục. Unit test bổ sung roundtrip toàn snapshot với lựa chọn Huyện/camera khác.
6. Console error ở các phiên kiểm tra: 0. Ảnh chụp đã được xem: docs/screenshots/phase2-provinces.jpg, phase2-county.jpg.

Các lỗi script do HMR reset UI/locator không còn khớp được xử lý bằng snapshot mới và mở lại save. Chúng không được tính là PASS cho thao tác chưa thực hiện.

## File chính
domain/schema.ts, domain/legacy.ts, domain/territory.ts; data/foundation.ts, legacyFoundation.ts, territories.ts; engine/administration.ts, money.ts; persistence/migrations.ts, saves.ts; state/gameStore.ts; ui/StrategyMap.tsx, AdministrationPanel.tsx, App.tsx, ArchivePanel.tsx, theme.css; tests/administration.test.ts, foundation.test.ts; README, AGENTS, roadmap và báo cáo này. Các đường dẫn source trong danh sách bắt đầu từ src/.

## Giới hạn và việc chưa kiểm thử
- Địa đồ cách điệu và phạm vi một vùng thử nghiệm; ranh giới là phân khu hình học lồng nhau của campaign Fictional, không phải phục dựng địa giới lịch sử hay GIS toàn Trung Hoa. Quan hệ giáp ranh/bao chứa chính xác trong dataset này; bờ biển/sông chỉ tham chiếu. Mô hình bounds/projection có thể cần mở rộng polygon bất kỳ khi thêm dataset địa lý chi tiết.
- Chỉ có một quốc gia và trạng thái uncontrolled; external polities, tranh chấp/lịch sử đổi địa giới thuộc việc mở rộng sau. Không có simulation tạo thay đổi kiểm soát.
- Công trình/thuế/bổ nhiệm chưa thực thi; đã giữ governorId, budgets/resources, parent/level/location để phase sau sử dụng. Không có monthly tick.
- Migration/negative saves/mixed control được test bằng unit/fake-indexeddb; chưa gây hỏng database thật hoặc quota exceeded. Browser roundtrip v2 đã thực hiện; chưa lặp lại file chooser export/import trên browser trong Phase 2 (JSON roundtrip trong unit tests).
- Chưa test cross-browser, mất điện giữa transaction, hiệu năng quy mô toàn Trung Hoa. Mobile hoãn theo yêu cầu.
- Build có cảnh báo annotation comment Zod không chặn bundle; không thay đổi dependencies ngoài phạm vi.

**Đạt sáu tiêu chí Phase 2 trong phạm vi campaign giả tưởng thử nghiệm. Dừng, không tự triển khai Phase 3.**
