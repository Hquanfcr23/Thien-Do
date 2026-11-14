# Phase 3 — Hoàn thiện và cân bằng kinh tế/dân số

Cập nhật 14/11/2026. Phạm vi là Phase 3; không triển khai Phase 4. Đã đọc Brief v1.1, kế hoạch và AGENTS. Chỉ thị mới của người dùng ưu tiên khi khác brief cũ. Giữ cây Trung ương → Châu → Phủ → Huyện, polygon GIS, ID, UI prototype và engine TypeScript thuần; sửa các module hiện có và thêm module ngân sách, không thay framework mô phỏng. Tất cả định mức là Fictional, không khẳng định là số liệu lịch sử.

Báo cáo bản trước được giữ tại `PHASE_3_REPORT_BEFORE_BALANCE.md`. Các số trước sửa lấy từ `PHASE_3_SCENARIOS_BEFORE_BALANCE.json`, không chạy lại engine mới rồi gọi đó là bản cũ.

## 1. Điều tra và nguyên nhân

- **Lệch thanh khoản công:** phần thuế lương tích trong kho trong khi Nhà nước chưa thể bán; thuế các hàng khác không đủ bù chi hành chính, bảo trì và cước. Chi trả dùng đến đồng bạc cuối, làm Phủ không còn vốn đưa thuế hiện vật về kho. Mô hình trước seed 42 thu 28.795,81 lượng, chi 34.795,81 lượng trong 240 tháng, tiêu hết 6.000 bạc Phủ khởi đầu; trung ương vẫn giữ 6.000 chưa điều phối.
- **Rò bạc tư nhân do sai phạm vi tổng hợp:** phí vận hành/gieo trồng trả cho dịch vụ và lao động trong Huyện lại chuyển sang ví thương nhân Phủ. Chi phí nhân công nội bộ không phải dòng tiền rời toàn bộ khối tư nhân Huyện. Cộng với mua hàng chưa có nhu cầu dùng, việc này làm kinh tế mở mất vốn sản xuất.
- **Bán thặng dư quá sớm:** dự trữ tư nhân 6 tháng cố định không phản ánh khoảng cách tới vụ sau, mùa đông và hạt giống. Giá/cầu trên sàn từng dùng toàn bộ khẩu phần dân cư dù dân đã có hàng, khiến sàn đặt nhu cầu quá cao.
- **Thuế trong mất mùa:** có đường thu thuế đồng nghĩa có thể lấy cả phần lương sinh tồn; đóng đường vô tình miễn thuế thực thu cho Huyện xa. Đây là một nguyên nhân lợi ích đóng tuyến trong khủng hoảng, không phải bằng chứng giao thông tự nó gây hại.
- **Kho miễn phí trên sàn:** lương trong lệnh bán chưa khớp và kho tư nhân sàn chưa bị hao hụt như kho công. Chính sách đẩy lương khỏi kho lên sàn có thể lách chi phí bảo quản.
- **Định mức bảo trì:** ba cơ sở khởi đầu tại mỗi Huyện từng tốn tổng 9 lượng/tháng; định mức riêng của nhiều công trình tương đương tỷ lệ vốn cao và không nhất quán.

## 2. Các sửa đổi đã thực thi

### Dự trữ tư nhân, cầu và giá

`householdReserve` tính lương cần từ tháng kế tiếp tới kỳ thu hoạch thật theo CropProfile, có khẩu phần đông và giống cho vụ chưa gieo; thêm 5% đệm. Huyện chỉ bán phần vượt mức này. AI giữ lại bạc giống và một phần vốn nhỏ trước khi mua. Không có mảng giá/cung/cầu được lưu tại Huyện.

Cầu mua Phủ lấy từ phần nhu cầu dự trữ chưa được tồn Huyện và hàng đang tới đáp ứng, cộng vật tư công trình; không coi mọi khẩu phần tự tiêu là cầu phải mua trên sàn. Cầu nguyên liệu gắn với định mức chế biến, vải tiêu dùng và công cụ thay thế; không tự mua đá/quân trang như hàng tiêu dùng thường xuyên. Giá Phủ vẫn dựa cung–cầu và giới hạn cũ; giá địa phương vẫn suy ra từ tham chiếu/cước/hao hụt. Hàng công đi kho và vật tư công trường không tính thành cung sàn.

Chi phí dịch vụ/lao động nội bộ vẫn chặn quy mô sản xuất theo khả năng ứng vốn, nhưng thanh toán trong cùng ví tư nhân tổng hợp có số dư ròng bằng 0; không tự chuyển bạc sang một chủ thể ở xa. Vật tư thật vẫn bị tiêu hao, trữ lượng vẫn hữu hạn, lao động vẫn cạnh tranh với xây dựng/quân dịch.

### Thuế và khả năng chi trả

- Với thuế suất ≤20%, bảo vệ lương sinh tồn tới vụ sau trước khi thu hiện vật. Thuế cao hơn giảm phần bảo vệ theo `(1 − thuế suất) / 0,8`; còn nguyên chi phí xã hội của thuế cao. Không biến đóng tuyến thành nguồn trợ cấp hay phạt trực tiếp chỉ vì đóng đường.
- Bổ sung lựa chọn Phủ **quy đổi tối đa một phần thuế mùa vụ sang bạc**; mặc định 40%. Số bạc thu được trừ đúng lượng hiện vật tương đương tại giá tham chiếu, không thu chồng. Chỉ nộp khi có đường/ở trị sở, dân không thiếu ăn đáng kể và còn bạc sau vốn giống. Nếu không nộp đủ bạc, phần còn lại vẫn chỉ thu hiện vật nếu còn hàng vượt mức bảo vệ. Tỷ lệ 100% là ưu tiên quy đổi tối đa, không tạo tiền hoặc bắt một ví âm để thực hiện tỷ lệ.
- Phủ giữ quỹ vận hành theo số tháng người chơi đặt; chi hành chính, bảo trì và công trình chỉ dùng phần được phép chi. Cước thu thuế có hạn mức; không dùng cả ngân khố để chở một lô thuế. Thanh toán hành chính bị cắt làm giảm năng lực thu thực tế qua `serviceLevel`, nên giữ tiền mà bỏ dịch vụ có đánh đổi.
- Bảo trì thống nhất bằng **0,25% vốn thay thế cấu hình/tháng**: tiền công nền + vật tư theo giá cơ sở, tương đương 3%/năm. Ba cơ sở ban đầu còn khoảng **3,454 lượng/Huyện/tháng**, được hiển thị đúng cùng config trong UI; công trình mới, giới hạn cấp và xuống cấp vẫn hoạt động.
- Sổ Phủ tách thuế, bán lương, mua dự trữ, hành chính, bảo trì, cước, xây dựng và điều ngân sách. Điều tiền giữa ngân sách công không bị ghi nhầm là thuế mới hay chi ra khu vực tư nhân.

### Lương công và bảo quản

Chào bán chỉ dùng phần vượt mức dự trữ công. Thương nhân mua bằng bạc thật, giới hạn bởi vốn và tồn quay vòng hữu hạn; hộ dân cũng có thể mua lương công trên sàn. Bạc chuyển vào ngân khố, hàng chuyển sang tư nhân hoặc cargo, không khớp được thì chờ. Rút lệnh chưa khớp đưa hàng về kho tại cùng trị sở.

Cả kho công, lương tư nhân sàn và lệnh công đều chịu hao hụt/bảo quản; phần vượt sức chứa làm hao hụt tăng. Xây kho lương nâng sức chứa và giảm hao hụt. Không còn cách giữ lương miễn phí bằng cách đẩy toàn bộ lên sàn.

## 3. Công cụ gameplay mới

Trong mục **Ngân sách & kho**:

- Xem số dư Phủ/trung ương, quỹ vận hành, lương công, mức dự trữ mục tiêu, hàng đang chào và tỷ lệ chi trả hành chính.
- Đặt số tháng dự trữ công, quỹ vận hành, tỷ lệ hành chính, tỷ lệ quy đổi thuế mùa vụ và bật/tắt tự chào phần dư.
- Chào bán/rút lệnh bán lương công, mua lương dự trữ từ hàng thực có trên sàn.
- Điều bạc trung ương ↔ Phủ và Phủ ↔ Phủ, kiểm tra số dư; đây là phân bổ ngân sách bằng sổ, không mô phỏng đoàn xe chở bạc.
- Chuyển lương giữa kho trung ương/Phủ qua đường GIS thật: có cước, thời gian, công suất và hao hụt; cargo bị giữ khi tuyến đóng. Cùng vị trí trị sở có thể chuyển quyền phân bổ ngay.
- Cứu trợ Huyện cụ thể từ kho Phủ, ưu tiên dân cư và cho phép dùng phần dự trữ bảo hiểm; Huyện xa vẫn chờ vận tải. Sửa lỗi Phủ xuất lương nhưng trung ương bị trừ cước: nguồn xuất nay tự trả cước.

Giữ chức năng cũ: bản đồ, chọn lãnh thổ không đổi tab, mùa vụ, dân số/lao động, chế biến, công trình, thương mại giáp ranh, điều hàng, thời gian 1×/2×/4×, báo cáo và IndexedDB.

## 4. Kết quả trước/sau

Cùng seed 42, cùng cấu hình đầu game 527.250 dân, 12.000 bạc công. Mỗi ca chạy 240 tháng. So sánh trước/sau bên dưới chỉ dùng thời tiết bình thường; không so mất mùa toàn bộ 240 tháng của bộ cũ với đợt hạn 24 tháng ở bộ mới.

| Phiên bản | Giao thông | Dân số cuối | Tổng ngân khố Phủ | Ổn định TB |
|---|---|---:|---:|---:|
| Trước | Mở tuyến | 553,316 | 0.00 | 70.94 |
| Trước | Đóng tuyến | 586,187 | 14.55 | 90.68 |
| Sau | Mở tuyến, mặc định | 603,521 | 8,454.70 | 99.22 |
| Sau | Đóng toàn bộ tuyến | 595,916 | 1,560.32 | 96.32 |

Bản cũ đóng tuyến tăng dân số hơn mở **32.871 người**; bản mới mở tuyến hơn đóng **7.605 người**. Dân số không được cộng thưởng vì mở đường; chênh lệch xuất phát từ vốn sản xuất, lương sinh tồn, thuế và phân phối.

## 5. Kiểm thử chiến lược dài hạn

**18 chiến lược × 3 seed (1, 42, 1701) × 240 tháng = 54 mô phỏng / 12.960 tick**, ghi mốc 12/60/120/240, tổng 216 checkpoint. Các ca hạn dùng tháng 121–144; thời tiết ngoài đoạn đó cùng chuỗi seed. Mỗi tick kiểm tra tiền và cả 9 hàng; kiểm tra schema ở cuối mỗi ca. Ngoài bộ mới vẫn chạy bộ 7 kịch bản cũ và integration/regression.

Seed 42; “thiếu lương” là cộng số Huyện-tháng thiếu trên 10% khẩu phần, không phải số người chết. “Thiếu chi” là số Phủ-tháng chi hành chính dưới 75%, mẫu tối đa 7×240 = 1.680.

| Chính sách | Dân số | Bạc Phủ cuối | Lương công cuối, kể cả lệnh chưa khớp | Thiếu lương | Thiếu chi |
|---|---:|---:|---:|---:|---:|
| Mở tuyến, mặc định | 603,521 | 8,454.7 | 13,475.5 | 142 | 457 |
| Đóng toàn bộ tuyến | 595,916 | 1,560.3 | 9,884.9 | 174 | 1013 |
| Cấm thương mại tư nhân | 601,685 | 24,542.5 | 13,872.1 | 148 | 754 |
| Thuế 5% | 622,818 | 1,186.6 | 11,946.0 | 155 | 1170 |
| Thuế 60% | 472,688 | 115,858.7 | 40,778.4 | 95 | 0 |
| Không bán lương công | 603,524 | 7,267.0 | 21,875.1 | 142 | 587 |
| Không đặt sàn dự trữ công | 603,581 | 8,398.3 | 12,314.1 | 144 | 353 |
| Dự trữ công 4 tháng | 603,524 | 7,267.0 | 21,875.1 | 142 | 587 |
| Thuế mùa vụ chỉ hiện vật | 600,632 | 1,021.5 | 16,027.4 | 151 | 1260 |
| Ưu tiên quy đổi bạc tối đa 100% | 604,144 | 56,519.2 | 7,231.0 | 140 | 0 |
| Điều ngân sách/cứu trợ theo quy tắc | 603,859 | 1,317.6 | 13,873.0 | 143 | 180 |
| Hạn 24 tháng, mở tuyến | 597,391 | 8,403.3 | 15,438.4 | 149 | 458 |
| Hạn 24 tháng, đóng tuyến | 580,212 | 3,721.8 | 10,168.2 | 263 | 1041 |
| Hạn, không đặt sàn dự trữ | 595,780 | 9,846.1 | 12,046.9 | 157 | 368 |
| Hạn, dự trữ 4 tháng | 597,399 | 6,880.7 | 23,703.1 | 149 | 573 |
| Hạn, thuế chỉ hiện vật | 571,907 | 972.6 | 16,818.4 | 433 | 1263 |
| Hạn, ưu tiên quy đổi bạc 100% | 597,524 | 54,444.3 | 8,054.9 | 150 | 0 |
| Hạn, điều phối theo quy tắc | 595,857 | 1,284.0 | 15,591.1 | 156 | 210 |

Trung bình ba seed:

| Chính sách | Dân số | Bạc Phủ | Huyện-tháng thiếu lương | Phủ-tháng thiếu chi |
|---|---:|---:|---:|---:|
| Mở tuyến, mặc định | 603,403.0 | 8,872.6 | 141.7 | 452.0 |
| Đóng toàn bộ tuyến | 595,794.0 | 1,554.7 | 175.7 | 1015.0 |
| Hạn 24 tháng, mở tuyến | 595,605.7 | 9,098.0 | 166.7 | 460.0 |
| Hạn 24 tháng, đóng tuyến | 581,738.3 | 2,304.8 | 269.0 | 1041.7 |
| Không đặt sàn dự trữ công | 603,413.0 | 8,809.7 | 142.3 | 348.7 |
| Dự trữ công 4 tháng | 603,403.0 | 7,670.7 | 141.7 | 581.7 |
| Hạn, không đặt sàn dự trữ | 595,064.3 | 10,119.3 | 169.3 | 369.3 |
| Hạn, dự trữ 4 tháng | 595,605.7 | 7,569.9 | 166.7 | 582.0 |
| Điều ngân sách/cứu trợ theo quy tắc | 603,466.0 | 1,379.1 | 143.0 | 176.3 |

Các assertion kiểm tra đánh đổi thực:

- Mở tuyến hơn đóng về dân số và thiếu lương ở cả thời tiết bình thường và đợt hạn thử nghiệm; mở bình thường có ngân khố lớn hơn đóng.
- Thuế cao có thu ngắn hạn cao hơn, nhưng dân số và ổn định dài hạn thấp hơn thuế thấp.
- Giữ 4 tháng lương công có tài sản dự trữ nhiều hơn và doanh số bán thấp hơn; trong đợt hạn ít thiếu ăn hơn ca không đặt sàn dự trữ, đổi lại ngân khố thấp hơn.
- Điều phối theo quy tắc giúp giảm thiếu chi hành chính nhưng dùng bớt quỹ đệm. **Không** ép kiểm thử để quy tắc này luôn thắng về dân số/thiếu lương: ở một số ca nó chi ngân sách hiệu quả cho dịch vụ nhưng cứu trợ không tốt hơn tự vận hành.

Đây là bằng chứng trong ma trận đã kiểm thử, không phải chứng minh mọi quyết định ở mọi trạng thái sandbox đều cân bằng. Cấm giao thương, thuế cao và hoarding có lợi/cost khác nhau; không bị gắn hình phạt tùy tiện để làm đẹp bảng.

## 6. Bảo toàn, save và hiệu năng

Save **v6**, simulation **revision 3**. Migration v5 → v6 chỉ thêm chính sách/sổ/ngưỡng dịch vụ; không cấp thêm bạc/hàng, không chia lại ví tư nhân hoặc sửa polygon. V1–v4 vẫn qua migration cũ rồi được bổ sung cấu trúc mới. Có fixture v5 thật tại `src/tests/fixtures/phase3-v5.json`, kiểm tra tồn/ví và roundtrip, lệnh chính sách đang chờ được giữ. Version chưa hỗ trợ vẫn bị từ chối, không tự ghi đè slot khi đọc.

Tiền toàn bản đồ và mọi hàng (dân, Nhà nước, sàn, lệnh công, công trường, transit) được đối soát sau từng tick với ngưỡng 1e-5. Kế toán luồng ngân sách không tạo bạc, thuế quy đổi không thu trùng, mua lương cần hàng/bạc, bán cần người mua. Đã sửa trường hợp sai số số thực rất nhỏ khiến lượng mua lương âm và sổ bán hàng âm; chặn lượng giao dịch ở 0, không che sai lệch lớn.

Sai số tối đa bộ cân bằng: **2.328e-10**; benchmark: **5.821e-10**.

Benchmark cùng fixture 100 Huyện, 10 Phủ, 294 tuyến, 240 tháng: **8.874 → 9.992 ms/tháng** sau thêm điều hành ngân sách, vẫn dưới 30 ms/tháng; tăng 12.6% thời gian. So với kiến trúc thị trường Huyện ban đầu 10.877 ms/tháng vẫn nhanh hơn. Không tuyên bố bản cân bằng nhanh hơn bản Phase 3 liền trước. Đo trên máy này, không là cam kết cho mọi thiết bị.

## 7. QA và minh chứng

- `npm run check`: TypeScript và lint đạt, **101 tests / 13 files** đạt. Bước build trong sandbox có một lần lỗi cấp phát bộ nhớ Node; chạy riêng `npm run build` ngoài sandbox sau đó **đạt**, gồm TypeScript và Vite production. Không sửa engine để né test. Build vẫn cảnh báo chunk >500 kB và annotation trong Zod như trước.
- `npm run test:economy-ui`: luồng Phase 3 cũ đạt (12 tháng, chính sách, xây dựng Huyện/Phủ, vận tải, dân số/báo cáo năm, migration/import/export, reload, 4×/pause).
- `npm run test:balance-ui`: luồng mới đạt (import v5, chính sách dự trữ, bán/mua lương, điều bạc, chuyển lương thật và đến kho, bảo toàn tiền, export/import v6, reload và tiếp tục). Không có page error. QA mua/bán dùng fixture kiểm soát: chuyển quyền sở hữu 1.000 thạch hiện có sang kho công tại cùng Huyện trị sở, giữ tổng hàng/bạc; tắt giao thương tư nhân để không bị mua hết hàng kiểm thử trước lệnh mua dự trữ. Đây là kịch bản QA riêng, không thay đổi dữ liệu khởi đầu game.
- Đã mở và xem ảnh: `screenshots/balance-budget.png`, `balance-public-sale.png`; thêm `balance-policy.png`, `balance-reserve-transit.png`. Giữ phong cách và bản đồ cũ, bảng cuộn để xem các công cụ.
- Unit mới kiểm tra chuyển ngân sách/không trả hai lần, hạn mức dự trữ, bán có người trả tiền, mua có hàng thực, cargo kho bị cắt/chờ/hao hụt, tồn sàn chịu hao hụt, vốn nội bộ không rò, bảo vệ sinh tồn và quy đổi thuế không thu chồng, migration/queue/roundtrip.

## 8. Giới hạn còn lại

- Phủ có thể thiếu chi ngay cả khi có số dư: quỹ đệm không phải tiền có thể tiêu tùy ý. UI hiển thị dịch vụ thực chi; người chơi cần điều ngân sách, giảm quỹ đệm/chi mục tiêu hoặc tăng nguồn thu. Không cam kết mọi Phủ luôn dư bạc với mọi thuế và lệnh xây.
- Quy đổi sang bạc giảm lương công tích được; tăng thuế quá mức có thể làm giàu Nhà nước nhưng làm nghèo dân và suy giảm dân số. Giữ quá nhiều lương gây hao hụt và thiếu bạc, bán quá nhiều giảm bảo hiểm khủng hoảng. Các quyết định không có “phương án tốt nhất” cho tất cả thước đo.
- Thị trường và ví tư nhân vẫn ở mức tổng hợp; không có từng doanh nghiệp/hộ. Cargo không tự tìm đường thay thế khi bị chặn; lô lớn không tự chia nhỏ. Đây là giới hạn cũ được giữ, không mở sang Phase 4.
- Bộ kiểm thử chưa bao quát mọi seed/chính sách tùy ý. Chỉ Chrome được kiểm tra UI; mobile vẫn hoãn. Benchmark là graph tổng hợp, không thêm huyện giả vào bản đồ game.
- Không commit/push/deploy. Gốc workspace không có .git; các file trước sửa của người dùng được giữ.

## File chính

`src/engine/budget.ts` (mới), `finance.ts`, `market.ts`, `economyContext.ts`, `construction.ts`, `month.ts`, `transport.ts`; `src/data/economicConfig.ts`; `src/domain/economy.ts`, `schema.ts`, schema V5/V2 để migration; `src/persistence/saves.ts`, `src/data/upgradeEconomy.ts`; `src/ui/BudgetPanel.tsx` (mới), `EconomyPanel.tsx`; `src/tests/budget.test.ts`, `phase3-balance.test.ts`, fixture v5 và các regression; `scripts/balance.e2e.mjs`, `economy.e2e.mjs`; `package.json` thêm lệnh UI QA.

Dữ liệu đối chiếu: `PHASE_3_SCENARIOS_BEFORE_BALANCE.json`, `PHASE_3_BALANCE_RESULTS.json`, `PHASE_3_PERFORMANCE_BEFORE_BALANCE.json`, `PHASE_3_PERFORMANCE.json`, `PHASE_3_BALANCE_BROWSER.json`, `PHASE_3_BROWSER.json`.


## Cập nhật thị trường theo lệnh mua / bán — 14/11/2026

Thay cung quy đổi 2–4 tháng bằng toàn bộ hàng đã tới sàn đang chào bán (hàng thương nhân + hàng công). Hàng trong dân, kho công chưa chào bán và cargo không nằm trong lệnh bán. Cột Đang về ghi riêng cargo thương mại và thuế phi lương thực; không cộng lần hai khi tới nơi. Lệnh mua được suy ra từ phần dự trữ tư nhân thiếu và vật tư công trình cần trong tháng, trừ hàng đã mua/có tại công trường, xét bạc có thể dùng và kết nối. Một ví chi trả cho toàn bộ giỏ nhu cầu, không cấp ngân sách độc lập cho từng hàng. Không thêm thị trường Huyện.

Giá mục tiêu = giá gốc × (1 + 0,75 × clamp((mua − bán)/min(mua,bán), −1, 1)). Không lệnh hai phía → giá gốc; chỉ có mua → 175%; chỉ có bán → 25%. Giá thực đi 25% về mục tiêu mỗi tick, bị chặn ở [25%,175%] giá gốc. Đây là hiệu chỉnh Fictional của Đế Nghiệp, lấy cảm hứng lệnh mua/bán; không tuyên bố sao chép toàn bộ cơ chế Victoria 3. Vẫn phải giao hàng thật, trả bạc thật và vận tải theo tuyến. Không phát sinh hàng/bạc do tính giá.

UI và engine dùng chung marketOrders; UI hiển thị tình hình lệnh hiện tại, giá là giá chốt lượt trước. Đây không phải lịch sử giao dịch thành công. Schema v6/revision 3 giữ nguyên; không chuyển tài sản, không cần migration cấu trúc. Save cũ đọc được, giá cũ được đưa vào giới hạn mới khi tiến tháng.

Kiểm thử: 79 test thuộc 9 file liên quan thị trường, kinh tế, ngân sách, bảo toàn, save/migration, kịch bản, cân bằng và benchmark đã đạt qua các lượt chạy (không chạy Full QA của bản đồ/camera). Bao gồm 15 test mới: cung thực, public listings, transit, khả năng thanh toán, đường bị cắt, hàng mua đang đi, vật tư đã có, giá cực trị/zero/đơn điệu, 60 tick bất biến đầu vào/bảo toàn và deterministic save/load. Bộ 7 tình huống × 3 seed kiểm tra mốc 12/60/120/240; bộ 18 chiến lược × 3 seed × 240 giữ đầy đủ. Sai số tiền/hàng mỗi tick <=1e-5. Typecheck, lint và build đạt; build còn cảnh báo kích thước bundle/Zod như trước. Playwright đạt kiểm tra 9 hàng/các cột, tồn thực khớp JSON, tiến tháng, lưu/tải thủ công, xuất/nhập và reload; ảnh `screenshots/market-orders.png`, kết quả `MARKET_ORDERS_BROWSER.json`.

Hai assertion cân bằng cũ được thay metric (không bỏ chiến lược hoặc sửa ngưỡng bảo toàn/benchmark): mở tuyến phải tăng thuế thực thu và hành chính thực chi so với đóng tuyến; điều phối ngân sách phải tăng tổng dịch vụ hành chính được tài trợ. Không bắt bạc dư cuối kỳ luôn lớn hơn, hoặc đếm tháng thiếu chi luôn thấp hơn, vì chi tiêu thêm cho dịch vụ có thể làm giảm tiền còn lại. Các chỉ tiêu này vẫn ghi trong JSON. Với mô hình mới mở tuyến: bạc cuối kỳ 1.129,07 so với đóng tuyến 1.184,60; hành chính 50.592,63 so với 23.167,85; số Huyện-tháng thiếu ăn 141 so với 175,67. Điều phối chi hành chính 57.310,73 so với 50.592,63, nhưng tháng thiếu chi 867 so với 847,33: hỗ trợ thêm chi trả nhưng chưa phải heuristic tối ưu.

Trước/sau (trung bình 3 seed; dân số là cuối kỳ, thiếu ăn là tổng Huyện-tháng):

| Chiến lược | Dân số | Bạc Phủ | Thiếu ăn | Chi hành chính |
|---|---:|---:|---:|---:|
| open | 603,403.00 → 602,456.00 | 8,872.60 → 1,129.07 | 141.67 → 141.00 | 73,564.49 → 50,592.63 |
| closed | 595,794.00 → 595,500.00 | 1,554.73 → 1,184.60 | 175.67 → 175.67 | 35,522.86 → 23,167.85 |
| coordinated | 603,466.00 → 601,504.00 | 1,379.06 → 1,128.27 | 143.00 → 143.00 | 97,367.77 → 57,310.73 |
| drought-open | 595,605.67 → 593,953.00 | 9,098.03 → 1,126.66 | 166.67 → 182.67 | 70,968.90 → 47,567.59 |
| high-tax | 472,759.00 → 475,315.67 | 115,652.48 → 90,965.29 | 93.00 → 83.33 | 95,311.52 → 95,793.69 |

Benchmark hiện tại: 9.577 ms/tháng, baseline cố định 10.877; sai số lớn nhất 4.37e-10. Không tăng ngưỡng hoặc bỏ test hiệu năng. Dữ liệu trước sửa: `MARKET_ORDERS_BALANCE_BEFORE.json`; sau sửa: `PHASE_3_BALANCE_RESULTS.json`, `PHASE_3_SCENARIOS.json`.

Giới hạn: đây là lệnh tổng hợp, chưa có sổ lệnh từng hộ hay khớp lệnh đấu giá. Mỗi lượt còn xử lý người mua theo thứ tự deterministic, không hứa chia đều hàng thiếu. Nhu cầu giá mới phản hồi ở lượt sau; vận tải bị cắt có thể giữ cargo chờ như trước. Giá rẻ do dư cung có thể làm giảm thu công; theo dõi cả dịch vụ chi trả, mức sống và dự trữ thay vì chỉ số dư bạc. Không triển khai Phase 4.

Playwright ngân sách mở rộng cũng đạt (`PHASE_3_BALANCE_BROWSER.json`): migration v5, bán lương có người trả tiền, mua dự trữ, điều bạc, vận chuyển kho công tới nơi, bảo toàn tiền và nhập/xuất/reload. Ảnh toàn bộ bảng 9 mặt hàng: `screenshots/market-orders-table.png`.


## Ngân sách và kho triều đình — cập nhật 14/11/2026

Triển khai `engine/centralFinance.ts`, `ui/CentralBudget.tsx` và mở rộng dữ liệu trong simulation.central. Mặc định nộp bạc 10% thu thực từ thuế/bán lương công; nộp lương 10% phần vượt dự trữ vào mùa thu hoạch của crop profile (cửa sổ ba tháng, một lần gửi thành công mỗi Phủ/năm). Đây là định mức Fictional, không khẳng định tỷ lệ lịch sử. Hạn mức hỗ trợ bạc 100 lượng/tháng toàn quốc, cứu đói tự động 0 thạch để người chơi chủ động bật vận tải đường xa; giữ lại trung ương 1.000 lượng/1.000 thạch.

Bạc nộp không tính trên số dư cũ hay tiền điều xuống. Phủ giữ quỹ đệm cộng chi thiết yếu tháng tiếp theo. Phủ đang hạn hán (rain<0,3) hoặc có Huyện thiếu ăn trên 10% tạm hoãn nộp bạc và lương. Khoản nộp thiếu được báo cáo, không thành nợ và không bị thu lặp. Một Phủ vừa nộp bạc không nhận hỗ trợ tự động ngược trong tháng đó. Hỗ trợ bạc ưu tiên thiếu quỹ lớn; hỗ trợ lương ưu tiên mức thiếu ăn cao, trừ cargo đã đến hạn đang đi để tránh đặt hai lần.

Vận lương về kinh và cứu trợ dùng tuyến thật, trả cước, chịu công suất, thời gian và hao hụt. Kho kinh chỉ nhập khi cargo `reserve` với đích trung ương tới nơi; cứu trợ mới dùng purpose `relief` và tới thẳng dân tại Huyện. Một cây đường đi tới kinh được dựng khi cần để tránh tìm đường riêng cho mọi lô. Thông số tuyến được tính lại sau xây dựng; sửa lỗi dùng cache công suất cũ khiến lệnh tự động bị từ chối sau thay đổi chất lượng đường. Cứu trợ chiếm tối đa 20% năng lực tuyến đang dùng để tránh bóp nghẹt hàng tư nhân. Lương nộp quá lớn so với năng lực có thể chỉ gửi được một phần trong lần nộp năm; không tự tạo nghĩa vụ nợ hiện vật.

Kho kinh có sức chứa chuẩn 12.000 thạch, hao cơ sở 0,6%/tháng, công bảo quản 0,0005 lượng/thạch/tháng; không trả đủ công làm tăng hao tối đa thêm 0,6 điểm phần trăm, quá tải tăng hao theo tỷ lệ vượt. Chi công chuyển bạc thật cho dân ở Huyện trị sở kinh đô, hao lương được ghi vào sổ bảo toàn. Các định mức ở `data/economicConfig.ts`. Tỷ lệ nộp/hạn mức/số dư bảo vệ được cấu hình bởi người chơi ở Kinh tế → Ngân sách & kho → Ngân sách triều đình.

Thanh trên cùng giờ đọc sổ nhập/xuất trung ương được lưu trong GameState thay vì chênh lệch tạm trong component. Lưu/tải/reload vẫn giữ biến động tháng trước. Báo cáo tháng ghi bạc vào/ra, lương nhập/xuất/hao, tiền bảo quản và phần nộp chưa đủ; điều phối thủ công và quân phí cũng vào sổ. Thu nộp nội bộ không bị cộng lại vào thuế quốc gia lần thứ hai.

Save v6 được mở rộng tương thích ngược bằng field central tùy chọn: nhánh decode v6 bổ sung chính sách/sổ rỗng khi chưa có; v5 cũng bổ sung cùng giá trị; v1–v4 qua upgradeEconomy. Không cấp thêm bạc/hàng khi migration; chỉ bắt đầu thu/chi/hao theo luật mới khi tiến tháng. Trạng thái lưu mới ghi chính sách, sổ tháng và năm nộp lương. Cargo purpose relief được nhận và tính như hàng dân cư đang về, không trở thành cung bán sẵn.

Kiểm thử cuối: chạy bộ đầy đủ 15 file/126 test; lượt đầu còn assertion cân bằng và hai assertion camera cũ, sau sửa chạy lại đúng hai file với 6 test đều đạt. Các file khác đã đạt, bao gồm benchmark. Không bỏ test hoặc tăng ngưỡng hiệu năng/bảo toàn. Assertion camera được cập nhật từ bắt buộc giữ vùng chơi trong viewport sang giữ nguyên pan tự do ở hai viewport và kiểm tra điểm neo zoom — phù hợp chỉ thị pan tự do trước đó; không thay engine camera trong cập nhật này. Assertion cân bằng giữ đủ 18 chiến lược × 3 seed × 240 tháng, thêm publicCash = trung ương + Phủ để đánh giá điều phối; đánh đổi dự trữ dùng doanh thu bán thực tế và lương giữ lại thay vì bắt số dư sau chi tiêu luôn thấp hơn. Các số dư và tháng thiếu chi vẫn giữ trong JSON.

10 test mới kiểm tra nguồn thu thực, không đánh thu trên viện trợ, quỹ bảo vệ, nộp lương theo mùa/một lần năm, chuyển thật và hao, thiếu tuyến, giới hạn viện trợ, hao/bảo quản, migration không cấp tài sản và 240 tick ledger/deterministic save-load. Bộ 7 tình huống × 3 seed có các mốc 12/60/120/240 cũng chạy; bảo toàn tiền/hàng <=1e-5 mỗi tick. Typecheck/lint/build cuối đạt. Do ổ C đầy, npm run check không chạy được: chạy trực tiếp tsc, eslint, vite và vitest bằng node trong project; thư mục tạm Playwright chuyển sang ổ D, không xóa dữ liệu người dùng. Build còn cảnh báo Zod/bundle lớn như trước.

Playwright `scripts/central-budget.e2e.mjs` đạt: tạo game, sửa/nộp chính sách, tiến tháng, số dư thay đổi, lưu thủ công, JSON export/import, reload giữ chính sách và delta. Ảnh `screenshots/central-budget.png`; log `CENTRAL_BUDGET_BROWSER.json` (ví dụ UI test: bạc +32,1 lượng/tháng, kho lương −36 thạch/tháng). Chạy lại UI thị trường `market-orders.e2e.mjs` cũng đạt. Không tuyên bố kiểm tra mọi trình duyệt; kiểm tra Chrome desktop.

Trước/sau (trung bình 3 seed; thiếu ăn là tổng Huyện-tháng):

| Chiến lược | Dân số | Bạc Phủ | Thiếu ăn | Chi hành chính | Tổng bạc công sau |
|---|---:|---:|---:|---:|---:|
| open | 602,456.00 → 601,877.00 | 1,129.07 → 1,128.15 | 141.00 → 144.33 | 50,592.63 → 57,160.98 | 2,124.69 |
| closed | 595,500.00 → 595,413.00 | 1,184.60 → 1,161.71 | 175.67 → 175.33 | 23,167.85 → 27,783.36 | 2,160.68 |
| drought-open | 593,953.00 → 593,187.33 | 1,126.66 → 1,166.80 | 182.67 → 189.00 | 47,567.59 → 54,816.72 | 2,163.33 |
| drought-closed | 581,585.67 → 581,561.00 | 1,095.97 → 1,095.72 | 269.33 → 269.33 | 21,808.16 → 26,550.94 | 1,990.33 |
| coordinated | 601,504.00 → 601,651.33 | 1,128.27 → 1,127.79 | 143.00 → 142.67 | 57,310.73 → 57,846.10 | 1,269.64 |

Benchmark cuối: 10.175 ms/tháng (100 Huyện, 294 tuyến, 240 tháng), baseline 10.877; sai số sổ lớn nhất 4.07e-10. Dữ liệu trước: CENTRAL_BALANCE_BEFORE.json; sau: PHASE_3_BALANCE_RESULTS.json, PHASE_3_SCENARIOS.json. Những lần đo đầu chậm hơn baseline được giữ trong log phiên làm việc; không đổi baseline/ngưỡng. Không chạy lại toàn bộ QA sau khi chỉ sửa assertion đã xác định.

Giới hạn: viện trợ không bảo đảm mọi Huyện thoát đói, vì còn tuyến, ETA, số dư bảo vệ và công suất; phân bổ theo mức thiếu hiện tại chưa tối ưu toàn cục. Cứu trợ từ kinh đến xa có thể kém hiệu quả hơn dùng kho Phủ, nên mặc định lương tự động tắt; người chơi chủ động đặt hạn mức. Nộp lương chỉ một lần gửi thành công/năm, lô bị chặn vẫn chờ; không tự đổi tuyến hoặc chia lại cargo đã đi. Kho kinh chưa có chuỗi nâng cấp riêng, sức chứa là cấu hình kịch bản. Không thêm bộ máy triều đình hoặc Phase 4, không commit/push/deploy.

## Quy ước đơn vị và sức mua (đính chính 14/11/2026)
Đã hủy hiệu chỉnh tăng vốn theo dân số: vốn công khởi đầu trở lại 12.000 lượng (6.000 tại kinh và 6.000 tại các Phủ), kho kinh 6.000 thạch lương, sức chứa 12.000. Tăng riêng ngân khố mà không đổi các khoản bạc khác làm tăng sức mua, không phải quy đổi đơn vị.
Lương thực thống nhất gọi là thạch lương trên giao diện. Đây mới là chuẩn hóa tên; chưa thay hệ số vật lý của mô phỏng. Không tuyên bố 0,025 thạch lương/người/tháng hiện tại là khẩu phần lịch sử.
Đổi thang bạc sau này phải áp dụng đồng bộ cho tiền công, giá, thuế, chi phí, ví tư nhân, ngân sách, lệnh đang chờ, báo cáo và save. Đổi thang lương phải bao gồm sản lượng, giống, khẩu phần, tồn kho, vận tải, quân lương và giá trên mỗi thạch. Mọi phép đổi phải giữ sức mua và số tháng dự trữ; chưa có hệ số lịch sử được chốt, nên không tự áp tỷ lệ 5 lần từ ví dụ.

## Quy đổi bạc và thạch lương – ming-inspired-v1 (14/11/2026)
Thay thế đính chính tạm thời ở trên: giữ vốn và engine canonical-v1, chuyển toàn bộ giao diện/đầu vào bạc ×8, lương ×16; giá lương ×0,5 và giá hàng khác ×8. Không cấp thêm tiền/hàng. Khẩu phần cơ sở 0,4 thạch lương/người/tháng, giá cơ sở 0,5 lượng/thạch lấy cảm hứng từ tham chiếu thời Minh; xem ECONOMIC_UNITS.md về nguồn và giới hạn. Không thay tỷ giá đồng/bạc gameplay.
Bổ sung domain/economicUnits.ts, cập nhật các panel kinh tế/ngân sách/hành chính, HUD, thư khố, báo cáo/năm và nhật ký. Lệnh từ UI đổi ngược một lần. Không migration tài sản vì raw save vẫn canonical, tương thích v1–v6 như trước. Cập nhật HUONG_DAN_CHOI.md và các kỳ vọng script UI liên quan.
Kiểm tra: 23 test liên quan đạt, gồm 3 seed ×12 tháng đối chiếu trạng thái hoàn toàn bằng nhau, lưu/tải mỗi tháng, hóa đơn và bảo toàn tiền/lương ở đơn vị mới. Playwright scripts/economic-units.e2e.mjs đạt các thao tác mới, không pageerror; ảnh và log ở ECONOMIC_UNITS_BROWSER.json và screenshots/economic-units-*.png. Không chạy bộ chiến lược dài, benchmark hoặc Full QA. Các script UI cũ mới chỉ được điều chỉnh kỳ vọng, không tuyên bố đã chạy lại toàn bộ.

## Chi tiết tác dụng công trình hiển thị trong UI
Mục Kinh tế → Xây dựng nay hiện thông số tác dụng theo engine cho cả 14 công trình. Ghi rõ điều kiện cấp/tình trạng, mức tăng cụ thể, giới hạn và phần phụ thuộc vào tuyến, nhân lực hoặc đầu vào. Các mô tả cũ như “bến cảng tăng bốc dỡ” đã sửa để phản ánh đúng: hiệu ứng vận tải cảng và kênh hiện đang dùng chung hệ số đường thủy. Không thêm bonus gameplay mới.
Typecheck, lint, build và 8 test economic-units đạt. Playwright xác nhận nội dung chi tiết khai khẩn ruộng (+10% đất), mỏ (+12 gỗ/đá, +6 quặng) và huyện nha (+3 điểm phần trăm tuân thủ thuế), cùng dữ liệu giá/tiền công. Screenshot `screenshots/building-effects.png`. Không chạy mô phỏng chiến lược dài.

## Hoàn thiện và kiểm tra bổ sung bộ 7 công trình (14/11/2026)
Đã bổ sung phần còn thiếu: giao thông nâng từng tuyến thực, dự toán theo km/địa hình, định mức mua vật tư theo gói nâng, giá/bảo trì trong UI, migration bổ sung cho công trình và lệnh xây cũ. Giữ tài sản, cấp 4–5, cargo và tiến độ cũ; xây mới tối đa 3 cấp. Hướng dẫn chơi được cập nhật theo chức năng hiện có.
Kết quả: 79 test tập trung khác nhau đạt qua hai lượt (63 + 16), sau sửa chạy lại 12 test công trình liên quan đạt. Typecheck/lint/build đạt; Playwright Chrome kiểm tra UI mới, xuất/nhập/reload và công trình kế thừa đạt, không pageerror. Ca tích hợp mới là 2 seed ×24 tháng; không chạy bộ chiến lược dài hay benchmark, không tuyên bố Full QA. Chi tiết các lỗi, test và giới hạn: CORE_BUILDINGS_QA_REPORT.md; ảnh screenshots/core-building-tier2.png, core-route-quote.png, core-legacy-buildings.png.

## Cổng cân bằng ưu tiên sau cập nhật công trình (14/11/2026)

Theo yêu cầu mới, `phase3-balance.test.ts` chỉ gồm 9 ca bắt buộc × 3 seed × 240 tháng = 27 mô phỏng/6.480 tick. Các ca là mặc định, thuế thấp/cao, dự trữ 0/4 tháng, xây thủy lợi chọn lọc tại 3 Huyện thiếu nước, xây thủy lợi tại toàn bộ 24 Huyện, nâng một tuyến bộ thực và hạn hán 24 tháng (tháng 121–144). Lệnh xây dùng `queueOrder` và được engine xử lý hàng tháng; không cấp vật tư/bạc nhân tạo. Kiểm tra schema, bảo toàn tiền và từng hàng mỗi tick, ghi mốc tháng 12/60/120/240. Sai số lớn nhất **2,91e-10**, dưới `1e-5`. Test đạt. Typecheck và lint của test đạt; không chạy Full QA/benchmark trong cập nhật này.

Kết quả trung bình 3 seed (dữ liệu bạc trong JSON là đơn vị engine canonical): mặc định dân số cuối 602.225, Huyện-tháng thiếu lương 144; thuế cao 475.226 dân và bạc công 95.902, thuế thấp 621.583 dân và bạc công 1.989. Giữ dự trữ 4 tháng còn 20.571 lương công so với 8.902 ở ca bán hết, nhưng thiếu lương gần như ngang nhau (145/145); tồn kho chưa tự giải quyết phân phối. Xây chọn lọc hoàn thành 3 công trình, có trung bình 101 tháng-công trường đình trệ; xây tràn lan hoàn thành 24, có 1.718 tháng-công trường đình trệ. Ca nâng tuyến hoàn thành ở seed 42 và 1701; seed 1 bị đình trệ đến tháng 240. Đây là vấn đề cân bằng/cung ứng cần điều tra trước khi khẳng định nâng tuyến luôn có lợi. Ca hạn hán tăng thiếu lương từ 144 lên 265 và giảm dân số cuối từ 602.225 xuống 584.619.

Kết quả đầy đủ: `PHASE_3_PRIORITY_BALANCE_RESULTS.json`. Kết quả 18 ca cũ trong `PHASE_3_BALANCE_RESULTS.json` được giữ làm mốc lịch sử, không phải cổng kiểm thử hiện tại. Các ca ngoài nhóm ưu tiên được hoãn theo `IMPLEMENTATION_PLAN.md`.

## Cập nhật thời gian: 24 lượt điều hành/năm

Mỗi tháng có lượt đầu và lượt giữa để xếp lệnh. Chỉ khi tiến từ giữa tháng sang tháng sau, engine chạy sản xuất, tiêu dùng, thuế, vận tải, bảo trì và báo cáo đúng một lần. Lệnh chờ được giữ giữa hai lượt; save v6 cũ thiếu pha lượt được đọc như đầu tháng. Không đổi công thức kinh tế và không chạy lại bộ chiến lược dài trong cập nhật này.


Kiểm tra cập nhật: typecheck, lint, production build đạt. Test tập trung lịch và kinh tế đạt; Playwright Chrome kiểm tra đầu tháng → giữa tháng → tháng kế, autosave/reload đạt; ảnh screenshots/decision-turn-mid.png. Bộ budget liên quan có một assertion migration v5 cũ thất bại do thuộc tính legacy của công trình được thêm khi chuyển save; đây không phải sai lệch lịch/lượt và cần xử lý riêng. Chưa chạy Full QA, benchmark hay bộ chiến lược dài theo chỉ thị tiết kiệm QA.

Quy định Full QA kể từ yêu cầu mới: chỉ gồm 9 chiến lược bắt buộc × 3 seed × 240 tháng. Các kết quả 18 chiến lược phía trên là lịch sử, không phải cổng Full QA hiện hành. Chưa chạy kiểm thử theo quy định mới trong lần cập nhật tài liệu này.


## QA sau 24 lượt (loại 9 chiến lược)

Đã chạy 149/149 test trong 18 file, typecheck, lint, build, benchmark 100 Huyện/240 tháng và Playwright hiện hành; chi tiết, lỗi assertion migration đã sửa, script UI cũ không tương thích và giới hạn được ghi tại [FULL_QA_24_TURNS.md](FULL_QA_24_TURNS.md). Bộ 9 chiến lược bắt buộc không chạy theo yêu cầu.

