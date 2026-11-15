# Phase 4 — Triều đình và quản trị lãnh thổ

**Cập nhật sau Phase 4:** Tám ghế trung ương và save v8 được mô tả trong [CENTRAL_COURT_IMPLEMENTATION.md](CENTRAL_COURT_IMPLEMENTATION.md). Các đoạn nói save v7 bên dưới ghi lại mốc Phase 4 trước khi bổ sung triều đình trung ương.

Nguồn: `AGENTS.md`, `PHASE_4_STRUCTURE.md`, brief v1.1 §9 qua `DESIGN_SOURCE.txt`. Yêu cầu trực tiếp cho phép triển khai Phase 4, không phase sau. Giữ nguyên các thay đổi người dùng tại AGENTS và tài liệu cấu trúc.

## Đối chiếu yêu cầu → dữ liệu → engine → UI → test

| Mốc | Dữ liệu | Engine | UI | Kiểm chứng |
| --- | --- | --- | --- | --- |
| 4.1 | `court.officers`, `offices`, `countyOfficials`; Character cũ giữ ID | `courtFoundation`, `beginCourt`, `applyAppointment`, vòng đời năm | Triều đình, hồ sơ từ hành chính | `court.test.ts`: seed, roster, chuyển giao, không kiêm nhiệm, save/load; `phase4-integration`: thay đại diện Huyện |
| 4.2 | `prefecturePolicies`, `constructionPolicies`, `decisions` | `policies`, `autonomousConstruction`, `population`, `construction`, `marketOrders` | Thuế phân biệt mặc định/ghi đè/hiệu lực; ưu tiên xây và lý do trì hoãn | Kế thừa/ghi đè/hoàn nguyên; đủ điều kiện; thiếu bạc/vật tư/lao động/dự trữ/tuyến; dự án trùng/tối đa; cấm và tiếp tục |
| 4.3 | Quan hệ có hướng, loại quan hệ, ký ức có nguyên nhân | `remember`, `governance`, `finishCourt` | Hồ sơ hiện toàn bộ thông số, chiều tin cậy và sự kiện | Bất đối xứng, ân oán bền, tác dụng thi hành, roundtrip |
| 4.4 | 3 mạng Ninh triều giả tưởng; thành viên, lãnh đạo, lợi ích | Phản ứng theo dòng thu/chi, khẩu phần và chức vụ; tác động thi hành kỳ sau | Phe, thành viên, nguồn phản ứng, mức ủng hộ | Phản ứng thực, schema tham chiếu, tác dụng vào governance |
| 4.5 | Ví tang vật/gia sản, điền sản, nghĩa vụ truy tang, hồ sơ chứng cứ | `oversight`, chi công trong `finance`, `moneyTotal` | Thanh tra/điều tra, xét xử chọn hình phạt, tha, mua điền sản | Tiền thật, thời hạn, không xử lý hai lần, án oan, tịch biên có người mua, nợ còn lại, mọi hình phạt |
| 4.6 | Save v7, schema v6 cố định và fixture v6 | Migration v1–v6, giao dịch IndexedDB chờ `tx.done` | Giữ trang chủ/phong cách; 24 lượt/12 tick | `check`, hồi quy 9×3×240, benchmark 100 Huyện/240 tháng và `phase4.e2e.mjs` |

## Những quyết định đã được người dùng chốt trong chat

- Một đương nhiệm mỗi chức Châu/Phủ; ứng viên bổ sung `max(2, ceil(số chức × 25%))`; 3 phe tài chính, dân sinh, địa phương.
- Chuyển giao sau một lượt điều hành (nửa tháng), không kiêm nhiệm toàn thời gian. Quan hệ/phe cập nhật tháng, tuổi/sức khỏe cập nhật năm. Quan Huyện tối giản, deterministic, mãn nhiệm mới thay; không bổ nhiệm trực tiếp.
- Quan Phủ không cố tình chống chỉ thị trọng tâm. Mỗi Phủ mở tối đa một dự án mới/tháng. Giữ vận hành/bảo trì ba tháng và ba tháng cứu thiếu khẩu phần; không rút lao động khi đe dọa sinh tồn.
- Cấm đình chỉ mua/thi công công trường đang có, giữ tiến độ/vật tư/transit. Bỏ cấm tiếp tục. Bảo trì công trình hoàn thành vẫn chi trả.
- Chiếm dụng chuyển sang ví quan từ chi hành chính thật; gia sản khởi đầu bằng 0, lương quan tách 10% từ khoản chi hiện có. Không thêm bạc vào migration.
- Truy tang nghĩa vụ đủ 100%, thu ví tang vật/gia sản, tịch biên điền sản; chưa đủ giữ thành nợ. Bán tịch biên chỉ thu tiền khi người mua trả thật.
- Hình phạt: truy thu, bãi nhiệm, giam, lưu đày, tử hình do người chơi chọn. Giam/lưu đày đến khi tha; không tự hoàn chức. Tử hình không thể phục hồi.
- Án oan: điều tra viên bị bãi nhiệm, uy tín −15; tin cậy nạn nhân với điều tra viên −30 và ký ức ân oán. Không trừ uy tín hoàng đế.
- Không thêm cơ chế hoàng tộc, hoạn quan, cơ quan đặc biệt; không kế vị, đảo chính, nội chiến, quân sự hay ngoại giao phase sau.

## Công thức, đơn vị và đánh đổi

Các đại lượng mô phỏng giữ `canonical-v1`. `economicUnits.silver = 8`: một đơn vị bạc nội bộ hiển thị 8 lượng. Đây là hiệu chuẩn gameplay có sẵn, không phải tỷ giá lịch sử. Chi phí giám sát đã chốt 20/60 lượng tương ứng **2,5/7,5 đơn vị nội bộ**; không dùng 20.000/60.000 đơn vị. Chuỗi báo cáo mới dùng cùng `economicText`; không đổi đơn vị dữ liệu cũ.

### Cai trị và công vụ

Người dùng đã duyệt công thức chuẩn hóa sau hồi quy ban đầu:

`thi hành = 0,65 + 0,35 × (0,30 quản trị + 0,20 tài chính + 0,15 giao tiếp + 0,10 năng lực quan Châu + 0,10 sức khỏe + 0,075 trung thành + 0,05 tin cậy cấp trên + 0,025 ủng hộ phe) / 100`.

Khuyết quan Phủ: 0,5. Tỷ lệ giới hạn 0–1 và chỉ nhân vào phần thuế danh nghĩa có thể thu theo pipeline hiện hữu. Phần chưa thu vẫn ở dân, không tạo/tiêu hủy tài sản. Quan Châu tác động thuộc phạm vi Phủ con. Uy tín và tham vọng tác động kỳ vọng phe, liêm chính tác động dòng chiếm dụng; không có chỉ số quân sự/mưu lược mới không được dùng.

Mỗi chi hành chính thực trả `w`: lương quan `0,10w`, chiếm dụng `0,10w × tham nhũng/100`, phần còn lại tới ví dân. Dịch vụ tính từ ngân sách thực trả trừ phần chiếm dụng. Tổng chi không tăng, mọi ví đều được tính trong `moneyTotal`.

Cuối năm: tuổi tăng một; sức khỏe quan giảm `max(0, (tuổi − 50)/20)` điểm, giới hạn 0–100. Sức khỏe hết tạo chức khuyết; không bổ nhiệm người chết/giam/lưu đày. Đại diện Huyện có tuổi mãn nhiệm 65–70 từ seed; tên và ID giữ nguyên giữa các lần thay.

### Chính sách và xây dựng

- Chính sách kinh tế hiệu lực = ghi đè Phủ nếu có → mặc định Châu → toàn quốc. Không lưu bản sao giá trị hiệu lực.
- Đổi Châu giữ nguyên ghi đè Phủ. Châu hiện Tùy chỉnh khi các Phủ có cấu hình hiệu lực khác nhau; ghi đè trùng giá trị không tự làm trạng thái Tùy chỉnh.
- Ưu tiên xây có cùng cách kế thừa: cấm < thấp < bình thường < cao < trọng tâm. Không có hạn mức số địa bàn đặt trọng tâm. UI không còn nút xếp công trình trực tiếp; lệnh xây cũ đang chờ trong save được giữ để tương thích Phase 3.
- Quỹ an toàn bạc = `max(quỹ fiscal cũ, 3 × chi vận hành/bảo trì tháng)`. Trừ tiếp nghĩa vụ lương/vật tư còn lại của công trường đang có, rồi so dự toán công trình mới theo giá sàn/cước hiện hành. Không dùng giá hoặc thu nhập tương lai.
- Lương cứu đói = `3 × tổng(dân số Huyện × 0,02875 × thiếu khẩu phần hiện tại)` thạch nội bộ. Phải có trong kho Phủ. Kiểm tra rút lao động còn giữ dự trữ tư nhân đến vụ sau/vốn giống hiện hữu.
- Nhu cầu: đất/người (farm), thiếu nước (irrigation), trữ lượng và công suất khai thác (mine), thất nghiệp (workshop), mức dịch vụ (administration), sức chứa kho (granary), mức dùng tải và tình trạng tuyến (road). Nhu cầu chỉ xếp thứ tự, không cộng tài nguyên/sản lượng.
- Xét hữu hạn ứng viên theo mức ưu tiên → nhu cầu; hash seed chỉ phá hòa. Mỗi chỉ thị trọng tâm đều có kết quả/lý do và kỳ xét lại. Điều kiện khởi công gồm bạc, vật tư cho tháng, lao động, đường/công suất, không trùng và giới hạn cấp. Vật tư xa vẫn phải đi qua transit trước khi dùng.
- Công trường cấm không giữ lao động hoặc tạo nhu cầu mua vật tư giả trên sàn; hàng đã trả tiền vẫn được giao và giữ tại công trường.

### Quan hệ và phe

- Chỉ tạo cạnh khi tương tác; tin cậy ban đầu 50, không đối xứng. Bổ nhiệm +5, rời chức −8; phối hợp công vụ thực có chi hành chính tăng `0,1 × giao tiếp/100` mỗi tháng.
- Cạnh không có sự kiện mới phai về 50 tối đa 0,1 điểm/tháng; thân tộc và ký ức ân oán bền không tự phai. Mỗi cạnh giữ tối đa 50 ký ức, lịch sử chức vụ 100 mục.
- Hội Kinh dụng phản ứng theo thu thực nhận so chi công ở Phủ thành viên cai quản; Hội Dưỡng dân theo khẩu phần thực tế; Hương nghị theo tỷ lệ thành viên được giao chức.
- Mỗi tháng: `ủng hộ += kết quả × 0,5 × (0,5 + uy tín bình quân/200) − 0,25 × tham vọng bình quân/100 × (1 − tỷ lệ có chức)`, giới hạn 0–100. Kết quả nằm trong −1..1. Ủng hộ tác động tỷ lệ thi hành kỳ sau; ưu tiên kinh tế có thể phù hợp phe này và làm phe khác không hài lòng.

### Giám sát, gia sản và truy tang

- Thanh tra 20 lượng/1 tháng; điều tra 60 lượng/3 tháng. Tiền lấy từ Phủ chuyển dân trị sở; từ chối nếu phá quỹ an toàn. Có thể giám sát đương nhiệm hoặc người từng có sổ công vụ tại Phủ; không tự điều tra.
- Năng lực điều tra = trung bình quản trị/tài chính, chia 100. Phát hiện `min(0,95, 0,20 + 0,60 × năng lực + 0,15 nếu điều tra)`. Nghi oan `0,10 × (1 − năng lực)`, điều tra nhân 0,5. Hash seed riêng, không tiêu hao RNG thời tiết kinh tế.
- Số tiền thuộc hồ sơ được chốt từ sổ chiếm dụng lúc mở vụ. Thanh tra tạo nghi vấn (độ tin cậy 50); điều tra tạo kết luận (85). Không phát hiện không đồng nghĩa vô tội. Kết luận có thể sai, chỉ áp dụng hậu quả một lần khi xử lý.
- Cảnh cáo: uy tín −2, tin cậy −3. Bãi nhiệm: tin cậy −8. Kết án thật: nghĩa vụ truy tang đủ số tiền hồ sơ chưa được truy tang trước; lựa chọn hình phạt là lệnh riêng có chủ ý. Kết án sai không thu tài sản hoặc thi hành án với nạn nhân, quy trách nhiệm điều tra viên.
- Điền sản là quyền sở hữu có giá trị thanh lý, không cộng đất canh tác hoặc tiền thuê. Mua bằng ví quan chuyển tiền thật cho ví dân Huyện. Tịch biên thanh lý dần theo số nợ và khả năng người mua trả, vẫn giữ vốn dân tối thiểu hiện hữu `đất × 0,025 + 20`. Bất động sản/chưa trả được và nợ không tính thành tiền mặt trong sổ bảo toàn.
- Thu hồi từ ví tang vật → bạc gia sản → thanh lý điền sản. Không có người mua thì tiếp tục giữ tài sản/nợ; không trả bằng bạc tự tạo. Thu hồi về đúng Phủ nguồn, ghi transfersIn, không ghi thành thuế mới.

## Pipeline và persistence

Đầu kỳ: tạo context/bút toán → áp dụng chuyển giao đến hạn → xử lý hàng đợi chính sách, bổ nhiệm và giám sát → thời tiết hiện hành → phân lao động thử → xét xây tự chủ → phân lại lao động theo công trường thực → sản xuất/dự trữ/sàn/tài chính/vận tải/dân số/quân nhu/xây/bảo trì theo pipeline Phase 3 → quyết toán trung ương → kết quả giám sát/truy tang → quan hệ/phe/vòng đời → sổ bảo toàn/báo cáo/lịch.

Chỉ chạy tại lượt giữa tháng kết thúc; lượt đầu không thay mô phỏng. `beginCourt` xử lý trước lệnh mới nên chuyển giao không có hiệu lực ngay tháng vừa xếp. Phai quan hệ/phản ứng phe không tiêu hao RNG kinh tế.

Save v7 đọc v1–v6 theo schema cũ riêng. Thêm hồ sơ công vụ/ứng viên không thêm tài sản, ID hành chính/nhân vật cũ giữ nguyên. Ghi đè Phủ ban đầu trống (kế thừa), ví quan bằng 0. Version mới không hỗ trợ hoặc tham chiếu lỗi bị từ chối, không sửa bản gốc. Save v7 thiếu court bị từ chối. IndexedDB chỉ báo thành công sau `tx.done`.

## QA và giới hạn

Kết quả nghiệm thu cuối cùng xem `PHASE_4_QA.md`; số liệu máy đọc ở `PHASE_4_PERFORMANCE.json`, `PHASE_4_BALANCE_RESULTS.json`, `PHASE_4_SCENARIOS.json`, `PHASE_4_UI_QA.json`. Không ghi đè báo cáo Phase 3.

Điền sản chưa có thị trường địa ốc/tiền thuê; chỉ dùng làm gia sản có thể mua và truy tang. Phe chưa có tổ chức lịch sử hoặc cơ chế kế vị. Đây là ranh giới Phase 4; các hệ thống phase sau không được triển khai. Nội dung mới mang profile `ning-fictional-v1`, provenance Fictional.
