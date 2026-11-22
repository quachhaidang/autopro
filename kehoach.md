# Auto Pro – trạng thái triển khai

## Kiến trúc hiện tại

- Giao diện vẫn dùng HTML/CSS/JavaScript trong thư mục `Website/`.
- Electron dùng `contextIsolation` và `preload` để gọi SQLite an toàn qua IPC.
- SQLite là nguồn dữ liệu chính trong `AutoPro_Data/Data.db` khi chạy Electron.
- Các khóa dữ liệu demo cũ trong `localStorage` được dọn khỏi renderer; dữ liệu trong SQLite không bị xóa.

## Chức năng đã hoàn thiện

- BM1: 5 loại xe, năm sản xuất từ 2005, 10 loại bằng lái, CRUD xe từ trang quản trị.
- BM2: kiểm tra CMND, bằng lái, số lượng xe theo loại khách hàng, thời gian thuê và ngày lễ.
- BM3: bảng danh sách xe có đúng 6 cột yêu cầu.
- BM4: quản lý khách hàng, đơn thuê, phí bảo dưỡng, giảm giá, tổng tiền và thanh toán.
- Đặt nhiều xe trong một lần thuê, kiểm tra xe bị trùng lịch và rollback giao dịch khi lỗi.
- Đăng nhập/đăng ký, phân quyền quản trị/khách hàng và cập nhật trạng thái đơn.
- Dashboard lấy số liệu trực tiếp từ SQLite.

## Cách chạy

```powershell
npm install
npm start
```

Tài khoản quản trị seed:

- Tên đăng nhập: `admin`
- Mật khẩu: `AutoPro2026!`

## Kiểm thử đã thực hiện

- Kiểm tra cú pháp toàn bộ Electron bridge và các JavaScript chính.
- Kiểm tra migration, khóa ngoại và `PRAGMA integrity_check`.
- Kiểm tra tạo/sửa/xóa xe, đặt xe nhiều dòng, phát hiện trùng lịch và rollback.
- Kiểm tra giới hạn thanh toán không vượt tổng tiền đơn.

## Lưu ý môi trường

Nếu Electron báo thiếu binary trong `node_modules/electron/dist`, chạy lại `npm install` với quyền truy cập mạng để tải đúng binary Electron. Mở trực tiếp các file HTML bằng trình duyệt chỉ là chế độ xem tĩnh và không thể thay thế cho chế độ Electron + SQLite.
