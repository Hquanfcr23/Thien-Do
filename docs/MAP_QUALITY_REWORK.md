# Phase 2 Map Quality Rework

Ngày kiểm tra 13/11/2026. Chỉ sửa hình học, trình bày, camera và kiểm thử bản đồ; không triển khai Phase 3 hoặc đổi trang chủ.

## Hình học và địa lý
Renderer không còn dùng bốn góc bounds để vẽ lãnh thổ. Bounds trong GameState vẫn được giữ để tương thích save/validator hiện có. Lớp atlas mới lấy ID và quan hệ cha–con thật để xây polygon hiển thị riêng.

Đường bao campaign được biên soạn thủ công; vị trí ba Châu được neo phía tây miền núi, đồng bằng giữa và cửa sông phía đông. Các thành có điểm neo tại bờ sông/chỗ vượt sông tương ứng. Phân vùng bên trong dùng Voronoi xác định theo các điểm neo và lòng thung lũng, clip theo miền cha; không Math.random, không màu/vị trí ngẫu nhiên. Tất cả polygon Huyện dùng chung điểm nối, bao gồm việc tách cạnh tại T-junction trước khi nội suy địa hình. Biến đổi địa hình có biên độ thấp làm ranh giới uốn theo sườn núi/thung lũng mà không tạo cạnh riêng cho hai vùng tiếp giáp.

Sau khi hoàn thành polygon Huyện, Quận được union từ Huyện; Phủ từ Quận; Châu từ Phủ; đường bao quốc gia từ Châu. **Chỉ kết quả union từ dưới lên được render**, không có bộ đường biên cấp trên vẽ độc lập. Node geometry có ID trùng AdministrativeUnit nên các lớp tiếp tục chọn đúng dữ liệu cũ.

Sông được làm mềm theo cùng hệ tọa độ địa hình. Núi theo hai dải phía tây; thành được đặt trong polygon Huyện của chính thành đó, ưu tiên bờ sông bên trong Huyện. Tuyến đường vẫn nối đúng hai thành đã có trong save; nét đường giữ độ dày ổn định khi zoom. Đất nền ngoài phạm vi có màu riêng, không biểu thị quyền quản trị; đây không phải ba tỉnh bị tách thành đảo.

## Camera, nhãn và bảng
- Game mới/camera mặc định chưa dịch chuyển được fit vào vùng có dữ liệu sau khi biết kích thước viewport, chừa diện tích cho thanh lệnh và bảng bên phải. Camera đã lưu được tôn trọng; nút ⌖ căn lại vùng dữ liệu bất kỳ lúc nào.
- Focus từ cây dùng bounding box/pole của polygon thực, không tâm ô bounds cũ. Zoom quanh tâm vùng bản đồ sử dụng được, thay vì trượt vùng dữ liệu ra khỏi màn hình.
- Zoom dưới 160%: Châu + kinh đô; 160–230%: Phủ + trọng trấn; 230–320%: Quận; từ 320%: Huyện và thành trì. Cấp nhãn độc lập cấp ranh giới đang chọn. Màu/viền chọn vẫn thể hiện quan hệ cha–con.
- Nhãn có cỡ chữ màn hình cố định; bộ bố trí ưu tiên kinh đô/lựa chọn, thử nhiều vị trí, loại nhãn va chạm hoặc nằm dưới bảng. Không cố hiển thị tất cả tên. SVG title và aria-label giữ tên đầy đủ cho hover/bàn phím.
- Bảng đưa dân số/ổn định lên đầu; nhóm lãnh thổ–kiểm soát, tài nguyên–nhân sự và cây có thể mở/đóng. Nền bảng đục, tương phản chữ tăng. Không đổi công thức tổng hợp hoặc dữ liệu gốc.

## Kiểm thử và bằng chứng
`npm run check`: TypeScript, ESLint, **46/46 unit tests**, production build đạt. Test topology tính diện tích giao/xor polygon, không chỉ so sánh số vertex:
- 45 node có hình học không rỗng và điểm đặt nhãn trong vùng.
- Cả bốn cấp phủ kín cùng đường bao, không có phần hở hoặc diện tích giao giữa các vùng anh em vượt 0.001 đơn vị diện tích tọa độ bản đồ.
- Mỗi đường bao cha đúng bằng union các con.
- Atlas không mutate dữ liệu hành chính/save.
- Bộ bố trí nhãn loại va chạm; kinh đô có ưu tiên; cả 7 thành nằm trong Huyện thật của chúng.

`npm run test:map-quality`: script Playwright độc lập Chrome headless, context tạm riêng, không ghi vào hồ sơ trình duyệt người dùng. Đã chạy ở Vite dev và production preview. Xem dữ liệu kết quả cuối trong MAP_QUALITY_RESULTS.json:
- Click thực bằng chuột vào điểm nằm trong path ở bốn lớp: Trung Ninh Châu, Ninh Kinh Phủ, Ninh Kinh Thượng Quận, Ninh Kinh Bắc Bình Huyện. Xác nhận đúng tên panel, số vùng 3/7/10/24.
- Chụp toàn màn hình **và** crop vùng bản đồ tại 3 mức zoom khoảng 90%, 190%, 330%; đo bounding box DOM của toàn bộ nhãn được hiển thị. **0 cặp nhãn giao nhau** trong ba góc nhìn đã kiểm tra.
- Save Ô 3 → reload → Continue: camera/cấp bản đồ khôi phục chính xác; các unit tests save/migration cũ tiếp tục đạt.
- Console/page error của lượt nghiệm thu cuối: **0**.

Đã xem trực tiếp ảnh far/middle/near. Qua kiểm tra đã sửa: import namespace polygon-clipping chạy được ở unit nhưng lỗi browser; camera zoom không quanh vùng nhìn hữu ích; thành kinh đô ban đầu xa sông do vị trí cấp con; nền panel xuyên nét bản đồ. Không dùng kết quả build thay cho nghiệm thu hình ảnh.

Ảnh cuối được tạo từ production preview:
- screenshots/map-quality-far.png và map-quality-far-region.png
- screenshots/map-quality-middle.png và map-quality-middle-region.png
- screenshots/map-quality-near.png và map-quality-near-region.png

## File và cách chạy lại
Thêm data/mapGeography.ts; engine/mapGeometry.ts, mapFeatures.ts; ui/mapLabels.ts; hai file test map-quality/map-labels. Sửa StrategyMap, AdministrationPanel, CSS và phần camera focus trong engine/administration.ts; App chỉ truyền trạng thái bảng đang mở. Domain schema, factory dữ liệu hành chính, Zustand store và persistence/migration không thay đổi định dạng hay quy tắc.

Thư viện hình học: d3-delaunay, polygon-clipping, polylabel; công cụ kiểm tra @playwright/test. Chạy dev server rồi `npm run test:map-quality` (máy kiểm tra có Google Chrome). Có thể đặt MAP_TEST_URL trỏ production preview. File script: scripts/map-quality.e2e.mjs. Source paths ở trên tính từ src/.

## Giới hạn
Đây vẫn là địa lý **giả tưởng có biên soạn cho campaign ba Châu**, không phải GIS hay phục dựng địa giới Trung Hoa lịch sử. Thuật toán phân vùng có các đoạn ranh giới tương đối thẳng giữa những điểm địa hình, nhưng topology không còn là các hàng/cột tứ giác. Các điểm neo và đường bao cần được biên soạn tiếp nếu mở campaign khác/toàn Trung Hoa.

Không bảo đảm mọi tổ hợp pan/viewport/zoom đều có toàn bộ tên được hiển thị; tên thiếu có thể xem bằng hover. Nghiệm thu nhãn tự động giới hạn ba góc nhìn desktop 1440×1000 đã lưu, không tuyên bố kiểm thử mọi viewport. Mobile tiếp tục hoãn theo chỉ thị. Tuyến đường chỉ là liên kết không gian, chưa có mô phỏng logistics; chưa có tick tháng/kinh tế/chiến tranh.

**Dừng ở Phase 2.**
