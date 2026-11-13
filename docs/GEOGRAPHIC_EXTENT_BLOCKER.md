# Kiểm tra yêu cầu mở rộng 200.000–400.000 km²

Trạng thái: chưa đạt. Hiện 24 polygon huyện nguồn bao phủ 33.910 km²; Tây Lĩnh 12.095, Trung Ninh 14.194, Đông Giang 7.621 km². Đây là diện tích địa lý, không phải diện tích trên màn hình.

Nguồn CHN ADM2 đầy đủ có 2.391 feature nhưng chỉ chứa shapeName, shapeISO, shapeID, shapeGroup, shapeType; không chứa mã tỉnh/phủ/quận hoặc quan hệ cấp trên. Bảng ánh xạ đã kiểm chứng trong dự án hiện chỉ có 24 huyện. Có thể mở rộng về mặt hình học nhưng chưa có bảng quan hệ nguồn cho một phạm vi 200.000–400.000 km². Không tái sử dụng thuật toán region growth đã bị người dùng từ chối, không phóng tọa độ hay gộp huyện nguồn thành Huyện giả.

Điều kiện để triển khai tiếp đúng yêu cầu: bổ sung dữ liệu county→prefecture→province có mã tham chiếu và giấy phép rõ ràng, hoặc xây dựng bảng ánh xạ thủ công được kiểm chứng từ các nguồn hành chính; sau đó thêm các Huyện thật vào domain với migration save, cập nhật các cấp trên và kiểm tra topology. Không phải thiếu khả năng camera hoặc tính diện tích.

Không mở rộng polygon trong lần kiểm tra này. Không có diện tích sau mở rộng hoặc screenshot sau thay đổi để báo hoàn thành.
