# Báo cáo cân bằng sau hiệu chỉnh thuế và công trường

Đã chạy **9 chiến lược × 3 seed × 240 tháng** với 24 Huyện, tổng 1.680.000 dân lúc bắt đầu. Mỗi số trong bảng là **trung bình của 3 seed**; dân số, bạc và lương là số **cuối tháng 240**. Bộ kiểm thử đạt các điều kiện đã đặt ra; sai số bảo toàn bạc và hàng lớn nhất là `9,31 × 10⁻¹⁰`.

| Chiến lược | Dân số cuối | Bạc công cuối (lượng) | Lương công cuối (thạch) | Huyện-tháng thiếu | Thủy lợi hoàn thành | Công trường-tháng đình trệ |
|---|---:|---:|---:|---:|---:|---:|
| Mặc định, mở giao thương | 2.058.499 | 15.380 | 54.036 | 3,0 | 5,3 | 2.167 |
| Thuế thấp | 2.071.357 | 8.642 | 33.357 | 36,3 | 0,7 | 2.717 |
| Thuế cao | 1.814.912 | 26.171 | 90.126 | 0,0 | 8,3 | 2.475 |
| Bán lương công, không giữ mức dự trữ | 2.057.283 | 20.420 | 24.831 | 4,0 | 3,3 | 2.206 |
| Giữ dự trữ lương công 4 tháng | 2.057.719 | 46.625 | 91.633 | 4,3 | 5,7 | 2.328 |
| Ra lệnh xây thủy lợi có chọn lọc | 2.058.674 | 15.062 | 54.097 | 2,7 | 7,3 | 2.271 |
| Ra lệnh xây thủy lợi trên mọi Huyện | 2.058.446 | 14.623 | 52.065 | 2,7 | 21,0 | 3.038 |
| Ra lệnh nâng một tuyến đường | 2.058.495 | 15.375 | 54.038 | 3,0 | 5,3 | 2.411 |
| Mở giao thương, hạn hán tháng 121–144 | 2.014.446 | 13.332 | 51.682 | 42,3 | 5,0 | 2.142 |

**Cách đọc:** “Huyện-tháng thiếu” cộng số Huyện bị thiếu lương trong từng tháng; một Huyện thiếu trong 3 tháng được tính là 3. “Công trường-tháng đình trệ” cộng số dự án đang mở nhưng bị dừng trong từng tháng; một dự án dừng 3 tháng cũng được tính là 3. Các số lẻ xuất hiện vì bảng lấy trung bình 3 seed. “Thủy lợi hoàn thành” bao gồm cả công trình do Phủ tự mở, nên chiến lược nâng đường vẫn có thể có thủy lợi.

## Điều đáng chú ý

- **Thuế cao vẫn có đánh đổi:** bạc công cuối cao hơn mặc định khoảng 10.791 lượng, nhưng dân số thấp hơn khoảng 243.587 người (11,8%). Trước hiệu chỉnh, chênh lệch dân số là 444.891 người. Số Huyện-tháng thiếu bằng 0 không có nghĩa đời sống tốt hơn; thuế cao vẫn làm giảm mức sống và tăng trưởng.
- **Thuế thấp tăng dân số nhưng quỹ yếu:** dân số cao hơn mặc định khoảng 12.858, bạc công thấp hơn 6.738 lượng và có thêm 33,3 Huyện-tháng thiếu.
- **Mức thuế trung gian:** ở các mức thuế đất 20%, 30% và 40%, dân số cuối lần lượt khoảng 2,017, 1,965 và 1,913 triệu; bạc công không tăng đều vì xây dựng, thanh lý và dự trữ thay đổi theo dòng tiền. [Dữ liệu từng seed](TAX_RATE_SENSITIVITY.json).
- **Hạn hán tạo tác động rõ:** 42,3 Huyện-tháng thiếu, dân số cuối thấp hơn mặc định khoảng 44.053 người.
- **Công trường bớt đình trệ nhưng chưa hết nghẽn:** mặc định giảm từ 3.082 xuống 2.167 công trường-tháng, tương đương từ khoảng 89% xuống 74% tổng số công trường-tháng đang mở. Nhiều dự án vẫn chờ bạc hoặc vật tư đang vận chuyển. Xây tràn lan hoàn thành thêm thủy lợi nhưng có nhiều thời gian chờ hơn xây có chọn lọc.
- **Giữ dự trữ 4 tháng** nâng lương công cuối lên 91.633 thạch và bạc công lên 46.625 lượng. Dòng tiền cao là hệ quả gián tiếp của các quyết định tự chủ, chi xây dựng và giao thương; không phải bạc được tạo thêm.

## Những điều chỉnh đã áp dụng

- Thuế đất trên 20% giảm dần phần thu có thể thu: hệ số `max(25%, 100% − 1,25 × (thuế đất − 20%))`, trong đó phần trăm trong ngoặc tính bằng điểm phần trăm. Phần chưa thu ở lại với dân. Kiểm soát, ổn định, thi hành, dịch vụ và bảo vệ khẩu phần vẫn tiếp tục giới hạn thu thực.
- Tác động trực tiếp của thuế đất lên sinh giảm một nửa; tác động gián tiếp qua mức sống và khẩu phần vẫn giữ. Chi hành chính định mức giảm từ `0,004` xuống `0,0025` lượng/hộ/tháng sau khi dân số khởi đầu tăng lên 1,68 triệu.
- Công trường có thể mua vật tư và trả công theo phần tiến độ thực sự đủ tiền trong tháng, vẫn giữ quỹ an toàn 2 tháng. Phủ tạm không tự mở thêm dự án khi dự án hiện tại đang thiếu bạc, vật tư hoặc tuyến. Không cấp tiền, hàng hay tiến độ miễn phí.

## Kiểm tra

- `npm.cmd run check`: typecheck, lint, 196 test và production build đều đạt. Bộ 9 chiến lược × 3 seed × 240 tháng nằm trong các test này.
- [Benchmark 100 Huyện](POPULATION_100_COUNTY_PERFORMANCE.json): 13,34 ms/tháng qua 240 tháng; sai số bảo toàn lớn nhất `2,79 × 10⁻⁹`, dưới ngưỡng 30 ms/tháng và `10⁻⁵`.
- Playwright đã mở mục Thuế trên Chrome, xếp mức 60%, tiến một tháng, kiểm tra chính sách có hiệu lực và không có lỗi JavaScript. [Ảnh kiểm tra](screenshots/balance-recalibration-tax.png).

## Giới hạn

Đây là hồi quy định lượng trên 3 seed, không chứng minh mọi chiến lược đã cân bằng. Tỷ lệ đình trệ vẫn cao, nhất là vì bạc và thời gian vận tải; cần xem đây là giới hạn hiện tại thay vì tuyên bố vấn đề đã giải quyết hoàn toàn. [JSON dữ liệu gốc](PHASE_4_BALANCE_RESULTS.json) giữ từng seed và các mốc tháng 12/60/120/240 để tra cứu khi cần. Không chạy riêng bài save cũ theo yêu cầu trước đó.
