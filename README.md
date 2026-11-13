# Đế Nghiệp

Grand Strategy + Dynasty Simulation single-player, chạy hoàn toàn frontend. Hiện hoàn thành Foundation và Phase 2 Bản đồ & Hành chính; chưa có tick tháng hoặc mô phỏng kinh tế/chiến tranh.

## Chạy và kiểm tra
Node.js >=22.12, npm.

```sh
npm install
npm run dev
npm run check
npm run build
npm run preview
```

Vite mặc định http://127.0.0.1:5173. Build static trong dist, không backend/API key. check chạy typecheck, ESLint, Vitest và production build.

## Phase 2
Rework bản đồ hiện tại dùng polygon địa lý từ atlas riêng và hợp nhất ranh giới từ Huyện lên Châu; không còn render ô bounds. Nhãn thay đổi theo zoom và loại va chạm; bảng thông tin chia nhóm. Xem [báo cáo chất lượng bản đồ](docs/MAP_QUALITY_REWORK.md). Để kiểm thử UI tự động: chạy dev server, sau đó `npm run test:map-quality` (Google Chrome được cài trên máy). Script dùng browser context tạm, không sửa save của trình duyệt đang chơi.

Khởi lập triều đại → Nhận thiên mệnh để tạo campaign 3 Châu, 7 Phủ, 10 Quận, 24 Huyện. Các địa danh, dân số, ranh giới đều Fictional; không phải dữ liệu lịch sử hoặc địa giới Trung Hoa chính xác.

Chọn Cấp bản đồ để chuyển Châu/Phủ/Quận/Huyện. Click vùng hoặc Tab/Enter để chọn. Cây trong bảng Hành chính điều hướng/focus đến đơn vị; mở/đóng nhánh bằng mũi tên hoặc summary. Dân số/tài nguyên tổng từ Huyện; ổn định/quyền kiểm soát bình quân theo dân số (dân số 0 thì bình quân Huyện). Các cấp trên không lưu trùng dân số/hàng hóa.

Kéo bản đồ để pan; +/− để zoom; ⌖ đặt lại góc nhìn. Zoom, pan, cấp bản đồ và ID đang chọn nằm trong GameState, được lưu cùng hồ sơ. Settings nhãn/cỡ chữ vẫn chỉ là tùy chọn phiên UI.

Tiền tệ chung: **lượng bạc**, **1 lượng = 1000 đồng**. Các trường treasury/upkeep.money đều dùng lượng bạc; toCoins cung cấp chuyển đổi ra đồng. Không có thuế, lãi, sản xuất hoặc giao dịch mô phỏng trong Phase 2.

## Save
Thư khố hỗ trợ Ô 1–3, Autosave, export/import JSON. IndexedDB de-nghiep / saves lưu theo origin; localhost và 127.0.0.1 dùng kho khác nhau. Chỉ báo lưu thành công sau khi transaction hoàn tất. Xuất JSON để backup, file import tối đa 10 MB.

Schema v2/campaign 0.2.0 hỗ trợ migration từ save v1/0.1.0. Migration giữ nguyên dữ liệu cũ, không tự tạo dân số/lãnh thổ mới trong hồ sơ Phase 1. Hồ sơ cũ chỉ có trung ương sẽ hiển thị 0 Châu; khởi lập campaign mới để dùng dataset Phase 2. Không tự ghi đè slot v1 khi đọc. Các số tiền cũ được giữ nguyên trị số và định danh lại là lượng bạc theo quy ước nominal của campaign (1:1 đơn vị cũ, không khẳng định tỷ giá lịch sử). Save tương lai bị từ chối; slot hỏng không ngăn Continue tìm slot hợp lệ.

## Cấu trúc
- src/domain: Zod schema/types, bản v1 giữ ở legacy.ts phục vụ migration.
- src/data: nội dung campaign, profile, lãnh thổ và mạng thành/đường.
- src/engine: calendar, aggregation hành chính, geometry/selection thuần và tiền tệ; không React/DOM.
- src/state: Zustand, snapshot và thao tác lựa chọn/camera.
- src/persistence: IndexedDB, migration, JSON.
- src/ui: UI prototype hiện tại; không thay đổi trang chủ trong Phase 2.
- src/tests: invariants, aggregation, migration, roundtrip và persistence.

Xem [quy tắc](AGENTS.md), [roadmap](docs/IMPLEMENTATION_PLAN.md), [báo cáo Phase 2](docs/PHASE_2_REPORT.md). Chưa triển khai Phase 3; responsive mobile hoãn trong Phase 1–3 theo yêu cầu.


Bản đồ Phase 2 hiện sử dụng GIS Trung Quốc thật (Hà Nam), xem [nguồn và giới hạn](docs/REAL_GIS_REPORT.md). Chạy `npm run test:real-gis` khi dev server đang ở 5173, hoặc đặt `MAP_TEST_URL` để kiểm tra production preview.


Phạm vi GIS hiện tại: Hoàng Hà – Ordos – Ninh Hạ – Bắc Thiểm Tây, khoảng 229.944 km². Đây là đổi vùng thử nghiệm từ Lạc Dương, giữ ID và dữ liệu gameplay nhưng đổi vị trí địa lý. Xem [báo cáo phạm vi hiện tại](docs/EXTENT_200K_REPORT.md), bao gồm diện tích trước/sau, nguồn và tác động lên save. Báo cáo này thay thế các ghi chú phạm vi GIS cũ.


Bản địa giới hiện tại và diện tích theo cấp: [báo cáo cân bằng](docs/MAP_BALANCE_REPORT.md). Bản này thay thế các số liệu địa giới trước đó.
