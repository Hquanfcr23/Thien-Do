# Quy đổi đơn vị tham khảo Minh – ming-inspired-v1

## Tham chiếu và lựa chọn

- Nghiên cứu *Imperial Silver Laundering* ghi nhận giá gạo tại Tô Châu/Tùng Giang năm 1454 khoảng 0,5 lượng/thạch, khác mức quy đổi chính thức 0,25. Không dùng thuế suất quy đổi làm giá thị trường cố định. Nguồn: https://www.tandfonline.com/doi/full/10.1080/0147037X.2017.1364327 (trích yếu tìm kiếm; toàn văn bị 403 trong môi trường này).
- Tóm lược nghiên cứu của Taguchi về vận tải lương Minh mô tả một thạch khoảng 84 kg trong ngữ cảnh nghiên cứu và khẩu phần một thạch/tháng cho hộ 3–4 người. Nguồn: https://www.unp.or.jp/shared/img/1219_summary.pdf . Đơn vị lịch sử phụ thuộc loại hạt, cách đo và bối cảnh; không áp 84 kg cứng cho ngũ cốc tổng hợp của game.
- Game chọn **0,4 thạch lương/người/tháng cơ sở**, **0,5 lượng bạc/thạch lương giá cơ sở**. Đây là hiệu chỉnh Fictional/HistoricalInspired, không khẳng định khẩu phần thực tế thời Minh. Giữ hiệu ứng mùa và giá cung cầu, 1 lượng = 1.000 đồng vẫn là quy ước gameplay.

## Hệ số và bảo toàn sức mua

| Đại lượng | Từ canonical-v1 sang đơn vị người chơi |
|---|---:|
| Bạc: số dư, giá trị thuế, tiền công, trợ cấp, báo cáo | ×8 |
| Lương: kho, sản lượng, giống, tiêu dùng, vận chuyển, lệnh mua/bán | ×16 |
| Giá bạc mỗi thạch lương | ×8/16 = ×0,5 |
| Giá hàng khác và chi phí công trình bằng bạc | ×8 |
| Vật tư phi lương, diện tích, người, công-tháng, tỷ lệ | Giữ nguyên |

Số dư 6.000 bạc → 48.000 lượng; kho 6.000 → 96.000 thạch lương; sức chứa kho 12.000 → 192.000 thạch lương; thủy lợi tiền công 300 → 2.400 lượng. Tỷ lệ số dư/chi phí giữ nguyên. Khẩu phần 0,025 nội bộ → 0,4; giá 1 nội bộ → 0,5 lượng/thạch. Một hóa đơn 100 lương × giá 1 chuyển thành 1.600 thạch × 0,5 = 800 lượng, đúng 100 bạc ×8.

Tuyến dùng tải chuẩn hỗn hợp: một lượng lương nội bộ tương ứng 16 thạch lương. Giao diện hiển thị cả công suất tải chuẩn và thạch lương tương đương nếu toàn bộ chuyến chở lương. Không nhân công suất chung cho gỗ/sắt; thời gian và hao hụt giữ nguyên.

## Lưu trữ và biên lệnh

Engine và save v6 **giữ nguyên canonical-v1**, không thay schema hay migration v1–v5. Đây là thay thang đơn vị toàn bộ giao diện và đầu vào, không phải cấp vốn. `domain/economicUnits.ts` chứa profile và phép đổi; các panel dùng formatter theo loại đại lượng. Lệnh nhập qua `canonicalOrder` đúng một lần trước khi vào store. Giá và số lượng phải dùng hai hệ số khác nhau. Các lệnh đã nằm trong save vẫn là canonical và không được chuyển lần nữa.

Nhật ký lưu số canonical; `economicText` chuyển số gắn nhãn bạc/lương khi đọc để bao gồm báo cáo cũ. Giá trị số trong báo cáo được định dạng trực tiếp theo loại. Giao diện, không phải raw JSON, là nơi đọc đơn vị lượng/thạch mới. Không nên sửa raw save bằng số đang nhìn trên UI.

## Kiểm chứng

- 23 test đạt: foundation, vốn khởi đầu, quy đổi; ba seed ×12 tháng so sánh trạng thái hoàn toàn bằng nhau với mô phỏng cũ, có xuất/nhập save từng tháng.
- Kiểm tra hóa đơn, sức mua công trình, số tháng dự trữ, các loại lệnh bạc/lương/chính sách và sai số bảo toàn sau đổi <1e-5.
- Playwright Chrome đạt HUD, cung và giá thị trường, tiền công công trình, nhập chính sách, điều bạc/chào bán lương, tiến tháng và autosave/reload; không pageerror. Log `ECONOMIC_UNITS_BROWSER.json`, ảnh `screenshots/economic-units-market.png`, `screenshots/economic-units-budget.png`.
- Typecheck, lint và production build được chạy riêng. Không chạy Full QA, benchmark hoặc bộ chiến lược dài. Các script UI cũ được cập nhật kỳ vọng theo đơn vị mới, chưa chạy lại toàn bộ.

**Hiển thị bạc:** mọi số tiền được làm tròn đến lượng nguyên gần nhất khi trình bày; engine, sổ cái và save tiếp tục giữ độ chính xác lẻ để bảo toàn giao dịch.
