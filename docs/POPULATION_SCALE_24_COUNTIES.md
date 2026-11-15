# Hiệu chỉnh dân số khởi đầu: 24 Huyện

Phạm vi triển khai: bước 1–4, chỉ cho **ván mới**; bước 5 hồi quy cân bằng và bước 6 kiểm tra bảo toàn, UI dân số, benchmark 100 Huyện đã chạy sau đó. Dữ liệu là Fictional, hiệu chỉnh cho gameplay; không phải điều tra dân số lịch sử. ID Huyện, ranh giới và cơ cấu Châu–Phủ–Huyện được giữ nguyên. Theo yêu cầu người dùng, không chạy riêng bài kiểm tra save cũ trong bước 6.

**Cập nhật sau bước tăng dân số:** cân bằng thuế, chi hành chính và tiến độ công trường đã được hiệu chỉnh tiếp. Các câu “không sửa công thức” bên dưới mô tả riêng bước tăng dân số ban đầu; số liệu cân bằng hiện hành nằm trong [báo cáo mới](POPULATION_BALANCE_REPORT.md).

## 1. Phân bố dân số

Đơn vị trong bảng: nghìn người. Tổng mới 1.680.000 dân / 24 Huyện = 70.000 dân/Huyện. Tây Lĩnh ít dân hơn trên mỗi Huyện do địa hình núi; Ninh Kinh và các Huyện ven sông đông hơn.

| Châu | Phủ | Huyện | Trước | Mới |
|---|---|---|---:|---:|
| Tây Lĩnh | Lâm An | Bắc An | 10,50 | 68 |
| Tây Lĩnh | Lâm An | Bắc Bình | 11,25 | 54 |
| Tây Lĩnh | Lâm An | Bắc Hòa | 12,00 | 62 |
| Tây Lĩnh | Lâm An | Nam An | 12,75 | 50 |
| Tây Lĩnh | Lâm An | Nam Bình | 13,50 | 56 |
| Tây Lĩnh | Sơn Bình | Bắc An | 15,00 | 50 |
| Tây Lĩnh | Sơn Bình | Bắc Bình | 15,75 | 60 |
| **Tây Lĩnh** | | **7 Huyện** | **90,75** | **400** |
| Trung Ninh | Ninh Kinh | Bắc An | 18,00 | 100 |
| Trung Ninh | Ninh Kinh | Bắc Bình | 18,75 | 90 |
| Trung Ninh | Ninh Kinh | Bắc Hòa | 19,50 | 80 |
| Trung Ninh | Ninh Kinh | Nam An | 20,25 | 75 |
| Trung Ninh | Ninh Kinh | Nam Bình | 21,00 | 65 |
| Trung Ninh | Hà Dương | Bắc An | 22,50 | 75 |
| Trung Ninh | Hà Dương | Bắc Bình | 23,25 | 65 |
| Trung Ninh | Bình Nguyên | Bắc An | 24,75 | 80 |
| Trung Ninh | Bình Nguyên | Bắc Bình | 25,50 | 70 |
| Trung Ninh | Bình Nguyên | Bắc Hòa | 26,25 | 60 |
| **Trung Ninh** | | **10 Huyện** | **219,75** | **760** |
| Đông Giang | Giang Khẩu | Bắc An | 28,50 | 95 |
| Đông Giang | Giang Khẩu | Bắc Bình | 29,25 | 85 |
| Đông Giang | Giang Khẩu | Bắc Hòa | 30,00 | 75 |
| Đông Giang | Giang Khẩu | Nam An | 30,75 | 65 |
| Đông Giang | Giang Khẩu | Nam Bình | 31,50 | 70 |
| Đông Giang | Đông Hải | Bắc An | 33,00 | 70 |
| Đông Giang | Đông Hải | Bắc Bình | 33,75 | 60 |
| **Đông Giang** | | **7 Huyện** | **216,75** | **520** |
| **Đại Ninh** | | **24 Huyện** | **527,25** | **1.680** |

## 2. Nguồn lực đầu ván

- Lương tư nhân khởi đầu giữ công thức `0,26 thạch/người` cộng mức nền địa bàn; đất canh tác, lao động, ví tư nhân, trữ lượng tự nhiên và nhu cầu tiêu dùng đã tính theo dân số nên tăng cùng quy mô. Đất khởi đầu miền núi đổi từ `0,08 × 0,8 = 0,064` lên `0,08 × 1 = 0,08` đơn vị/người cho **ván mới** để đủ lương trước vụ thu hoạch thứ hai; vẫn thấp hơn đồng bằng (`0,092`). Save cũ khi migration giữ định mức đất cũ. Không sửa công thức sản xuất, sinh, tử hoặc thiếu đói.
- Công cụ khởi đầu theo diện tích đất: ít nhất `diện tích × (0,01 cho vụ thu hoạch + 12 × 0,0003 hao mòn tháng)`, tối thiểu 30 bộ. Vải khởi đầu bằng bốn tháng nhu cầu `dân số × 0,0005 × 4`, tối thiểu 50 cuộn. Hai khoản này trước đây đều là số cố định cho mọi Huyện.
- Ngân khố công của ván mới tăng từ 12.000 lên 38.000 lượng, gần như giữ mức bạc công trên mỗi cư dân của kịch bản cũ. Trung ương giữ 19.000; 19.000 còn lại phân cho Phủ theo dân số quản lý thay vì chia đều. Đây là **tài sản khởi đầu** của kịch bản mới, không phải bạc sinh ra mỗi tháng và không cấp cho save cũ.

## 3. Giới hạn chưa điều chỉnh

Kho lương trung ương vẫn khởi đầu 6.000 thạch và sức chứa nền 12.000; công suất tuyến bộ/thủy vẫn là 500/1.600 mỗi tháng. Tăng các trần này sẽ thay đổi khả năng cứu trợ và thương mại của cả save cũ, nên cần đo trong bước cân bằng dài hạn trước khi quyết định. Công thức thuế, giá, trợ cấp, vận tải và xây dựng giữ nguyên.

## 4. Kiểm tra nhanh

Ván mặc định seed 42 trong 24 tháng: không có Huyện-tháng thiếu lương; sai số bảo toàn bạc và lương mỗi kỳ dưới `1e-5`. Cuối tháng 24: khoảng 1.708.964 dân, Trung ương 18.413 lượng, tổng quỹ Phủ 3.011 lượng; Phủ ít bạc nhất còn khoảng 194 lượng.

## 5. Hồi quy cân bằng

Đã chạy 9 chiến lược × 3 seed × 240 tháng; toàn bộ điều kiện kiểm thử đạt, sai số bảo toàn lớn nhất `9,31e-10`. Xem [báo cáo dễ đọc](POPULATION_BALANCE_REPORT.md) để so sánh và giải thích từng chỉ số; [JSON dữ liệu gốc](PHASE_4_BALANCE_RESULTS.json) giữ số liệu từng seed. Quỹ Phủ giảm mạnh trong kiểm tra ngắn, và kết quả dài hạn khác biệt lớn theo chính sách; cần đánh giá thêm trước khi kết luận cân bằng.

## 6. Tính đúng và hiệu năng

- 28 test liên quan đã qua, gồm sổ bảo toàn tiền/hàng, dân số khởi đầu, giao dịch và hai phép đo 100 Huyện. Sai số lớn nhất trong phép đo 100 Huyện ở quy mô 70.000 dân/Huyện là `1,86e-9`.
- Playwright trên trình duyệt Chrome đã đối chiếu HUD, Đế quốc, Hành chính ở cấp Châu/Phủ/Huyện, phạm vi Kinh tế và số dân sau một tháng mô phỏng với state. Ở **bước tăng dân số ban đầu**, màn hình hiển thị 1.680.000 rồi 1.680.916 sau một tháng; công thức sinh đã được hiệu chỉnh tiếp sau phép đo này. Không có lỗi JavaScript. [Ảnh kiểm tra](screenshots/population-scale-ui.png).
- [Benchmark 100 Huyện × 70.000 dân](POPULATION_100_COUNTY_PERFORMANCE.json): 7 triệu dân ban đầu, 294 tuyến, 240 tháng. Lần đo sau hiệu chỉnh thuế/công trường đạt **13,34 ms/tháng**, dưới ngưỡng **≤30 ms/tháng**; phép đo ban đầu là 15,45 ms/tháng. Đây là fixture tổng hợp được nâng dân số và nguồn lực theo tỷ lệ, không phải bản đồ 500 Huyện. Tốc độ có dao động theo máy và tải hệ thống; phép đo 500 Huyện cần kịch bản riêng, không suy ra từ số này.
- Không chạy riêng bài kiểm tra save cũ theo yêu cầu người dùng.
