# QA sau khi chuyển sang 24 lượt điều hành

Ngày 14/11/2026. Phạm vi theo yêu cầu: Full QA **trừ** 9 chiến lược bắt buộc × 3 seed × 240 tháng. Không chạy bộ 18 chiến lược lịch sử.

## Kết quả

| Hạng mục | Kết quả |
| --- | --- |
| TypeScript strict | Đạt |
| ESLint | Đạt |
| Unit và integration, loại `phase3-balance.test.ts` | 149/149 test, 18/18 file đạt |
| Production build | Đạt; Vite còn cảnh báo bundle lớn và chú thích thư viện Zod |
| Benchmark 100 Huyện, 294 tuyến, 240 tháng | 10,42 ms/tháng; ngưỡng ≤30 ms; nhanh hơn baseline 10,88 ms/tháng |
| Bảo toàn benchmark | Sai số lớn nhất 4,08e-10; ngưỡng 1e-5 |
| Playwright Chrome hiện hành | Đạt: ba lớp bản đồ, chọn lãnh thổ, nhãn, zoom/pan/reset/resize, chín mục Kinh tế, lệnh thuế/xây dựng/điều bạc, hai lượt/tháng, lưu/xuất/nhập/tải lại |

Test migration v5 ban đầu thất bại vì assertion cũ đòi object công trình giống hệt save v5. Migration hiện hành chủ ý thêm cờ `legacy: true` để giữ hiệu ứng công trình cũ. Assertion đã sửa để kiểm tra cờ này và đối chiếu toàn bộ dữ liệu vật lý/tiền còn lại; chạy lại 11/11 test ngân sách đạt, rồi toàn bộ 149/149 đạt.

Các script Playwright cũ `real-gis.e2e.mjs`, `map-quality.e2e.mjs`, `gap-fix.e2e.mjs`, `economic-units.e2e.mjs` thử chạy nhưng dừng ở selector UI đã thay đổi (tiêu đề bản đồ, combobox cấp bản đồ, hai nút “Xây dựng”). Chúng không chứng minh lỗi game. Kịch bản hiện hành `scripts/full-qa.e2e.mjs` thay thế phạm vi kiểm tra UI trong vòng này; các script cũ cần cập nhật nếu muốn dùng lại làm cổng QA riêng.

Ảnh minh chứng: `screenshots/full-qa-china.png`, `screenshots/full-qa-economy.png`. Báo cáo benchmark: `PHASE_3_PERFORMANCE.json`.

Chưa chạy bộ 9 chiến lược theo ngoại lệ của người dùng, nên đây là kết quả **Full QA trừ cổng cân bằng chiến lược**, không phải chứng nhận cổng đó đã đạt.
