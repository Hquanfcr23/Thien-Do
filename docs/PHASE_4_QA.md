# Phase 4 — báo cáo QA và bàn giao

Triển khai các mốc 4.1–4.6 theo quyết định đã chốt trong chat; không có quyết định gameplay đang chờ. Công thức và bản đối chiếu hệ thống nằm trong `PHASE_4_IMPLEMENTATION.md`. Không commit, push hoặc deploy.

## Checks đã chạy

- `npm run check`: **đạt**, 21 file / 178 test; typecheck, ESLint và build production đạt.
- Sau đợt Việt hóa nhãn cuối: typecheck, lint và 28 test công vụ/tích hợp liên quan đạt; build cuối được chạy lại.
- Hồi quy **9 chiến lược × 3 seed × 240 tháng**: đạt toàn bộ assertion. Không sửa/bỏ assertion hoàn thành tuyến để làm đẹp kết quả; sau công thức quản trị mới do người dùng duyệt, seed 42 và 1701 hoàn thành tuyến, seed 1 vẫn chưa hoàn thành.
- Bộ 7 scenario bảo toàn có sẵn chạy qua `npm run check`, kết quả mới ở `PHASE_4_SCENARIOS.json`. Không chạy bộ 18 chiến lược lịch sử.
- `scripts/phase4.e2e.mjs`: đạt bằng Chrome/Playwright; không có pageerror. Kiểm tra tạo game, chuyển giao có độ trễ, ghi đè/hoàn nguyên chính sách, Châu Tùy chỉnh, chỉ thị xây và lý do trì hoãn, chi thanh tra đúng 20 lượng, chọn án lưu đày, save/reload, export/import và migration v6.
- Unit/integration kiểm tra thêm cả truy thu, bãi nhiệm, giam, lưu đày, tử hình, tha, án oan, tịch biên có/không có người mua và nợ còn lại. UI sentencing dùng fixture được cấp vốn riêng và hồ sơ kết luận để kiểm tra luồng, không tính các tài sản fixture này vào báo cáo cân bằng.
- Đã xem ảnh `screenshots/phase4-court.png`; giữ kiểu giao diện hiện tại. Không kiểm tra responsive mobile vì ngoài phạm vi. Các script GIS/map cũ không chạy riêng; unit map nằm trong check.

## Hiệu năng và bảo toàn

- Fixture 100 Huyện / 10 Phủ / 294 tuyến / 240 tháng: **20.91 ms/tháng**, đạt trần 30 ms.
- Baseline đo ngay trước đổi engine: **10.86 ms/tháng**. Phase 4 chậm hơn khoảng **92.6%**; không tuyên bố tăng tốc.
- Sai số tối đa benchmark: **4.66e-10**; hồi quy chiến lược: **2.33e-10**, đều dưới 1e-5.
- Tiền trong ví quan được đưa vào moneyTotal; điền sản/nợ không được đếm thành bạc. Migration v6/v5 kiểm tra tài sản không tăng và dữ liệu nguồn không bị sửa.
- Các báo cáo Phase 3 được giữ nguyên để đối chiếu; Phase 4 ghi file riêng.

## Cân bằng: cả lợi ích và bất lợi

Bình quân 3 seed sau 240 tháng. Bạc đã đổi sang lượng hiển thị (×8); Huyện-tháng thiếu là tổng shortageCount từng tháng, không phải số người chết. Hai chiến lược xây dùng hàng đợi lệnh Phase 3 để kiểm tra tương thích, không phải nút xây trực tiếp mới trong UI.

| Chiến lược | Dân số | Bạc công (lượng) | Huyện-tháng thiếu | Huyện có thủy lợi | Tuyến nâng cấp | Công trường-tháng đình trệ |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Mở giao thương | 605788 | 17310.8 | 120.0 | 0.00 | 0.00 | 678.7 |
| Thuế thấp | 622578 | 16011.5 | 145.7 | 0.00 | 0.00 | 1164.0 |
| Thuế cao | 484155 | 194257.5 | 16.7 | 15.67 | 28.33 | 2358.0 |
| Bán hết phần được phép | 605751 | 17318.8 | 118.0 | 0.00 | 0.00 | 759.3 |
| Dự trữ 4 tháng | 605782 | 17318.3 | 119.3 | 0.00 | 0.00 | 734.0 |
| Xây chọn lọc (lệnh cũ) | 605033 | 17324.3 | 123.3 | 3.00 | 0.00 | 713.0 |
| Xây dàn trải (lệnh cũ) | 604358 | 17560.8 | 126.0 | 23.67 | 0.00 | 1957.3 |
| Nâng đường (lệnh cũ) | 605830 | 17308.3 | 118.7 | 0.00 | 0.67 | 652.7 |
| Hạn hán, mở tuyến | 589548 | 17326.5 | 225.7 | 0.00 | 0.00 | 679.0 |

- Thuế cao thu nhiều bạc và cho đầu tư nhiều hơn, nhưng dân số thấp hơn rõ rệt. Thuế thấp giữ dân tốt hơn nhưng làm quỹ công và khả năng tài trợ công trường yếu đi.
- Xây dàn trải hoàn thành nhiều thủy lợi hơn xây chọn lọc, đồng thời tăng mạnh số tháng đình trệ và cho dân số thấp hơn. Không biến nó thành chiến lược luôn thắng.
- Trạng thái mở mặc định vẫn có nhiều công trường đình trệ (bình quân 678,7 công trường-tháng); quỹ khởi công theo giá/cước hiện tại không bảo đảm ngân sách, cung vật tư và giao thông tương lai. Người chơi có thể cấm loại đầu tư để đình chỉ và giữ vốn/vật tư. Đây là hạn chế cân bằng được công khai.
- Hạn hán tăng thiếu lương và giảm dân; không thêm thưởng/phạt nhân tạo cho đóng/mở tuyến.
- Nâng đường vẫn có seed 1 chưa hoàn thành sau 240 tháng; không gỡ kiểm tra tiền, dự trữ hoặc vận tải để buộc thành công.

## File và giới hạn bàn giao

- Domain/data: `court.ts`, `courtFoundation.ts`, ghi đè chính sách; schema v6/economy v3 cố định, fixture v6 và migration save v7.
- Engine: `court.ts`, `policies.ts`, `autonomousConstruction.ts`, `oversight.ts`; nối monthly tick, phân lao động, thị trường, tài chính và xây dựng.
- UI: CourtPanel, OversightPanel, ConstructionPolicyPanel; nối hành chính/hồ sơ, thuế kế thừa và bỏ nút xếp công trình trực tiếp.
- Phe phản ứng qua nguồn lợi thực và tỷ lệ thi hành; chưa có hệ thống nghị viện, kế vị hoặc tổ chức lịch sử.
- Điền sản hiện chỉ là quyền tài sản có thể mua và thanh lý khi truy tang; chưa mô phỏng thị trường địa ốc/tiền thuê. Không thêm đất/sản lượng từ quyền này.
- Build còn cảnh báo annotation của dependency Zod và bundle GIS lớn; build thành công. Không mở rộng sang tối ưu GIS hoặc redesign.
- `AGENTS.md` và `PHASE_4_STRUCTURE.md` là thay đổi đã có của người dùng; không ghi đè.

## Cập nhật vận tải qua Phủ (15/11/2026)

Theo yêu cầu mới, giao thương đường dài và tìm đường xa chuyển sang đầu mối Phủ; đường thu gom/phân phối nội Phủ vẫn có giới hạn vật lý. Kết quả trước đó là dữ liệu lịch sử. Kết quả, cân bằng và giới hạn hiện hành xem [PREFECTURE_TRANSPORT.md](PREFECTURE_TRANSPORT.md). Bộ 9×3×240 và kiểm thử UI vận tải đã chạy lại; số liệu lưu riêng với baseline trước đổi.
