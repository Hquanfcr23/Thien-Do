# Phase 3 — Cập nhật kinh tế tập trung tại Phủ

Cập nhật ngày 14/11/2026 theo yêu cầu trực tiếp mới. Đây là báo cáo phiên bản hiện hành; các công thức thị trường Huyện/thuế bạc 70–30%/trả vật tư ngay đầu công trình của bản trước đã được thay thế. Đã đọc Game Design Brief v1.1 và IMPLEMENTATION_PLAN; chỉ thị mới của người dùng ưu tiên khi khác nội dung cũ. Cây gameplay hiện tại: Trung ương → Châu → Phủ → Huyện. Không triển khai Phase 4; không sửa polygon GIS, ID Huyện, trang chủ hoặc phong cách giao diện. Các định mức là cấu hình Fictional.

## Dữ liệu và quyền sở hữu

| Cấp | Dữ liệu thực sự sở hữu |
|---|---|
| Trung ương | Ngân khố và kho lương trung ương, mặc định chính sách toàn quốc |
| Châu | Chính sách thuế, thương mại, phân bổ lao động/quân dịch; áp dụng cho các Phủ trực thuộc, không có market/kho/ngân khố |
| Phủ | Ngân khố bạc Nhà nước, kho lương Nhà nước; sàn giao dịch duy nhất của vùng: tồn hàng tư nhân, bạc thương nhân, cung/cầu, giá tham chiếu, lệnh thanh lý hiện vật công; công trình Phủ |
| Huyện | Dân số/hộ/lao động, đất/đất tốt/nước/cây trồng, trữ lượng tự nhiên, hàng sản xuất và lương trong dân, bạc tư nhân, công trình/công trường. Không còn `prices`, `demand` hay ngân khố Nhà nước |

Ngân khố được lưu duy nhất ở `simulation.prefectures[fuId].treasury`; bỏ trường `treasury` khỏi dữ liệu administrativeUnits mới để tránh trùng số dư. Bạc của dân là tài sản tư nhân, không phải ngân khố Huyện. Thông tin Phủ/Châu tổng hợp trong UI không làm phát sinh bản sao hàng hóa. Tồn hàng trên sàn thuộc tư nhân; Nhà nước chỉ sở hữu bạc, lương thực và các lệnh hiện vật công đang chờ khớp trên sàn. Vật tư dành cho công trường là lô hàng cam kết cho đúng công trình, không phải kho vật tư Nhà nước dùng chung.

Trị sở Phủ nằm tại một Huyện có thật trong cây/GIS. Thuế và hàng tiếp sàn phải tới trị sở đó bằng các cạnh GIS hiện có. Thương nhân giữa Huyện giáp ranh, kể cả khác Phủ, được đi trực tiếp mà không vòng qua trị sở.

## Công thức và pipeline

Engine TypeScript thuần, seeded RNG, 12 tháng/năm. Tick: chốt lệnh → lao động/thời tiết → sản xuất và tiêu dùng → giá/tiếp hàng/bán lẻ/giao thương → thuế/lương → vận tải/giao hàng → dân số → quân lương → mua vật tư/thi công/bảo trì → đối soát → báo cáo/đổi tháng. Hàng tới sau tiêu dùng chỉ phục vụ dân kỳ sau. Công trình hoàn tất tác động từ tháng sau.

- Giữ crop profile kê gieo tháng 4/thu tháng 9; lúa mì gieo tháng 10/thu tháng 6. Đất, lao động, giống, nước, công cụ và sức khỏe vụ quyết định thu hoạch. Khai thác trừ deposits hữu hạn; luyện sắt/công cụ/vải/quân trang tiêu hao đầu vào. Phí dịch vụ sản xuất chuyển từ bạc hộ sản xuất sang bạc thương nhân, không biến thành thuế Nhà nước.
- Cầu Phủ = tổng nhu cầu Huyện + vật tư công trình đang chờ. Không lưu mảng cầu độc lập tại Huyện; nhu cầu vật lý tính tạm trong tick. Cung quy đổi = (hàng thực trên sàn + các lệnh hiện vật công ngoài lương + hàng tiếp sàn đang tới) / số tháng dự trữ mục tiêu, 4 tháng với lương/2 tháng với hàng khác. Chỉ hàng đang tới sàn để bán ảnh hưởng kỳ vọng giá; lương thuế đi kho Nhà nước và vật tư cam kết cho công trường không nằm trong cung sàn. Mọi hàng transit không mua/tiêu thụ được trước giao hàng.
- Giá tham chiếu = clamp(0,75 × giá cũ + 0,25 × giá mục tiêu; 0,2–6 × giá cơ sở). Giá mục tiêu dùng tỷ lệ cầu/cung, giới hạn 0,3–5 lần giá cơ sở. Các giới hạn này là hiệu chỉnh gameplay.
- Giá mua tại Huyện = `(giá Phủ + tổng cước tuyến) / (1 − hao hụt gộp)`; giá bán tại nguồn = `max(0, giá Phủ × (1 − hao hụt gộp) − tổng cước)`. Trị sở không có chặng vận chuyển nội bộ. Tuyến bị cắt: không giao dịch tới sàn; giá mua thể hiện thiếu tiếp cận, giá bán về sàn bằng 0. Giá Huyện không lưu trong save.
- Thuế hiện vật danh nghĩa = lượng sản xuất thực tế trong kỳ × thuế suất Châu; thực thu chịu kiểm soát/ổn định/tham nhũng/hành chính và hàng thực có. Lương thực chỉ bị đánh thuế sản xuất khi thu hoạch đúng mùa. Thuế chuyển thành cargo có thời gian, công suất, cước do Phủ chi và hao hụt; chưa đến nơi chưa ghi bạc thanh lý. Mỗi Huyện–mặt hàng chỉ có tối đa một lô thuế đang đi; thu không được do tắc tuyến/thiếu cước được phản ánh là phần chưa thực thu, chưa có cơ chế truy thu nợ thuế.
- Thuế lương vào kho Nhà nước. Hiện vật khác vào lệnh thanh lý trên sàn: `lượng khớp = min(lượng chào bán, bạc người mua / giá tham chiếu)`. Người mua tư nhân trả bạc; ngân khố Phủ tăng đúng số bạc đó, hàng chuyển sang tồn tư nhân trên sàn. Nếu không có người mua đủ bạc, hàng chờ khớp; không in bạc để bảo đảm thanh lý bằng mọi giá.
- Thương nhân tiếp hàng sàn từ thặng dư của Huyện; hộ dân cũng mua hàng từ sàn. Cả hai luồng đều có cargo trên mạng GIS, giá và tiền đối ứng. Chênh giá giữa Huyện giáp ranh có thể tạo thương mại trực tiếp nếu đủ hàng, cầu, bạc, lao động thương nhân và công suất sau cước/thuế/hao hụt. Thuế thương mại nộp Phủ quản bên mua.
- Mỗi cặp Huyện–mặt hàng chỉ xét một chiều giao thương trong tick; không có vòng lặp tới khi thị trường cân bằng. Hàng mới xuất phát chưa thể giao lại trong cùng tick. Tiếp hàng sàn có giới hạn lô đang đi theo nguồn/mặt hàng. Thuật toán cạnh × hàng, không tìm cặp thị trường toàn bản đồ.
- Công trình kiểm tra Phủ chủ quản và tạo dự án khi ngân khố có bạc. Mỗi tháng dùng bạc Phủ mua phần vật tư cho tiến độ dự kiến theo giá hiện tại, ghi bên nhận là thương nhân. Vật tư tới Huyện xa bằng cargo; chỉ lượng đã tới công trường mới được tiêu hao thành tiến độ. Tiền công trả theo công thực hiện; thiếu bạc/vật tư/tuyến/lao động hiển thị nguyên nhân đình trệ. Công trình Phủ chia sẻ lao động hữu hạn ở Huyện trị sở. Không thu tiền hoặc vật tư trọn gói lần thứ hai.
- Giữ 14 nhóm công trình, giới hạn cấp và bảo trì/xuống cấp. Công trình Phủ ảnh hưởng các Huyện/tuyến trực thuộc khi phù hợp. Kho lương Phủ giảm hao hụt lương công; hạ tầng tác động công suất/thời gian/cước. Hàng dư sau công trình trở lại tồn vật lý tại địa điểm; công trường nhận hết lô cuối trước khi bị xóa khỏi danh sách.
- Quân lương công ở trị sở lấy từ kho Phủ; quân tại Huyện xa mua lương vật lý tại chỗ nếu Phủ đủ bạc. Điều lương công từ Phủ dùng lệnh cứu trợ có vận tải, không rút lương ở xa tức thời.
- Cước phụ thuộc km/đường bộ–thủy/hạ tầng. Hao hụt tăng theo khoảng cách, vùng núi và tình trạng tuyến, giảm bởi depot/đồn. Khởi hành chiếm công suất đúng một lần; tuyến đóng giữ cargo. Không tạo kết nối GIS mới.

## Bảo toàn, migration và hiệu năng

Save mới v5, simulation revision 2; campaign vẫn 0.2.0. Các schema/initializer cũ chỉ phục vụ đọc v1–v4. Migration giữ ID, parentId, polygon, dân số, tồn hàng, số bạc hiện có, cargo và lịch sử; ngân khố Huyện/Châu cũ chuyển vào Phủ chủ quản hoặc trung ương. Giá Huyện cũ gộp thành giá Phủ bình quân theo dân số; cầu gộp cộng. 10% bạc tư nhân Huyện chuyển thành vốn thương nhân sàn trong cùng Phủ; 20% hàng tư nhân ở đúng Huyện trị sở chuyển sang tồn sàn tại cùng vị trí, không chuyển hàng từ xa tức thời. Tổng tiền/hàng của save v3/v4 không tăng do chuyển đổi. V1/v2 chưa có bạc tư nhân: khởi tạo ví tư nhân bằng 0, không tự cấp bạc khi nhập. Công trình cũ đã trả đủ vật tư được đánh dấu đã tài trợ, không thu lại. Đọc không tự ghi đè slot.

New game chuyển 50% ngân khố trung ương ban đầu sang 7 Phủ (tổng bạc công không đổi: 6.000 trung ương + 6.000 tại Phủ). Ví tư nhân mới vẫn là vốn khởi đầu cấu hình, được công bố trong fixture; không phát sinh mỗi lượt. Người chơi có lệnh cấp bạc trung ương cho Phủ.

Mỗi tick đối soát:

`Tiền = trung ương + ngân khố Phủ + ví dân Huyện + ví thương nhân sàn`.

`Hàng cuối = hàng đầu + sản xuất − đầu vào/tiêu dùng − hao hụt`, bao gồm tồn trong dân, lương Nhà nước, tồn sàn, lệnh công, vật tư công trường và mọi cargo. Sai số tuyệt đối cho tiền và từng loại hàng phải ≤ 1e−5; sai lệch/NaN/tồn âm đáng kể làm tick thất bại. Deposits tự nhiên không phải tồn hàng; khai thác ghi nguồn sản xuất và giảm trữ lượng.

Tối ưu: nhu cầu và giá địa phương tính một lần/Huyện/tick; route metrics tính một lần/tuyến/tick; tuyến tới trị sở dùng memo có khóa đầy đủ topology/blocked/thời gian chặng với giới hạn 64 bộ, nên đổi tuyến/hạ tầng/mùa cập nhật đúng. Báo cáo và lịch sử bất biến chia sẻ nội dung, chỉ sao chép mảng thay vì clone toàn bộ 240 báo cáo mỗi tháng. Mutable simulation vẫn được clone, test xác nhận không sửa input. Validation sâu ở save/store/import; tick kiểm tra sổ và số hữu hạn, không Zod-parse lại toàn bộ state nhiều lần.

Benchmark dùng cùng fixture đã lưu **100 Huyện, 10 Phủ, 294 tuyến, 240 tháng** cho bản cũ và mới. Đây là graph tổng hợp chỉ để đo tải; bản đồ chơi vẫn 3 Châu/7 Phủ/24 Huyện GIS.

- Bản cũ: 10.877 ms/tháng.
- Bản mới: 8.874 ms/tháng, 2129.8 ms/240 tháng; giảm 18.4% thời gian, dưới 30 ms/tháng.
- Sai số bảo toàn lớn nhất trong benchmark: 5.239e-10.
- Đo trên máy phát triển này, chạy tuần tự để tránh test tranh CPU; không phải cam kết tốc độ cho mọi thiết bị. Dữ liệu gốc: PHASE_3_BASELINE.json, PHASE_3_PERFORMANCE.json, fixtures/economy-v4-100.json.

## Kiểm thử thực tế

`npm run check`: TypeScript strict, lint, **89 tests / 11 files**, production build đều đạt. Các kiểm tra có ý nghĩa mới: không có ngân khố/giá/cầu tại Huyện; bảo toàn migration v4, giá gộp bình quân từ save cũ, loại lương thuế/cargo công trường khỏi cung sàn; chính sách Châu và save; công thức nội suy; thuế sắt đi rồi mới thanh lý; người mua không đủ bạc; công trình thiếu hàng, thiếu bạc, vận tải vật tư từ Phủ; giao thương trực tiếp giữa hai Huyện GIS khác Phủ. Kiểm thử cũ điều chỉnh theo mô hình mới, vẫn giữ deterministic/input immutability, mùa vụ, finite labour/deposits/recipes, cargo delay/capacity/closures, IndexedDB và roundtrip.

Bảy kịch bản × ba seed (1, 42, 1701), mốc 12/60/120/240 tháng có 84 checkpoint được ghi lại ở PHASE_3_SCENARIOS.json. Mỗi tick kiểm tra bảo toàn, kèm điều kiện state hợp lệ ở cuối các kịch bản. Seed 42 ban đầu 527.250 dân, 12.000 bạc công (riêng bankruptcy là 0); sau 240 tháng:

| Kịch bản | Dân số | Ngân khố Phủ | Lương công Phủ | Tổng lương kể cả transit | Ổn định TB |
|---|---:|---:|---:|---:|---:|
| normal | 553,316 | 0.00 | 39386.13 | 227220.18 | 70.94 |
| drought | 325,482 | 251.92 | 12620.68 | 73639.54 | 40.14 |
| high-tax | 407,443 | 3230.53 | 90348.76 | 335880.76 | 0.00 |
| labour-shortage | 32,439 | 0.00 | 819.46 | 8333.46 | 0.00 |
| routes-cut | 586,187 | 14.55 | 38993.33 | 282277.69 | 90.68 |
| infrastructure | 568,486 | 0.00 | 40916.74 | 220257.78 | 78.60 |
| bankruptcy | 553,109 | 0.00 | 38791.69 | 217417.22 | 70.93 |

Playwright Chrome chạy thành công 12 tháng, UI thị trường Phủ, điều chỉnh chính sách, công trình Huyện, vận tải, dân số, báo cáo năm, IndexedDB, JSON import/export, reload, migration v2, tốc độ 4×/pause; thêm kiểm tra **công trình Phủ đình trệ khi sàn thiếu vật tư**. Không có page error. Sandbox chặn loopback ban đầu; máy chủ Vite và Chrome cùng chạy ngoài sandbox đã kiểm tra được. Kết quả mới: PHASE_3_BROWSER.json. Đã mở và xem screenshot thực:

- screenshots/phase3-prefecture-market.png
- screenshots/phase3-prefecture-stalled.png
- screenshots/phase3-construction.png
- screenshots/phase3-transport.png
- screenshots/phase3-reports.png

## Giới hạn và cân bằng còn tồn tại

- Bản thường có thể cạn bạc Phủ dài hạn trong khi tích nhiều lương công; thương nhân có lúc thiếu tiền mua thuế. Người chơi phải điều ngân sách/cứu trợ. Chưa có công cụ bán lương công, truy thu thuế hoặc chính sách dự trữ nâng cao; không tự tạo bạc để che thiếu thanh khoản.
- Trong cấu hình hiện tại, đóng toàn bộ tuyến vẫn có thể làm dân số tăng cao hơn bản mở đường: các Huyện tự túc, không xuất thặng dư/không mất cước và thuế vận chuyển. Đây là vấn đề cân bằng được đo và công khai; chưa thể khẳng định đã cân bằng hoàn chỉnh.
- Thị trường là mô hình tư nhân tổng hợp ở Phủ, không mô phỏng từng thương nhân. Huyện giữ ví tư nhân/hàng vật lý, không có sổ lệnh thị trường riêng. Lô hiện vật công chưa khớp vẫn ở sàn với chủ sở hữu Nhà nước, không phải kho vật tư dùng chung.
- Trị sở chọn Huyện trực thuộc có polygon thật; đường dựa trên tiếp giáp GIS và khoảng cách đại diện, chưa là khảo sát đường/cảng lịch sử. Cargo không đổi lộ trình tự động khi tuyến bị cắt; chờ mở lại. Không chia một lô lớn đã tạo thành nhiều xe nhỏ.
- UI giữ prototype desktop, bảng phải cuộn để xem hết; mobile hoãn theo chỉ thị. Kiểm tra Chrome, chưa kiểm tra Firefox/Safari. Build còn cảnh báo chunk >500 kB và annotation trong Zod, không chặn build.
- Không commit/push/deploy; workspace hiện không có .git ở gốc.

## File chính

`domain/economy.ts`, `domain/schema.ts`: schema quyền sở hữu/cargo/công trường. `data/upgradeEconomy.ts`, `data/economyFoundation.ts`, `persistence/saves.ts`, các schema V1/V4 và legacy initializer: migration. `engine/economyContext.ts`, `market.ts`, `finance.ts`, `production.ts`, `transport.ts`, `construction.ts`, `population.ts`, `month.ts`: mô phỏng và sổ. `ui/EconomyPanel.tsx`, `AdministrationPanel.tsx`, `ArchivePanel.tsx`: UI hiện tại. `tests/prefecture-economy.test.ts`, `economy*.test.ts`, fixture v4, `scripts/economy.e2e.mjs`: kiểm chứng.
