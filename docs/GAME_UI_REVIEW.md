# Game UI và tự đánh giá

## Thay đổi
Main Menu toàn màn hình dùng lại tranh cung điện và palette giấy cổ, đỏ son, xanh ngọc, đồng. Không còn hero marketing, các section giới thiệu hay footer website. Bốn nút: Tiếp tục trị vì, Khởi lập triều đại, Tải hồ sơ, Thiết lập. Tiếp tục dùng phiên đang mở hoặc tìm save mới nhất trong các slot. Khởi lập có cửa sổ mô tả việc thay Ô 1 trước khi nhận thiên mệnh.

Màn hình trị vì chiếm toàn viewport: thanh đế quốc ở trên, địa đồ ở giữa, thanh lệnh bên trái, một bảng quản lý tùy chọn ở phải và trạng thái ở dưới. Bảng Đế quốc/Hành chính/Triều đình/Sử quan chỉ đọc dữ liệu thật. Thư khố dùng lại các thao tác save/load/import/export. Modal dùng native dialog để giới hạn focus và hỗ trợ Escape; bảng bên phải có nút đóng, trạng thái pressed ở thanh lệnh và hỗ trợ Escape.

Thiết lập chỉ thay nhãn địa danh/cỡ chữ trong phiên UI. Không thêm âm thanh hoặc tùy chọn không có tác dụng. Zoom, pan, reset chỉ tác động góc nhìn bản đồ.

## Phạm vi bản đồ
SVG tự vẽ, cách điệu địa lý Trung Hoa với Hoàng Hà, Trường Giang, vùng núi, biển, la bàn và Ninh Kinh giả tưởng. Không lấy tài nguyên của Total War hay Romance of the Three Kingdoms. Không phải bản đồ địa lý chính xác hoặc dữ liệu lãnh thổ gameplay; các nét đứt không mang ý nghĩa ranh giới hành chính. Không sinh thêm Châu/Phủ/Quận/Huyện, quân đội hay mệnh lệnh. Có thông báo phạm vi ngay trên bản đồ và trong bảng Hành chính. Đây là khung trình bày màn hình gameplay, không phải hoàn thành Phase 2 hoặc core loop.

## File
- src/ui/App.tsx: điều hướng Main Menu/trị vì và bảng quản lý.
- src/ui/ArchivePanel.tsx: tách UI thư khố, giữ callbacks save cũ, thêm điều hướng sau mở hồ sơ.
- src/ui/Modal.tsx: cửa sổ modal có focus và Escape.
- src/ui/StrategyMap.tsx: địa đồ SVG và điều khiển camera phía UI.
- src/ui/theme.css: thiết kế toàn viewport, menu, HUD, thanh lệnh, thư quyển và responsive.
- README.md, docs/DESIGN_SYSTEM.md: hướng dẫn trải nghiệm UI mới.
- docs/ui-core-before.json: checksum đầu tác vụ; kiểm tra lại cả 6 file lõi không thay đổi.

## Kiểm thử
- npm run check: strict TypeScript, ESLint, Vitest 16/16 và production build đạt.
- Playwright qua Browser Use: chạy localhost:5173, Main Menu → Tiếp tục trị vì từ save cũ, hiển thị Ninh triều/tháng 1/năm 1/12.000 quan/6.000 thạch.
- Mở bảng Đế quốc, Triều đình, Hành chính, Sử quan; đối chiếu số liệu và nhật ký hiện có. Đóng bằng nút và Escape. Bấm lại bảng đang chọn cũng đóng được.
- Zoom 100 → 120%, reset; bật/tắt nhãn địa danh, đổi chữ lớn, kiểm tra label biến mất và font loaded.
- Thư khố: lưu Ô 3, nhận trạng thái thành công, tải Ô 3 trở về trị vì. Các callbacks import/export cũ được giữ nguyên; luồng file đã kiểm thử ở lượt redesign trước, chưa lặp lại ở lượt này.
- Cửa sổ Khởi lập hiển thị cảnh báo thay Ô 1 và đóng được bằng Escape; không khởi tạo đè save thật trong smoke test này.
- Desktop 1440×900 và mobile 390×844: không tràn ngang. Console error: 0 trong phiên kiểm tra.
- Screenshot đã chụp và quan sát: game-main-menu.jpg, game-reign.jpg, game-mobile.jpg trong docs/screenshots.

## Tự đánh giá sau ảnh chụp
Main Menu đã có nhịp nhìn của menu game: logo/ấn triện, tranh cung điện chiếm nền, các hành động tập trung một cột. Màn hình trị vì ưu tiên địa đồ và thao tác ngay trên cùng không gian; chỉ một bảng mở để giảm che bản đồ. Font Noto hiển thị dấu đúng, viền đồng và giấy sáng tạo chiều sâu vừa phải.

Đã sửa hai vấn đề phát hiện qua screenshot: nhãn Trung Nguyên chồng kinh đô; nút kinh đô chồng zoom trên mobile. Bản đồ hiện vẫn là minh họa vector đơn giản; độ chính xác địa lý, địa hình chi tiết, vùng kiểm soát và nhiều cấp hành chính cần dataset riêng trong phase bản đồ. Trên mobile, bảng mở che phần lớn bản đồ nhưng vẫn để thanh lệnh/đóng/zoom truy cập được; desktop là trải nghiệm ưu tiên. Chưa có lệnh tiến tháng vì engine chưa triển khai tick, không tạo nút hoặc số liệu giả để che giới hạn này.
