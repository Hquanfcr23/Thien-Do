# Đề xuất cân bằng 7 công trình cốt lõi

Trạng thái: phương án thiết kế, chưa áp dụng vào engine hoặc save. Ngày 14/11/2026. Không chạy mô phỏng chiến lược dài.

## Mốc chi phí

Dùng giá cơ sở hiện tại: gỗ 16, đá 12, công cụ 96, vải 32 lượng/đơn vị tương ứng. Chi phí dưới đây gồm tiền công và vật tư, chưa gồm cước. Chọn giữ bộ vật tư và vốn cấp đầu hiện có để tránh thay đồng thời cả chi phí lẫn tác dụng. Các dự toán phải đổi theo giá thực khi mua từng tháng.

| Công trình | Tiền công | Vật tư | Tổng dự toán cấp đầu | Lao động đề xuất | Bảo trì dự toán/tháng |
|---|---:|---|---:|---:|---:|
| Khai khẩn | 1.440 | 30 gỗ, 5 công cụ | 2.400 | 1.200 công-tháng | 6 |
| Thủy lợi | 2.400 | 60 đá, 30 gỗ, 8 công cụ | 4.368 | 1.600 | 11 |
| Kho lương Phủ | 1.440 | 70 gỗ, 30 đá | 2.920 | 1.200 | 7 |
| Khai thác | 1.920 | 40 gỗ, 12 công cụ | 3.712 | 1.600 | 9 |
| Công xưởng | 2.080 | 60 gỗ, 35 đá, 10 công cụ | 4.420 | 2.000 | 11 |
| Giao thông: nâng một tuyến bộ | 2.080 | 100 đá, 10 công cụ | 4.240 | 2.000 | 11 |
| Nha môn Huyện | 2.080 | 60 gỗ, 60 đá, 10 vải | 4.080 | 1.600 | 10 |

Thời gian thấp nhất tương ứng 3/4/3/4/5/5/4 tháng nếu nhận đủ 400 công-tháng mỗi tháng. Thiếu đầu vào hoặc công suất vận chuyển làm lâu hơn. Tuyến giao thông lấy 100 km địa hình thường làm chuẩn: dự toán thực theo chiều dài, nhân hệ số địa hình. Bảng không phải giá cố định cho mọi tuyến. Không chạy QA vì đây là tài liệu đề xuất.

## Tác dụng đề xuất

Tối đa ba cấp; hiệu quả dưới đây khi tình trạng 100%. Các mức tăng là cộng vào nền gốc, không nhân chồng.

- Khai khẩn: cấp 1/2/3 lần lượt tăng tổng diện tích sản xuất 10%/18%/24%. Chỉ có hiệu lực sau gieo trồng; phải có đất có thể khai khẩn, giống và lao động. Chỉ xây ở Huyện, không cộng thêm một lần nữa từ Phủ.
- Thủy lợi: cộng tổng 0,10/0,18/0,24 nguồn nước hữu hiệu, giữ giới hạn nguồn nước. Không ghi thành tăng sản lượng trực tiếp. Chỉ ở Huyện, xét nguồn nước địa lý; không tạo nước vô hạn trong hạn hán.
- Kho công: chỉ ở Phủ; mỗi cấp thêm 40.000 thạch lương sức chứa công. Hao hụt nền mục tiêu 1,2% → 0,9% → 0,75% → 0,6%/tháng. Chỉ áp dụng hàng trong kho công, không tự giảm hao hàng tư nhân trên sàn. Kho dân Huyện giữ cơ chế bảo quản riêng, không thêm một loại công trình cần quản lý.
- Khai thác: mỗi cấp tăng trần tháng thêm 12 gỗ, 12 đá, 6 quặng; vẫn cần lao động, vốn và trữ lượng. Công suất không phải sản lượng được bảo đảm, không nhân thêm từ công trình Phủ.
- Công xưởng: cấp 1/2/3 có trần công suất 150%/200%/250% so với không có xưởng; mỗi cấp thêm 50% nền, thay mức +100% hiện tại. Mỗi công thức vẫn dùng đúng nguyên liệu và nhân công.
- Giao thông: chọn tuyến cụ thể, không cộng trung bình nhiều công trình hai đầu. Cấp 1/2/3: tải +25%/+45%/+60%; tốc độ +15%/+25%/+35%; cước mỗi đơn vị -10%/-18%/-25%; tỷ lệ hao hụt giảm tương đối 10%/18%/25%. Tốc độ và thời gian không có cùng phần trăm giảm; thời gian tối thiểu và cách làm tròn tháng phải công khai.
- Nha môn: cấp 1/2/3 cộng tổng 5/9/12 điểm phần trăm vào tỷ lệ thực thi thuế tại Huyện khi ngân sách vận hành được trả đầy đủ, tối đa 100%. Không tăng thuế danh nghĩa, không thu tài sản không tồn tại. Dịch vụ công thiếu chi và tình trạng thấp làm giảm hiệu lực. Không cộng lặp với nha môn Phủ.

Cầu, kênh, bến, trạm và kho trung chuyển sẽ là nâng cấp theo nhu cầu tuyến, không mặc định cộng chồng một bộ bonus giống nhau. Chợ trở thành nâng cấp sàn; phòng thủ dành cho cơ chế quân sự sau. Giá/tác dụng những nâng cấp phụ cần chốt riêng, không ngầm coi việc bỏ tên khỏi menu là bỏ chức năng.

## Nâng cấp và bảo trì

Chi phí phần nâng tiếp lên cấp 2 bằng 150% gói cấp 1; cấp 3 bằng 200% gói cấp 1, áp cho tiền công, vật tư và công-tháng. Không thu lại toàn bộ vốn cũ. Bảo trì theo 0,25% vốn thay thế tích lũy/tháng: tổng mức cấp 1/2/3 bằng 1/2,5/4,5 lần bảo trì cấp đầu. Làm tròn lúc hiển thị, giữ tính toán chính xác. Cấp cao hơn khó hoàn vốn hơn và dùng cho nơi có nhu cầu thật.

## Tính thử tĩnh và giới hạn

Ví dụ giả định Huyện 20.000 dân, đồng bằng, 1.840 ha, kê, đủ lao động/giống/công cụ, đất tốt 80%, nước hữu hiệu 60%, không thiên tai, giá lương 0,5. Công thức hiện hành cho khoảng 157.068 thạch/vụ. Nhu cầu dân sự cả năm khoảng 102.000 thạch, gồm năm tháng khẩu phần đông. Đây là tình huống tính thử không phải kết quả trung bình nhiều seed.

- Khai khẩn cấp đầu thêm khoảng 15.707 thạch/vụ. Giả định thuế 12%, thực thi 70%, giá không đổi và đủ lương trên mức sinh tồn, Phủ thu thêm khoảng 660 lượng/năm. Trừ 72 lượng bảo trì, vốn 2.400 có hoàn vốn tĩnh khoảng 4,1 năm. Giá giảm, hạn hoặc thuế không thu đủ làm kéo dài.
- Thủy lợi +0,10 nước trong cùng tình huống tăng khoảng 11.075 thạch/vụ. Thu công thêm khoảng 465 lượng/năm theo giả định trên; trừ khoảng 131 lượng bảo trì năm, hoàn vốn tĩnh khoảng 13 năm. Đầu tư này ưu tiên nơi hạn/thiếu ăn, không là khoản đầu tư ngân sách thắng trong mọi điều kiện.
- Kho giữ ổn định 40.000 thạch, hao nền giảm từ 1,2% xuống 0,9% giúp giữ thêm 120 thạch/tháng, tương đương 60 lượng ở giá 0,5. Sau 7 lượng bảo trì, hoàn vốn kinh tế khoảng 55 tháng; không phải bạc tự vào ngân khố. Bán được lương còn phụ thuộc người mua trả tiền. Kho rỗng không mang lợi ích này.
- Nha môn: nghĩa vụ thuế 1.000 lượng/tháng, mức thực thi từ 60% lên 65%, thu thêm tối đa 50 lượng/tháng. Sau khoảng 10 lượng bảo trì, hoàn vốn tĩnh khoảng 102 tháng. Nếu nghĩa vụ 3.000 lượng, khoảng 29 tháng. Phải có hàng/bạc và tuyến thực tế.
- Giao thông: với tuyến cơ sở 500 tải chuẩn, các yếu tố khác giữ nguyên, mức tải so sánh 500 → 625 → 725 → 800. Các trị số này chưa áp mùa/chất lượng/giới hạn lao động. Tuyến ít hàng không tự có doanh thu để hoàn vốn.

Không thể bảo đảm hồi vốn hay hiệu quả của mỏ, công xưởng và tuyến chỉ từ trần công suất: giá bán, lượng giao dịch, đầu vào và vận tải quyết định lợi ích. Khi triển khai cần kiểm tra các trường hợp có/không có nhu cầu và khả năng hội tụ giá. Chưa có kết quả cân bằng 240 tháng cho bộ thông số đề xuất này.

Trước khi triển khai phải thiết kế chuyển đổi công trình cũ: các công trình hiện có không biến mất, không đổi cấp rồi làm mất tài sản. Việc đổi hiệu quả xưởng, phạm vi kho và giao thông cần migration/ánh xạ rõ ràng. Báo cáo này không thay thế bước đó.
