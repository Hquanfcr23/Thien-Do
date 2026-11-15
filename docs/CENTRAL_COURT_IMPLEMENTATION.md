# Tám ghế triều đình trung ương

## Luật hiện hành

- Tám ghế: Thủ phụ, Lại, Hộ, Lễ, Binh, Hình, Công, Đô ngự sử. Mỗi ghế có một người giữ, chuyển giao hiệu lực sau một lượt điều hành (nửa tháng). Quan rời chức cũ khi nhận chức mới; một người không giữ đồng thời hai chức toàn thời gian.
- Điểm phù hợp 0–100 dùng Quản trị, Uy tín và chỉ số chuyên trách theo ghế. Sức khỏe và Giao tiếp không tham gia điểm này. Sức khỏe vẫn quyết định tư cách tiếp tục giữ chức theo luật vòng đời hiện có.
- Thủ phụ: họp liên bộ chi 20 lượng, tăng tỷ lệ thi hành Phủ tối đa `6 × điểm/100` điểm phần trăm trong ba tháng, chặn tại 100%.
- Bộ Lại: sáu tháng tuyển tối đa một ứng viên, chi 40 lượng; điểm cao cho phép chọn trong tối đa ba hồ sơ sinh theo seed. Chỉ tuyển khi ứng viên dự phòng dưới 25% tổng chức địa phương và trung ương, tối thiểu hai.
- Bộ Hộ: mỗi ba tháng chuyển một khoản bạc thực từ ngân khố trung ương đến một Phủ. Quỹ trung ương sau chuyển phải trên mức an toàn của chính sách. Điểm quan thu hẹp biên ước lượng thu thuế từ ba tháng gần nhất; đây là khoảng tham khảo, không bảo đảm kết quả tương lai.
- Bộ Lễ: sáu tháng có thể tổ chức nghi lễ chi 30 lượng nếu không có Huyện thiếu khẩu phần theo kỳ gần nhất; Chính thống tăng từ 0,5 đến 2 điểm theo điểm quan. Hoặc mở khoa cử chi 60 lượng, sau ba tháng đưa hai ứng viên vào danh sách; tối đa một kỳ thi mỗi 12 tháng và phải còn đủ chỗ dự phòng. Chính thống tác động ổn định Huyện mỗi tháng qua `(Chính thống − 70) × 0,01` điểm, không chuyển tiền hoặc hàng.
- Bộ Binh: ba tháng kiểm tra một đơn vị đã được tiếp tế đầy đủ, chi 30 lượng và tăng sĩ khí `2 + điểm/50`, chặn tại 100. Hồ sơ khởi đầu hiện không có đơn vị quân nên nút tấu trình Binh bị vô hiệu đến khi có đơn vị hợp lệ.
- Bộ Hình: xét lại kết luận điều tra sau một tháng, chi 20 lượng; xác suất nhận ra kết luận oan là `50% × điểm/100` từ seed. Không xét xử trong lúc chờ. Không đổi xác suất phát hiện ban đầu của điều tra viên.
- Bộ Công: ba tháng khảo sát một loại công trình ở Châu/Phủ, chi 20 lượng. Ưu tiên trọng tâm tạm thời ba tháng và tăng năng suất thi công của loại đó tối đa `12% × điểm/100`. Không vượt lệnh Cấm, quỹ an toàn, vật tư, lao động và tuyến; chi phí/vật tư vẫn tính theo tiến độ thực. Không ghi đè chính sách kế thừa Châu/Phủ.
- Đô ngự sử: trực tiếp thanh tra một Phủ mỗi tháng theo chi phí, thời hạn, năng lực điều tra và rủi ro oan hiện hành. Không được tự điều tra.

Tab Triều đình hiển thị tấu nghị dựa trên thiếu khẩu phần, ngân quỹ Phủ, mức dịch vụ, ứng viên và hồ sơ án hiện có. Bộ Hộ và Đô ngự sử xếp địa bàn cần xem trước trong bộ chọn; người chơi vẫn quyết định lệnh cuối cùng.

Mọi khoản chi công vụ chuyển bạc từ ngân khố trung ương sang ví dân tại trị sở; chuyển ngân sách Bộ Hộ giữ bạc trong ngân khố Phủ. Không cộng vật tư hoặc tiền từ điểm quan. Save v8 đọc v1–v7; migration v7 thêm tám nhân vật giả tưởng với ví bằng 0 và giữ nguyên tài sản cũ.

## Cân bằng và QA

Hồi quy ngắn hạn gồm ba seed 41–43, 48 tháng mỗi seed, so nền không dùng tấu trình với việc dùng Thủ phụ, Bộ Hộ, Bộ Công mỗi ba tháng và Bộ Lễ mỗi sáu tháng. Thu thuế cộng dồn tăng lần lượt **16,2%, 12,8%, 11,6%**; dân số tăng **0,048%, 0,055%, 0,046%**; số Huyện-tháng thiếu giảm lần lượt **12→10, 12→11, 14→13**. Ngân khố trung ương cuối kỳ từ khoảng **2.783–2.856** xuống khoảng **998 lượng**, thể hiện chi phí và chuyển ngân sách. Test kiểm tra từng tháng sai số bảo toàn bạc/lương dưới `1e-5`, ngân khố không âm và thuế không tăng quá 25% trong ba seed này. Quỹ an toàn chặn riêng lệnh mới của triều đình; các khoản chi trung ương khác vẫn tuân luật riêng của chúng.

- 15 bộ unit/integration liên quan: 161 test đạt; sau chỉnh cân bằng, 4 bộ quan lại: 35 test đạt và 6 bộ kinh tế/save: 59 test đạt.
- Playwright `phase4.e2e.mjs`: bổ nhiệm địa phương, chính sách, giám sát, xét xử, save/load, import/export, migration v6 đạt.
- Playwright `central-court.e2e.mjs`: tám ghế, bốn tấu trình cùng tháng, chặn khoa cử khi thiếu chỗ ứng viên, quyết toán và save v8 đạt. Ảnh: `docs/screenshots/central-court.png`.
- `npm run typecheck`, `npm run lint`, `npm run build` đạt. Không chạy hồi quy 9 chiến lược theo yêu cầu.
- Benchmark 100 Huyện, 294 tuyến, 240 tháng: **16,86 ms/tháng**, dưới ngưỡng 30 ms/tháng; baseline Phase 3 là 10,86 ms/tháng. Sai số bảo toàn lớn nhất `4,1e-10`. Số đo lưu tại `PHASE_4_PERFORMANCE.json`; chênh lệch với baseline gồm toàn bộ logic Phase 4, không tách riêng tám ghế mới.

**Giới hạn:** Điểm Bộ Hộ hiện cải thiện độ hẹp khoảng ước lượng, không tạo thêm bạc hoặc thay đổi hiệu suất chuyển ngân. Bộ Binh chỉ có tác dụng khi campaign có đơn vị quân hợp lệ; nội dung quân sự sâu hơn và chỉ số Quân lược để giai đoạn sau. Hồi quy 48 tháng là kiểm tra cân bằng ngắn hạn, chưa thay thế bộ 9 chiến lược.
