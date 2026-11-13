# Địa giới GIS: gộp theo cạnh và ưu tiên sông

Nguồn hình học: geoBoundaries gbOpen CHN ADM2, mã CHN-ADM2-17275852, năm 2017, metadata và PDDL v1.0 trong `GIS_SOURCES.json`. Đường sông Natural Earth 1:10m, public domain. Đây là ranh giới hành chính hiện đại, không phải phục dựng thời Hán; các tên và tầng quản lý của game là giả tưởng.

Giữ 24 ID Huyện gốc và phân bổ 323 polygon huyện thật; không cắt hoặc tạo polygon ngẫu nhiên. Script `scripts/expand-han-regions.mjs` dùng các đoạn biên có cùng hai đầu mút để xác lập liên thông theo cạnh, xác minh tất cả nhóm Huyện/Quận/Phủ/Châu đều liên thông, rồi hợp polygon theo từng nhóm. Danh sách nguồn/ID trong `GIS_COUNTY_MEMBERSHIP.json`. Đã thay đổi hình học của 10/24 Huyện so với bản mở rộng trước đó. Các cấp trên là hợp của con, theo parentId; dữ liệu gameplay và schema save không thay đổi.

Để ưu tiên sông, bước gộp phạt lựa chọn có đoạn thẳng nối hai điểm đại diện huyện cắt sông Hoàng Hà hoặc Trường Giang trong Natural Earth. Đây là heuristic, không bảo đảm mọi đường biên trùng sông, không xem xét DEM hoặc dân cư, cũng không tạo ranh giới lịch sử có chứng cứ. Phạm vi được chọn theo hộp tọa độ, nên biên ngoài còn chịu ảnh hưởng phạm vi nghiên cứu.

Diện tích hình cầu từ polygon: tổng 468.977 km²; Tây Lĩnh 163.945, Trung Ninh 109.634, Đông Giang 195.398 km². Chi tiết các cấp trong `HAN_SCALE_AREAS.json`. Tính bằng d3-geo, bán kính 6371,0088 km; số làm tròn km². Hai lỗ nhỏ ~1 km² vẫn có trong dữ liệu đầu vào. Các polygon nguồn có thể có đảo hoặc ngoại vùng; kiểm tra liên thông theo cạnh là ở mức huyện nguồn, không khẳng định tất cả thành phần polygon hình học đều nối liền.

Kiểm thử: `node scripts/expand-han-regions.mjs` xác nhận 323/323 huyện được phân bổ và đồ thị liên thông ở tất cả cấp; `npm run check` đạt typecheck, lint, 51 unit test, production build. Tests kiểm tra phủ, không chồng diện tích và hợp các cấp. Playwright Chrome chạy `scripts/real-gis.e2e.mjs` thành công cho bốn cấp, pan/zoom, resize, save/load, screenshot và nhãn. `real-gis-far.png`, `real-gis-middle.png`, `real-gis-near.png` là ảnh sau sửa. Bundle còn cảnh báo lớn.
