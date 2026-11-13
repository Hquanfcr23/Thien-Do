# Vùng thử nghiệm 200.000–400.000 km²

Đạt 229.944,200 km², tính từ polygon tọa độ WGS84. Không scale tọa độ hoặc CSS; thay 24 geometry huyện nguồn bằng 24 huyện/kỳ thật quanh Hoàng Hà – Ordos – Ninh Hạ – Bắc Thiểm Tây. Đây là đổi vùng thử nghiệm, không phải nới quanh Lạc Dương. Hạt nhân Ninh Kinh giả tưởng chuyển từ huyện Luoyangshi sang Dongshengshi. Cần cân nhắc sự thay đổi địa điểm này khi đánh giá.

| Châu | Trước (km²) | Sau (km²) | Phủ | Quận | Huyện |
|---|---:|---:|---:|---:|---:|
| Tây Lĩnh | 12.095 | 91.118 | 2 | 3 | 7 |
| Trung Ninh | 14.194 | 92.366 | 3 | 4 | 10 |
| Đông Giang | 7.621 | 46.461 | 2 | 3 | 7 |
| Tổng | 33.910 | 229.944 | 7 | 10 | 24 |

Tổng tăng khoảng 6,78 lần. Mỗi Huyện gameplay tương ứng đúng một huyện hoặc kỳ cấp huyện trong dữ liệu nguồn. Mỗi cấp cha là hợp polygon các con; bảng phân nhóm cố định trong `extent-counties.json` và `GIS_COUNTY_MEMBERSHIP.json`, không có thuật toán sinh vùng. Bảng chọn huyện được soát vị trí và shapeID để tránh tên trùng ở các tỉnh khác. Cả 45 đơn vị có hình học cập nhật theo nguồn; bộ cũ `han-seeds.json` chỉ để tham chiếu trước thay đổi.

## Nguồn và độ chính xác
geoBoundaries gbOpen CHN ADM2, boundaryID CHN-ADM2-17275852, year represented 2017, commit 9469f09, PDDL v1.0 theo metadata; nguồn National Administration of Surveying, Mapping and Geoinformation of China / Revolutionary GIS. URL metadata: https://www.geoboundaries.org/api/current/gbOpen/CHN/ADM2/ . Tên nguồn có thể phản ánh đơn vị cũ; không coi chúng là địa giới hiện hành năm 2026. SHA-256 và attribution trong GIS_SOURCES.json. Nền Trung Quốc và sông/địa hình: Natural Earth v5.1.2 public domain.

Quy mô Hán chỉ là tham chiếu thiết kế; phạm vi này không phải bản đồ Hán được phục dựng. Phủ và các tên triều đình Fictional, ranh giới hiện đại là dữ liệu cơ sở. Kỳ của Nội Mông được sử dụng như đơn vị cấp huyện tương đương, không tuyên bố đó là Huyện thời Hán. Không có dữ liệu dân cư lịch sử dùng để định ranh giới.

## Kiểm tra
`npm run check`: TypeScript, lint, 54 tests và build đạt. Kiểm thử mới tính diện tích từ lon/lat đạt mục tiêu, kiểm tra mọi nhóm Quận/Phủ/Châu/Trung ương liên thông theo cạnh nguồn, không chỉ chạm điểm. Tests sẵn có xác nhận bao chứa, con không lớn hơn cha, tổng diện tích và không chồng lấn. `node scripts/report-gis-area.mjs` hợp polygon theo từng cấp rồi đối chiếu diện tích hình cầu với tổng huyện, sai số yêu cầu <0,1 km²; các cấp đạt. Chi tiết trước: EXTENT_AREAS_BEFORE.json, sau: HAN_SCALE_AREAS.json.

Đo diện tích dùng bán kính cầu 6371,0088 km, không phải diện tích địa chính ellipsoid. Camera được sửa để kiểm tra phần giao với polygon thật, tránh vùng lõm khiến pan cực trị bỏ trống viewport. Playwright Chrome kiểm tra bốn lớp, chọn lãnh thổ, pan bốn hướng, zoom, resize, reset, save/load và chụp toàn cảnh. Ảnh extent-china-before.png / extent-china-after.png dùng cùng nút toàn cảnh Trung Hoa, cùng viewport, cùng phép chiếu và cùng khung panel.

## Save
Không đổi schema hay số ID. Giữ nguyên parentId, dân số, tài nguyên, ngân khố, nhân vật, lựa chọn, thành/tuyến và các trường gameplay. Save cũ tải được, dữ liệu kinh tế không bị phân phối lại. Hình học tĩnh mới thay đổi vị trí địa lý của các ID trong mọi save; camera cũ có thể bị căn lại nếu ngoài vùng mới. Đây là tái ánh xạ kịch bản địa lý, không phải khẳng định giữ nguyên tọa độ cũ. Không có Phase 3.

## Giới hạn
Vite còn cảnh báo bundle lớn (~4,2 MB JS trước gzip), chưa benchmark máy yếu. Chưa kiểm tra Firefox/Safari. Các báo cáo phạm vi cũ và GEOGRAPHIC_EXTENT_BLOCKER đã được thay thế bởi báo cáo này.

Kiểm chứng cuối: Playwright chạy lại thành công trên production preview 4173, không có pageerror, khôi phục đúng camera/layer/lãnh thổ đã chọn sau lưu và reload. `npm run check` hoàn tất thành công, 7 test files / 54 tests; build còn cảnh báo chunk lớn. Ảnh toàn cảnh trước/sau có cùng mức zoom 12%, pan có thể được clamp khác do vị trí vùng chơi thay đổi.
