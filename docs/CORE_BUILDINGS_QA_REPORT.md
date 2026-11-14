# Kiểm tra bổ sung 7 công trình chính – 14/11/2026

## Phạm vi

Kiểm tra tập trung phần còn thiếu của cập nhật công trình, gồm giao thông theo tuyến, định mức nâng cấp, kho công, save cũ và UI. Không chạy Full QA, benchmark hay hồi quy 18 chiến lược × 3 seed × 240 tháng.

## Phát hiện và xử lý

| Vấn đề | Xử lý |
|---|---|
| Giao thông vẫn áp qua công trình hai đầu, không có chọn tuyến mới | Thêm chọn tuyến thật, dự toán theo chiều dài/địa hình, công trường và cấp nâng riêng cho tuyến được chọn. Tải/tốc độ/cước/hao áp đúng bộ cấp 1–3; bảo trì lấy từ Phủ chủ quản. |
| Nhu cầu vật tư xây dựng chưa nhân theo gói nâng 1,5×/2× | Engine xây dựng và sàn dùng chung định mức công trình đã lưu; không đặt mua trùng vật tư đang đi hoặc đã trả. |
| Save cũ chưa có cách phân biệt tác dụng công trình cũ và mới | Migration bổ sung `buildingRules: core-v1`; đánh dấu công trình đang có là kế thừa. Giữ cấp 4–5, tác dụng/bảo trì cũ, tiền/hàng, vật tư đã trả, tiến độ và cargo. Lệnh xây đã xếp trong save cũ vẫn xử lý được. |
| UI chỉ hiện tiền công cũ, chưa phản ánh giá nâng và điều kiện đặt | Tách bảng xây dựng, hiển thị giá gói/công-tháng/bảo trì sau nâng và dự toán theo giá sàn, khóa lệnh không hợp lệ; chọn tuyến cụ thể. |
| Kho mới dùng mức cấp nguyên bỏ qua tình trạng và giảm hao cả hàng tư nhân | Sửa hao theo cấp và tình trạng, sức chứa +40.000 thạch/cấp; chỉ kho công hưởng lợi. Kho kế thừa vẫn dùng quy tắc cũ. |
| Quyền lợi công trình Phủ cũ có thể bị mất khi đổi sang sản xuất tại Huyện | Giữ tác dụng vùng cho công trình Phủ kế thừa; công trình mới không cộng lặp từ Phủ. |

Schema vẫn là v6 với trường bổ sung tùy chọn; cơ chế đọc v1–v5 không bị bỏ. Khi tải v6 cũ, migration diễn ra trên bản sao và không ghi đè slot ngay. Các định mức tháng/cước dùng dữ liệu canonical; UI vẫn quy đổi bạc ×8, lương ×16.

## Kết quả kiểm tra

- Lượt tập trung 5 file: **63 test đạt** (`core-buildings`, `prefecture-economy`, `foundation`, `economic-units`, `market-orders`).
- Hồi quy kinh tế chọn phần 3.1–3.5: **16 test đạt**; cố ý bỏ 4 test kịch bản dài của phần 3.6.
- Sau sửa lỗi/kỳ vọng, chạy lại phần bị ảnh hưởng: **12 test core-buildings đạt**. Đây là chạy lại trong tập 79 test khác nhau bên trên, không cộng thêm vào số test.
- TypeScript strict check, lint mã nguồn và script UI mới: đạt.
- Production build: đạt; còn cảnh báo chunk lớn và chú thích thư viện Zod như trước.

Các ca mới kiểm tra: định mức/công-tháng/bảo trì theo cấp; giới hạn 3 cấp và vị trí Huyện/Phủ; từ chối lệnh trùng/sai; hiệu lực theo tình trạng; hóa đơn thật và vật tư tiêu thụ; đình trệ do thiếu hàng/bạc; nhu cầu sàn đúng gói nâng; kho công không bảo quản miễn phí hàng tư nhân; bonus tuyến không lan sang tuyến khác; chi phí theo km/địa hình; save cấp 5/cargo/công trường cũ và lệnh cũ; IndexedDB giữ tiến độ cùng tuyến đã chọn.

Kiểm tra tích hợp mới chạy **2 seed × 24 tháng**, có xây thủy lợi/giao thông, đóng rồi mở tuyến, năm sau chuyển hạn hán và save/load giữa chừng. Mỗi tháng kiểm tra sai số tiền/lương/từng mặt hàng <1e-5, công suất tuyến, schema và trạng thái sau tải. Đây là kiểm tra tính đúng đắn có giới hạn, không phải đánh giá cân bằng dài hạn.

## Playwright Chrome desktop

`scripts/core-buildings.e2e.mjs`: đạt, không pageerror. Kiểm tra bảy lựa chọn, hạn chế kho công/Huyện, dựng cấp 1, dự toán cấp 2 theo giá đang có, hoàn thành công trình, chọn và xếp lệnh đúng tuyến, xuất/nhập JSON, reload autosave khi đang xây, cấp 5 kế thừa và công trường cũ tiếp tục, lệnh cũ không bị loại bỏ.

Một lần kiểm tra UI thất bại vì kịch bản kỳ vọng giá gói cấp 2 giữ cố định 3.600 lượng sau nhiều tháng. UI thực tế hiển thị 2.976 lượng do giá vật tư giảm. Sửa kiểm tra để đối chiếu giá từ GameState hiện tại; không thay engine để ép giá về mức kỳ vọng.

Fixture UI chỉ tăng bạc vận hành và tồn vật tư để đảm bảo đủ đầu vào kiểm tra; không sửa hình học, tuyến nối hoặc chiều dài GIS. Không thay tài sản khởi đầu game.

- Log: `CORE_BUILDINGS_BROWSER.json`.
- Ảnh: `screenshots/core-building-tier2.png`, `screenshots/core-route-quote.png`, `screenshots/core-legacy-buildings.png`.

## Giới hạn

- Chưa chạy lại mọi script UI cũ hoặc thử mọi trình duyệt; các kỳ vọng cũ về địa điểm và tên công trình liên quan đã cập nhật.
- Chưa chạy benchmark và mô phỏng cân bằng 240 tháng theo chỉ thị tiết kiệm QA. Không suy ra bộ thông số này đã cân bằng dài hạn chỉ từ test bảo toàn.
- Các công trình phụ cũ vẫn hoạt động và được giữ trong save. Bộ giá/tác dụng mới cho từng nâng cấp phụ (cầu, bến, chợ, v.v.) chưa được chốt riêng; không tự tạo thêm menu hay cơ chế chưa có thông số.
- Nâng một công trình kế thừa chưa đạt cấp 3 bằng gói mới sẽ chuyển công trình hoàn thành đó sang bộ thông số mới; UI hiển thị rõ bảo trì và cấp tiếp theo. Không tự hạ cấp hoặc đổi công trình cấp 4–5.
