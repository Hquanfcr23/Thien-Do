# Đế Nghiệp Imperial Parchment

**Cập nhật game UI:** Bố cục trang giới thiệu bên dưới đã được thay bằng Main Menu và màn hình trị vì toàn viewport. Token màu, font tự host và tranh cung điện được giữ. Chi tiết triển khai và tự đánh giá hiện tại ở [GAME_UI_REVIEW.md](GAME_UI_REVIEW.md).

## Hướng mỹ thuật
Giao diện lấy cảm hứng từ hoàng cung, tranh sơn thủy khoáng sắc và thư quyển. Nền sáng, mực rõ, đỏ son cho quyết định chính, xanh ngọc phân chương và vàng đồng cho khung/hoa văn. Trang chủ có tranh hoàng cung lớn; biểu tượng con dấu và đường khung góc gợi triều đình mà không làm giảm khả năng đọc.

## Tokens
Các biến nguồn nằm ở `src/ui/theme.css`.

| Token | Màu | Vai trò |
|---|---|---|
| paper | #f4ecd9 | nền giấy cổ |
| paper-light | #fffaf0 | mặt thư quyển |
| ink | #292f2b | nội dung chính |
| muted | #62675b | nội dung phụ |
| cinnabar | #973e32 | hành động chính, nhấn tiêu đề |
| cinnabar-dark | #762b23 | hover và nhãn quan trọng |
| brass | #92703b | hoa văn, đề mục |
| jade | #426b5d | thanh chương, focus, thông báo |
| line | #cebb94 | viền và phân cách |

## Typography và tiếng Việt
Noto Sans 400/600 cho nội dung, biểu mẫu và nút; Noto Serif 500/700 cho tiêu đề. Font tự host từ hai package Fontsource, không Google Fonts CDN. `src/ui/fonts.css` khai báo Latin, Latin Extended, Vietnamese với unicode-range đúng từ CSS gốc của Fontsource; giữ coverage chữ dựng sẵn và combining marks. Không dùng font trang trí cho đoạn nội dung, không giãn chữ thân bài, line-height 1.7–1.95 và tiêu đề 1.5–1.65 để đủ chỗ cho dấu kép. UTF-8, html lang=vi; ký tự ngoài các subset dùng fallback hệ thống, không tuyên bố Noto Latin bao phủ mọi script Unicode.

Ví dụ CSS sử dụng sau khi đã nạp fonts.css:

```css
:root {
  --font-body: 'Noto Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-display: 'Noto Serif', 'Noto Sans', serif;
  font-family: var(--font-body);
  font-synthesis: none;
  line-height: 1.7;
}
body, button, input, select, textarea { font-family: var(--font-body); }
h1, h2, h3 { font-family: var(--font-display); line-height: 1.5; }
```

## Thành phần và responsive
- Header có ấn son, wordmark và version thật; không thêm menu chưa có chức năng.
- Hero toàn chiều ngang, tranh nền và gradient giấy để giữ độ tương phản chữ. Link Mở thư quyển cuộn tới hồ sơ thật.
- Panel hồ sơ: mặt giấy sáng, đường viền đồng, hai góc trang trí, shadow nhẹ. Primary button đỏ son; secondary button viền đồng; disabled phân biệt, focus outline xanh ngọc.
- Bộ dữ liệu hiển thị dùng definition list và chữ số tabular; thông báo role=status; file input chiếm toàn diện tích nút nhập và nhận focus bàn phím.
- Desktop 2 cột giới thiệu/hồ sơ. Dưới 760px chuyển 1 cột, ưu tiên panel trước phần giới thiệu; tranh hero vẫn hiển thị. Dưới 380px ẩn metadata phiên bản phụ. Tôn trọng prefers-reduced-motion.
- Khi triển khai gameplay Phase 2, bản đồ SVG phải chiếm phần lớn viewport, panel chi tiết ở cạnh phải và nhật ký thu gọn phía dưới. Dùng lại palette/font/panel tokens; giữ lớp địa hình cổ họa riêng với lớp chiến lược rõ nét. Màn hình gameplay/bản đồ chưa tồn tại trong Foundation nên lần này không dựng bản đồ giả hoặc thêm cơ chế.

## Asset và quyền sử dụng font
`public/images/imperial-landscape.png`: tạo bằng built-in imagegen cho dự án, bối cảnh giả tưởng. Prompt: “Panoramic Chinese landscape scroll painting on ivory aged silk; vast imperial palace with golden roofs and vermilion colonnades, jade river, arched bridge, walled city, layered blue-green mountains; fine gongbi ink/mineral pigment; luminous morning; palace on right, mist on left; no text, no watermark, no UI.” Prompt đầy đủ được chuẩn hóa theo yêu cầu Imperial Chinese Grand Strategy. Không phải tư liệu tái dựng lịch sử.

Prompt đầy đủ đã gửi built-in imagegen:

> Use case: historical-scene. Asset type: panoramic hero illustration for fictional Imperial Chinese grand strategy game De Nghiep. Create exquisite Chinese landscape scroll painting on warm ivory aged silk: vast magnificent imperial palace complex with layered ochre golden tiled roofs, vermilion colonnades and pale stone courtyards on lower right; winding jade river and arched stone bridge, small boats, ancient walled city extending toward misty layered blue-green karst mountains. Elegant fine gongbi ink and mineral pigment painting, sophisticated detailed architecture, expansive empire scale, serene luminous morning atmosphere. Wide panoramic composition approximately 2:1, landscape fills canvas, left side softer mountains and mist, palace prominent right foreground. Warm bright parchment, muted cinnabar, antique brass, celadon jade, charcoal ink. No text, no calligraphy, no watermark, no interface, no border. Fictional setting not a claim of historical reconstruction.

Font từ @fontsource/noto-sans và @fontsource/noto-serif; license SIL Open Font License, lưu bản sao tại `public/licenses/` để đi cùng static build.

## Kiểm chứng redesign
- TypeScript/lint/Vitest 16 ca/production build: PASS.
- Browser desktop: dấu tiếng Việt hiển thị liền chữ; computed font Noto Sans/Noto Serif, document.fonts loaded; không tràn ngang.
- Mobile 390×844: bố cục 1 cột, nội dung/nút không tràn ngang, tiêu đề và bảng hồ sơ đọc được.
- Tải hồ sơ cũ Ô 1, lưu Ô 3, xuất JSON, nhập lại JSON vào Ô 3, reload và tải Ô 3: PASS; giữ Ninh triều, tháng 1/năm 1, 12.000 quan, 6.000 thạch.
- Console error trong phiên kiểm tra: không có.
- Không chỉnh src/domain, src/engine, src/data, src/state hay src/persistence; callbacks lưu/tải/khởi lập/import/export giữ nguyên. Chỉ đổi markup, CSS, fonts và assets; package/lock thêm fonts.
- Ảnh kiểm chứng: docs/screenshots/imperial-redesign-desktop.png và imperial-redesign-mobile.png. Ảnh mobile toàn trang.
- Các cảnh báo annotation của Zod và 7 moderate dev dependencies từ Foundation chưa thay đổi trong tác vụ UI.
