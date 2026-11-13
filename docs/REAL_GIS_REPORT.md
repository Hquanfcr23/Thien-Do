# Phase 2 — Bản đồ địa lý thực tế

## Triển khai
- Thay hoàn toàn hình học Voronoi bằng 24 ranh giới Huyện GIS thật trong hành lang Tam Môn Hiệp – Lạc Dương – Trịnh Châu, Hà Nam. Ba Châu gameplay vẫn giả tưởng.
- Ranh giới Quận, Phủ, Châu và Trung ương là hợp polygon từ các Huyện trực thuộc theo parentId; không vẽ riêng. Giữ 45 ID, cây hành chính, dân số và các số liệu gameplay.
- WGS84 longitude/latitude → d3-geo Lambert conformal conic; mọi lớp dùng chung phép chiếu. Đường bờ, quốc gia lân cận, sông, hồ và vùng núi lấy từ Natural Earth.
- Camera tự fit vùng chơi, có toàn cảnh Trung Hoa, Reset View, wheel zoom theo con trỏ, pan giới hạn theo vùng chơi/viewport/panel, cập nhật khi resize. Nhãn theo tỷ lệ zoom so với khung vùng chơi, có tránh va chạm và tooltip tên đầy đủ.
- Panel hiển thị tên đơn vị GIS nguồn và tọa độ bên cạnh dữ liệu gameplay giả tưởng; giữ nguyên trang chủ và phong cách hiện tại.

## Nguồn, giấy phép và độ chính xác
Xem [manifest nguồn](GIS_SOURCES.json) để có metadata, URL phiên bản cố định và SHA-256 dữ liệu đóng gói.

- Natural Earth v5.1.2, countries 1:50m; rivers/lakes/geography regions/populated places 1:10m. Public domain theo https://www.naturalearthdata.com/about/terms-of-use/ . Độ chính xác phục vụ bản đồ chiến lược, không phải đo đạc địa chính.
- geoBoundaries gbOpen CHN ADM2, boundaryID CHN-ADM2-17275852, năm đại diện 2017, canonical County Level, commit 9469f09. Metadata ghi nguồn National Administration of Surveying, Mapping and Geoinformation of China / Revolutionary GIS, giấy phép Open Data Commons PDDL v1.0. Metadata gốc: https://www.geoboundaries.org/api/current/gbOpen/CHN/ADM2/ . Giữ tên nguồn/shapeID trong từng feature.
- Các ranh giới hiện đại là cơ sở hình học, không phải phục dựng địa giới một triều đại lịch sử. Tên triều đình, cơ cấu năm cấp và dữ liệu kinh tế/dân số vẫn Fictional. Không biến GIS hiện đại thành nhãn HistoricalAttested.
- Thành dùng điểm CHN của Natural Earth nằm trong Huyện khi có; nếu không có, dùng điểm đại diện nội vùng. Không khẳng định đó là vị trí thành cổ khảo cổ học. Đường nét đứt là kết nối gameplay giữa thành, chưa là tuyến đường GIS khảo sát. Vùng núi là polygon địa hình khái quát, chưa có DEM.

## Save và tương thích
Không đổi schemaVersion, campaignVersion, ID hay các trường gameplay. Hình học được suy ra từ dataset cục bộ, không ghi đè dữ liệu Huyện trong save. Mở rộng miền hợp lệ số camera để hỗ trợ phép chiếu và toàn cảnh; camera cũ ngoài giới hạn sẽ fit/clamp khi mở. Lựa chọn, layer và camera hợp lệ được giữ qua save/load. Không thực hiện migration phá dữ liệu.

## Tái tạo dữ liệu
Tải các file Natural Earth trong manifest vào `.audit/gis/{countries,rivers,lakes,terrain,places}.json` theo cùng thứ tự. Tải huyện đầy đủ từ `https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/CHN/ADM2/geoBoundaries-CHN-ADM2.geojson` vào `.audit/gis/counties.json`, rồi chạy `node scripts/prepare-real-gis.mjs`. Script chọn các Huyện theo tên/vị trí, ghép nhóm tiếp giáp với số con của cây hiện có; không sinh polygon ngẫu nhiên. Dữ liệu runtime đã đóng gói, không tải GIS từ mạng khi chơi.

## Kiểm chứng
- `npm run check`: typecheck, lint, unit tests và production build.
- `npm run test:real-gis`: Chrome headless/Playwright, chọn bốn cấp, kiểm tra nhãn ở ba mức zoom, kéo liên tục bốn hướng, wheel, resize, Reset View, lưu IndexedDB và reload phục hồi layer/camera; báo cáo máy đọc tại REAL_GIS_RESULTS.json.
- Unit tests kiểm tra nguồn 24 Huyện, tọa độ roundtrip, hợp ranh giới, không chồng diện tích, không lỗ trong vùng chơi, cây và phép tổng hợp, camera với pan cực trị ở nhiều viewport/zoom bằng giao diện tích thực, save/migration/validation.
- Screenshot toàn màn hình và crop bản đồ trong `docs/screenshots/real-gis-*.png`.

## Giới hạn
Dữ liệu nền làm bundle JS khoảng 4.17 MB (gzip 1.44 MB); Vite cảnh báo kích thước chunk. Chưa benchmark máy yếu, chưa kiểm tra thiết bị cảm ứng/mobile (được hoãn). Browser verification hiện trên Chrome, chưa Safari/Firefox. Không triển khai Phase 3 hay mô phỏng kinh tế mới.

## Kết quả chạy thực tế (2026-11-13)
- `npm run check`: PASS — TypeScript, ESLint, 6 test files / 51 tests, production build. Có cảnh báo chunk lớn, không có lỗi build.
- Playwright Chrome trên dev 5173: PASS. Chạy lại trên production preview 4173: PASS, `errors: []`.
- Chọn đúng lãnh thổ ở 4 cấp (3 Châu / 7 Phủ / 10 Quận / 24 Huyện); camera/layer/lãnh thổ được chọn khôi phục sau lưu và reload.
- Ba ảnh kiểm tra nhãn có `overlaps: []`. Đã xem thủ công ảnh full và crop: toàn cảnh có hình dạng Trung Quốc thật, vùng chơi có ranh giới huyện không dạng lưới; lúc fit hiển thị ba Châu và kinh đô, zoom gần hiện huyện.
- Đã thử pan 4 lần mỗi hướng, wheel, resize 1280×800 và 1440×1000, Reset View. Unit test bổ sung kiểm tra giao diện tích thực của vùng chơi với viewport tại các cực trị camera.
- Ảnh: [toàn cảnh](screenshots/real-gis-china.png), [vùng chơi](screenshots/real-gis-far.png), [zoom trung bình](screenshots/real-gis-middle.png), [zoom gần](screenshots/real-gis-near.png), [crop bản đồ](screenshots/real-gis-near-region.png), [resize](screenshots/real-gis-resized.png).
