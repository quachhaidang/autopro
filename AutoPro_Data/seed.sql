PRAGMA foreign_keys = ON;

-- 1. VaiTro
INSERT INTO VaiTro (ten_vai_tro, mo_ta) VALUES
('Admin', 'Toàn quyền quản trị hệ thống và cấu hình'),
('Quản lý', 'Quản lý đội xe, duyệt hợp đồng và xem báo cáo'),
('Nhân viên', 'Tạo đơn đặt xe, giao nhận và kiểm tra xe'),
('Kế toán', 'Quản lý thu chi, tiền cọc và công nợ');

-- 2. NguoiDung (mật khẩu demo nên mã hóa bcrypt trong code thật)
INSERT INTO NguoiDung (ma_vai_tro, ten_dang_nhap, mat_khau_hash, ho_ten, so_dien_thoai, email) VALUES
(1, 'admin', '$2b$10$demoHashAdmin123456', 'Nguyễn Hoàng Anh', '0901000001', 'admin@autodrive.vn'),
(2, 'quanly', '$2b$10$demoHashManager1234', 'Trần Thị Thu Hà', '0901000002', 'quanly@autodrive.vn'),
(3, 'nhanvien', '$2b$10$demoHashStaff123456', 'Lê Minh Tuấn', '0901000003', 'tuan.le@autodrive.vn'),
(4, 'ketoan', '$2b$10$demoHashAccountant1', 'Phạm Ngọc Lan', '0901000004', 'lan.pham@autodrive.vn');

-- 3. LoaiXe
INSERT INTO LoaiXe (ten_loai_xe, mo_ta) VALUES
('Xe 5 chỗ', 'Xe nhỏ gọn tiết kiệm nhiên liệu đi nội thành'),
('Xe 7 chỗ', 'Xe gầm cao rộng rãi cho gia đình và đường dài'),
('Xe tải', 'Xe chở hàng nhẹ và đi địa hình'),
('Xe máy', 'Xe máy cho thuê tự lái'),
('Xe khách', 'Xe chở khách theo danh mục');

-- 4. Xe
INSERT INTO Xe (ma_loai_xe, bien_so_xe, so_khung, hang_xe, ten_xe, nam_san_xuat, mau_sac, so_cho, hop_so, loai_nhien_lieu, so_km_hien_tai, gia_thue_ngay, duong_dan_hinh_anh, trang_thai) VALUES
(1, '60A-123.45', 'RLH10000000001', 'Toyota', 'Vios G', 2024, 'Trắng', 5, 'TuDong', 'Xang', 18500, 800000, 'mazda3.webp', 'DangThue'),
(1, '60A-234.56', 'RLH10000000002', 'Honda', 'City RS', 2023, 'Đỏ', 5, 'TuDong', 'Xang', 24100, 850000, 'honda.webp', 'SanSang'),
(2, '60A-345.67', 'RLH10000000003', 'Hyundai', 'Santa Fe', 2024, 'Đen', 7, 'TuDong', 'Dau', 15200, 1400000, 'hyundai.webp', 'SanSang'),
(3, '60A-456.78', 'RLH10000000004', 'Mitsubishi', 'Xpander Cross', 2023, 'Bạc', 7, 'TuDong', 'Xang', 32000, 1000000, 'mitsubishi.webp', 'BaoDuong');

-- 5. KhachHang
INSERT INTO KhachHang (ho_ten, so_dien_thoai, email, so_cccd, so_gplx, dia_chi) VALUES
('Võ Thành Công', '0912345678', 'cong.vo@gmail.com', '075094001122', '750194001122', 'Biên Hòa, Đồng Nai'),
('Nguyễn Thị Mai', '0987654321', 'mai.nguyen@gmail.com', '075196003344', '750196003344', 'Long Thành, Đồng Nai'),
('Đặng Quốc Bảo', '0933445566', 'bao.dang@gmail.com', '079092005566', '790192005566', 'Thủ Đức, TP.HCM');

-- 6. DatXe
INSERT INTO DatXe (ma_don_thue, ma_khach_hang, ma_xe, nguoi_tao, ngay_nhan_xe, ngay_tra_xe, ngay_nhan_thuc_te, tien_thue_xe, tien_dich_vu, tien_giam_gia, tien_dat_coc, tong_tien, ghi_chu, trang_thai) VALUES
('DX-2026-0001', 1, 1, 3, '2026-11-18 08:00:00', '2026-11-21 08:00:00', '2026-11-18 08:15:00', 2400000, 300000, 100000, 1000000, 2600000, 'Khách thuê đi công tác Vũng Tàu', 'DangThue'),
('DX-2026-0002', 2, 3, 3, '2026-11-25 07:00:00', '2026-11-27 19:00:00', NULL, 3500000, 200000, 0, 1500000, 3700000, 'Giao xe tận nhà', 'DaXacNhan');

-- 7. DichVuDatXe (cột thanh_tien tự động tính)
INSERT INTO DichVuDatXe (ma_dat_xe, ten_dich_vu, so_luong, don_gia) VALUES
(1, 'Bảo hiểm mở rộng thân vỏ', 3, 100000),
(2, 'Giao nhận xe tận nơi', 1, 200000);

-- 8. HopDong
INSERT INTO HopDong (ma_dat_xe, nguoi_ky, ma_hop_dong_code, tien_coc_yeu_cau, dieu_khoan, trang_thai) VALUES
(1, 2, 'HD-2026-0001', 1000000, 'Khách hàng chịu trách nhiệm phạt nguội và trả xe đúng hạn.', 'HieuLuc');

-- 9. ThanhToan
INSERT INTO ThanhToan (ma_dat_xe, nguoi_xu_ly, ma_giao_dich, loai_thanh_toan, so_tien, phuong_thuc_thanh_toan, ghi_chu) VALUES
(1, 4, 'GD-20261118-01', 'DatCoc', 1000000, 'ChuyenKhoan', 'Khách chuyển khoản cọc qua Vietcombank'),
(2, 4, 'GD-20261119-01', 'DatCoc', 1500000, 'ChuyenKhoan', 'Đặt cọc giữ xe Santa Fe');

-- 10. BaoDuongXe
INSERT INTO BaoDuongXe (ma_xe, nguoi_thuc_hien, loai_bao_duong, noi_dung, chi_phi, so_km, ngay_bao_duong_tiep_theo, trang_thai) VALUES
(4, 3, 'Bảo dưỡng cấp 30.000km', 'Thay nhớt máy, lọc gió động cơ, kiểm tra má phanh', 2450000, 32000, '2027-05-19 00:00:00', 'DangThucHien');

-- 11. KiemTraXe
INSERT INTO KiemTraXe (ma_xe, ma_dat_xe, nguoi_kiem_tra, loai_kiem_tra, so_km, muc_nhien_lieu, ghi_chu_tinh_trang, ghi_chu_hu_hong) VALUES
(1, 1, 3, 'GiaoXe', 18500, 'Đầy bình (100%)', 'Ngoại thất sạch, đủ giấy tờ và lốp dự phòng', 'Trầy nhẹ cản trước bên phải 2cm');

-- 12. BaoCaoHuHong
INSERT INTO BaoCaoHuHong (ma_xe, ma_dat_xe, nguoi_bao_cao, mo_ta_hu_hong, chi_phi_du_kien, trang_thai) VALUES
(4, NULL, 3, 'Đèn pha bên trái bị mờ hơi nước khi rửa xe tại bãi', 650000, 'MoiBaoCao');

-- 13. NhatKyHeThong
INSERT INTO NhatKyHeThong (ma_nguoi_dung, hanh_dong, ten_bang, ma_ban_ghi, chi_tiet) VALUES
(3, 'INSERT', 'DatXe', 1, 'Tạo mới đơn thuê DX-2026-0001 cho khách Võ Thành Công'),
(4, 'INSERT', 'ThanhToan', 1, 'Xác nhận thu tiền cọc 1.000.000đ đơn DX-2026-0001');
