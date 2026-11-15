# Vận tải qua đầu mối Phủ

Theo yêu cầu người dùng: triển khai trước khi mở rộng bản đồ; không tăng số Huyện hoặc dân số, không triển khai quân đội/chiến tranh mới.

## Hành vi hiện hành

- Huyện giữ dân, sản xuất, dự trữ, tài sản tư nhân và công trường. Không thêm sàn hoặc ngân khố Huyện.
- Thu gom/phân phối Huyện ↔ trị sở chỉ tìm đường trong Phủ chủ quản. Đường bị cắt thì Huyện bị cô lập khỏi sàn, không đi vòng qua Phủ khác để tiếp hàng.
- Mỗi cặp Phủ kề nhau có một hành lang suy ra từ đường GIS: trị sở nguồn → đường nội Phủ → cửa ngõ biên giới → đường nội Phủ đích → trị sở đích. Chọn đường có tổng tháng di chuyển nhỏ nhất, hòa thì chọn cước thấp nhất; thứ tự dữ liệu ổn định phá hòa còn lại.
- Tìm đường xa cho điều kho, cứu trợ và lệnh chuyển hàng chạy trên mạng đầu mối Phủ, ghép đoạn nội vùng đầu/cuối. Mỗi đoạn vẫn có thời gian, cước, hao hụt, công suất, mùa và phong tỏa. Không có hàng dịch chuyển tức thời.
- Thương mại tự động chỉ khớp giữa sàn hai Phủ kề nhau; không khớp Huyện biên giới trực tiếp. Không dò mọi cặp Huyện. Trung chuyển qua nhiều Phủ vẫn cần hàng thực đến sàn rồi được bán trong kỳ sau; không tạo lệnh xuyên nhiều sàn cùng một kỳ.
- Tối đa một lô thị trường đang đi cho mỗi cặp Phủ/mặt hàng, không mua hai chiều cùng kỳ. Không tái bán hàng chưa tới.

## Tiền, hàng và giới hạn giao dịch

Hàng xuất = min(công suất chưa đặt trên từng đoạn, năng lực thương nhân hai Phủ, tồn kho thương nhân dư sau nhu cầu nội Phủ, nhu cầu đích trừ tồn và hàng đang về, bạc người mua / giá đến nơi).

- Năng lực thương nhân Phủ là tổng năng lực thương mại Huyện đã có; không cấp năng lực hoặc bạc mới.
- Giá đến nơi/tải = giá sàn nguồn × (1 + thuế thương mại đích) + tổng cước từng đoạn.
- Chỉ giao dịch khi giá sàn đích × tỷ lệ còn lại sau hao hụt lớn hơn giá đến nơi.
- Bạc người mua chuyển sang ví thương nhân nguồn, thuế vào ngân khố đích, cước vào ví tư nhân tại trị sở nguồn. Tổng bạc bảo toàn.
- Hàng trừ khỏi tồn kho thương nhân nguồn, ghi thành lô `market`, nhập tồn kho thương nhân đích khi đến. Kho công và hàng công chào bán không bị tự động lấy để xuất khẩu.
- Vật tư công trường, thuế hiện vật và dự trữ sinh tồn vẫn theo luật hiện có. Hàng trên đường không sử dụng được.

## Save và UI

Không đổi cấu trúc save v9: hành lang Phủ chỉ là dữ liệu suy ra, lô hàng vẫn lưu đường GIS có ID ổn định. Save v1–v8 đi qua migration cũ. Lô hàng cũ giữ nguyên đường đi/mục đích/quyền sở hữu và tiếp tục chạy; không xóa hoặc viết lại hàng đang đi, không thêm tiền/hàng. Có test roundtrip lô cũ đi trực tiếp qua biên giới.

Mục Kinh tế → Vận tải ưu tiên cặp Phủ và cửa ngõ, kể cả cửa ngõ đang đóng để có thể mở lại. Đường nội Phủ nằm trong mục chi tiết. Bỏ thao tác chuyển hàng tư nhân giữa các Huyện khỏi màn này; lệnh cũ vẫn đọc được. Điều kho công ở Ngân sách & kho; cứu trợ Huyện chỉ hiện khi chọn đúng Huyện.

## Kiểm chứng và giới hạn

Kết quả mới: `PREFECTURE_TRANSPORT_BALANCE_RESULTS.json`, `PREFECTURE_TRANSPORT_PERFORMANCE.json`, `PREFECTURE_TRANSPORT_UI_QA.json`. Baseline ngay trước đổi: `PREFECTURE_TRANSPORT_BALANCE_BASELINE.json`, `PREFECTURE_TRANSPORT_BASELINE.json`.

Không kiểm thử mobile. Benchmark hiện chỉ chứng minh 100 Huyện, chưa chứng minh 500 Huyện. Mạng GIS vật lý vẫn giữ các đoạn Huyện để phục vụ đường nội vùng, công trình, địa hình và save; phần đã giản lược là quyết định giao thương và tìm đường dài ở cấp Phủ.

## So sánh cân bằng trước/sau

Bình quân 3 seed (1, 42, 1701), 240 tháng/seed. Cột có mũi tên là trước → sau. Huyện-tháng thiếu là tổng số Huyện thiếu mỗi tháng; công trường-tháng đình trệ là tổng số dự án đình trệ mỗi tháng. Đây không phải số người chết hoặc số công trường độc lập.

| Chiến lược | Dân số cuối | Bạc công cuối (lượng) | Huyện-tháng thiếu | Công trường-tháng đình trệ |
|---|---:|---:|---:|---:|
| Mở giao thương | 605,790.7 → 607,297.3 | 17,310.8 → 17,824.2 | 120.0 → 112.3 | 678.7 → 1,595.3 |
| Thuế thấp | 622,580.3 → 622,971.3 | 16,011.5 → 17,523.6 | 145.7 → 156.7 | 1,164.0 → 893.3 |
| Thuế cao | 484,152.7 → 483,102.7 | 198,090.8 → 215,269.2 | 16.7 → 22.7 | 2,368.3 → 2,468.7 |
| Bán phần được phép | 605,756.3 → 604,245.3 | 17,318.9 → 17,363.4 | 118.0 → 130.7 | 758.7 → 1,102.3 |
| Dự trữ 4 tháng | 605,782.7 → 611,677.3 | 17,318.4 → 62,509.7 | 119.3 → 82.7 | 734.0 → 2,125.0 |
| Xây chọn lọc | 605,060.7 → 607,833.3 | 17,324.6 → 17,892.1 | 123.3 → 107.3 | 717.0 → 1,633.0 |
| Xây dàn trải | 604,437.3 → 607,958.0 | 17,565.8 → 18,002.6 | 124.3 → 103.3 | 1,909.3 → 2,077.0 |
| Nâng đường | 605,876.3 → 607,223.0 | 17,316.3 → 17,848.2 | 118.7 → 112.3 | 653.7 → 1,606.0 |
| Hạn hán | 589,550.7 → 601,311.3 | 17,325.1 → 17,734.5 | 225.7 → 125.3 | 679.0 → 1,634.3 |

- Kịch bản mở: dân tăng và thiếu khẩu phần giảm, nhưng đình trệ công trường tăng rõ. Mạng đầu mối không bảo đảm vật tư/cước tương lai; luồng cung cấp và phân bổ nguồn lực thay đổi. Không bỏ kiểm tra tài nguyên để buộc dự án hoàn thành.
- Dự trữ 4 tháng giữ lương công nhiều hơn nhưng cũng có nhiều tháng công trường đình trệ hơn. Không coi kết quả này là mọi chiến lược đều tốt lên.
- Các điều kiện so sánh thuế cao/thấp, dự trữ/bán, xây dàn trải/chọn lọc, hạn hán và nâng đường đều đạt trong hồi quy. Không thay assertion để phù hợp kết quả mới.

## QA cuối

- `npm run check`: typecheck, lint, 24 file / 190 test và build production đạt.
- Hồi quy 9 chiến lược × 3 seed × 240 tháng đạt; sai số lớn nhất 2.91e-10, dưới 1e-5.
- Benchmark cùng fixture 100 Huyện / 10 Phủ / 294 tuyến / 240 tháng: 16.49 ms/tháng; mốc trước đổi là 17.73 ms/tháng. Dưới ngưỡng 30 ms. Số đo một lần, không suy ra mức tăng tốc cố định cho 500 Huyện.
- `scripts/prefecture-transport.e2e.mjs`: đạt luồng hành lang Phủ, đóng/mở cửa ngõ, đường nội Phủ, cứu trợ đúng phạm vi, save/reload, export/import, không tràn ngang và không pageerror. Đã xem ảnh desktop 1600×1000 và 1280×800.
- Build còn cảnh báo annotation của Zod và bundle GIS lớn như trước.

File chính: `engine/prefectureTransport.ts`, `transport.ts`, `economyContext.ts`, `market.ts`, `centralFinance.ts`, `month.ts`, `budget.ts`, `finance.ts`; `ui/TransportPanel.tsx`, `EconomyPanel.tsx`; test `prefecture-transport.test.ts`, `prefecture-economy.test.ts`; script UI mới và quy tắc AGENTS.md.
