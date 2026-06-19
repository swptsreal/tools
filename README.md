# Useful Tools

Useful Tools là bộ công cụ web chạy offline, gom các tiện ích thường dùng vào một nơi để thao tác nhanh ngay trên trình duyệt.

## Mục Đích

Dự án giúp xử lý các tác vụ nhỏ hằng ngày mà không cần mở nhiều website khác nhau:

- Xem trước Mermaid diagram.
- Xem trước Markdown.
- Format, convert, encode/decode dữ liệu.
- Tạo nhanh UUID, password, hash hoặc dữ liệu mẫu.
- Làm việc hoàn toàn cục bộ, không gửi dữ liệu ra ngoài.

## Tính Năng Chính

- Chạy offline sau khi mở app.
- Không cần backend, không gọi API ngoài.
- Giao diện đơn giản: header, sidebar, vùng làm việc và footer.
- Tool tách riêng theo từng nhóm, dễ tìm và dễ mở rộng.
- Hỗ trợ copy, tải file, kéo-thả file và lưu bản nháp cục bộ tùy từng tool.
- Các tool dùng split editor có thanh chức năng riêng trong panel trái; mọi xử lý vẫn chạy cục bộ trong trình duyệt.

## Cài Đặt

```bash
npm install
```

## Chạy Development

```bash
npm run dev
```

Mở app theo URL hiển thị trong terminal, thường là:

```text
http://localhost:5173
```

## Build Production

```bash
npm run build
```

## Xem Bản Build

```bash
npm run preview
```

## Tools Hiện Có

### Mermaid Preview

Viết và xem trước Mermaid diagram trực tiếp trong trình duyệt.

Tác dụng:

- Preview flowchart, sequence diagram, class diagram, mindmap.
- Kiểm tra nhanh lỗi cú pháp Mermaid.
- Zoom, fullscreen và xuất kết quả khi cần.

### Markdown Preview

Viết Markdown và xem kết quả render ngay lập tức.

Tác dụng:

- Soạn README, note, tài liệu ngắn.
- Preview bảng, code block, heading, list.
- Hỗ trợ Mermaid block trong Markdown.

### Converter

- JSON YAML Converter: đổi JSON sang YAML và YAML đơn giản sang JSON.
- CSV JSON Converter: đổi CSV sang JSON array và JSON array sang CSV.
- Timestamp Converter: đổi Unix timestamp sang ngày giờ và ngược lại.
- Color Converter: đổi HEX sang RGB và HSL.

### Encoder / Decoder

- Base64 Encoder Decoder: mã hóa và giải mã Base64, hỗ trợ Unicode.
- URL Encoder Decoder: mã hóa, giải mã URL và xem nhanh query string.
- HTML Entity Encoder Decoder: mã hóa và giải mã HTML entities.
- JWT Decoder: đọc header/payload JWT offline, không xác minh chữ ký.
- Hash Generator: tạo SHA-1, SHA-256, SHA-384 và SHA-512 từ text.

## Tools Sẽ Có

### Formatter

- JSON Formatter
- SQL Formatter
- HTML Formatter
- CSS Formatter

### Encoder / Decoder

- JWT Secret Generator

### Generator

- UUID Generator
- Password Generator
- Fake Data Generator

### Text Tools

- Text Diff
- Sort Lines
- Remove Duplicate Lines
- Case Converter
- Word/Character Counter

### Developer Tools

- Regex Tester
- Cron Expression Helper
- Unit Converter
- MIME Type Lookup

## Nguyên Tắc Hoạt Động

- Dữ liệu được xử lý trên máy người dùng.
- Không upload nội dung lên server.
- Không yêu cầu đăng nhập.
- Không phụ thuộc internet cho các thao tác chính.
- Mỗi tool tập trung giải quyết một việc cụ thể thật nhanh.

## Định Hướng UI/UX

- Màu sắc cơ bản, dễ nhìn.
- Ít thao tác nhất có thể.
- Kết quả phản hồi nhanh.
- Nút copy/tải xuống đặt gần kết quả.
- Có ví dụ mặc định để dùng thử ngay.
