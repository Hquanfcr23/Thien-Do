# Mở rộng vùng chơi bằng địa giới huyện GIS

24 Huyện gameplay giữ ID và được mở rộng bằng phép hợp polygon của 323 đơn vị huyện hiện đại trong geoBoundaries CHN ADM2 2017. Mỗi huyện nguồn chỉ thuộc một Huyện gameplay; các cấp trên được hợp từ con theo cây hiện có. Không thay đổi dữ liệu save, dân số hoặc cơ chế. Địa giới thực ở đây là địa giới hiện đại, không phải phục dựng thời Hán. Phủ là tầng giả tưởng.

Thuật toán có thể tái tạo trong `scripts/expand-han-regions.mjs`: bắt đầu từ 24 huyện nguồn cũ, chỉ nhận huyện có chung đỉnh GIS và chọn ưu tiên khoảng cách tới hạt nhân, với giới hạn không gian 108.5–116.2 độ Đông, 31.5–37.5 độ Bắc. Kết quả là phép gộp địa giới huyện thật, không chia hình hay Voronoi. Giới hạn: khoảng cách/chung đỉnh không đủ chứng minh tiếp giáp theo cạnh trong mọi trường hợp, chưa tối ưu theo sông núi hoặc dữ liệu dân cư và không phải phân vùng lịch sử được kiểm chứng. Ranh ngoài cũng chịu ảnh hưởng hộp chọn không gian và địa giới hiện đại; không trình bày như địa giới tự nhiên hay bản đồ Hán chính xác.

Tổng diện tích cầu từ polygon: trước 33.910 km², sau 468.977 km². Sau: Tây Lĩnh 165.324; Trung Ninh 103.246; Đông Giang 200.407 km². Số đơn vị gameplay 3 Châu, 7 Phủ, 10 Quận, 24 Huyện. Diện tích từng cấp tại `HAN_SCALE_AREAS.json`, tính bằng `node scripts/report-gis-area.mjs`, bán kính 6371.0088 km; sai số so với ellipsoid chưa được ước lượng.

Nguồn, metadata, giấy phép và SHA-256 tại `GIS_SOURCES.json`; hình học nguồn 2017 từ geoBoundaries, bản đồ nền Natural Earth. `han-seeds.json` lưu hình học trước mở rộng. Xem thêm `REAL_GIS_REPORT.md` cho nguồn, những con số/phạm vi cũ trong báo cáo đó đã được thay bằng báo cáo này.

Topology: các unit test kiểm tra không chồng diện tích, phủ cùng một vùng tại từng cấp, cha bằng hợp của các con; toàn vùng có hai lỗ nhỏ khoảng 1 km² mỗi lỗ trong dữ liệu GIS. Một số polygon thành phần có thể chỉ chạm điểm; cần xác minh biên chung theo cạnh và địa lý trước khi gọi là liên thông lịch sử.

Kiểm tra: `npm run check` đạt 51 tests, typecheck, lint và build; Playwright Chrome kiểm tra chọn các cấp, camera, kéo, wheel, resize, lưu/tải, nhãn. Screenshot `han-scale-before.png` và `han-scale-after.png` trong `screenshots/` được chụp sau khi fit riêng từng vùng nên thang zoom khác nhau; so sánh địa hình và số liệu diện tích để thấy phạm vi thay đổi. Vite vẫn cảnh báo bundle lớn.
