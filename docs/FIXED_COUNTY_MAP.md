# Huyện GIS nguyên bản — thay thế các bản phân vùng tự động trước

Đã loại bỏ region growth, penalty sông và chia theo khoảng cách. Mỗi Huyện gameplay ánh xạ đúng một shapeID geoBoundaries CHN ADM2 2017, giữ nguyên hình học nguồn. Bảng ánh xạ tường minh tại GIS_COUNTY_MEMBERSHIP.json. Các cấp trên chỉ hợp huyện theo parentId. Tên và hệ thống bốn cấp là giả tưởng, không phải địa giới Hán được kiểm chứng.

Phạm vi hiện tại: 24 Huyện, 10 Quận, 7 Phủ, 3 Châu; 33.910 km². Tây Lĩnh 12.095; Trung Ninh 14.194; Đông Giang 7.621 km². Việc thu hẹp là chủ ý để ngừng gán nhiều huyện nguồn thành một Huyện giả tạo. Không tuyên bố đạt quy mô Châu thời Hán. Mở rộng đúng nghĩa cần thêm Huyện domain và migration có chủ đích; chưa làm trong thay đổi này. ID/gameplay/save hiện có giữ nguyên.

Kiểm thử topology gồm mỗi child nằm trong parent, diện tích parent bằng tổng con, child không lớn hơn parent, không chồng diện tích giữa các đơn vị cùng cấp, toàn bộ cấp phủ cùng vùng, quan hệ cây hợp lệ. Nguồn và giấy phép trong GIS_SOURCES.json. Screenshot sau sửa tại screenshots/real-gis-far.png. Các báo cáo HAN_SCALE_REPORT/GIS_EDGE_REWORK mô tả phiên bản cũ, không còn áp dụng.
