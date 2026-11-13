# Điều chỉnh địa giới và kiểm thử

Các lỗ GIS khép kín đã được xử lý bằng cách gộp toàn bộ đơn vị nguồn bị bỏ sót vào Huyện gameplay tiếp giáp, không thêm đơn vị gameplay. Sau đó thay polygon Alashanzuoqi có diện tích 78.910 km² bằng các tổ hợp huyện/kỳ nguồn tiếp giáp nhỏ hơn. Toàn bộ hình học là hợp nguyên vẹn 54 đơn vị geoBoundaries CHN ADM2 2017; bảng gộp cố định trong `src/data/gis/balanced-membership.json`, nguồn và giấy phép trong `GIS_SOURCES.json`. Các nhóm là quy ước gameplay giả tưởng, không phải địa giới thời Hán.

Tổng 237.254 km², 3 Châu / 7 Phủ / 10 Quận / 24 Huyện. Dải diện tích từ polygon địa lý:

| Cấp | Nhỏ nhất | Lớn nhất | Tỷ lệ |
|---|---:|---:|---:|
| Châu | 66.685 km² | 101.008 km² | 1,51 |
| Phủ | 23.257 km² | 53.955 km² | 2,32 |
| Quận | 16.846 km² | 35.976 km² | 2,14 |
| Huyện | 5.665 km² | 21.982 km² | 3,88 |

Huyện lớn nhất nhỏ hơn Phủ nhỏ nhất. Vùng phủ hợp thành một polygon, không có lỗ kín; kiểm tra các cấp cha bằng hợp con, không chồng diện tích và liên thông theo cạnh. Chi tiết diện tích tại `HAN_SCALE_AREAS.json`. Phép đo dùng hình cầu bán kính 6371,0088 km. Có chênh lệch địa lý còn lại giữa các Huyện vì sử dụng địa giới nguồn nguyên vẹn.

Giữ 24 ID, dữ liệu gameplay và định dạng save, nhưng bản đồ gắn các ID với vùng GIS mới: vị trí địa lý trong save cũ thay đổi. `npm run check` đạt 56 tests, typecheck, lint và production build. Playwright kiểm tra chọn bốn lớp, pan/zoom, resize, save/load và screenshot. Báo cáo `EXTENT_200K_REPORT.md` và `FIXED_COUNTY_MAP.md` mô tả bản trước, bảng diện tích hiện hành nằm trong báo cáo này.
