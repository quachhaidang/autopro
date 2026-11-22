-- BẮT BUỘC bật kiểm tra khóa ngoại trong SQLite
PRAGMA foreign_keys = ON;

-- =========================================================================
-- 1. VaiTro (Phân quyền)
-- =========================================================================
CREATE TABLE IF NOT EXISTS VaiTro (
    ma_vai_tro INTEGER PRIMARY KEY AUTOINCREMENT,
    ten_vai_tro TEXT NOT NULL UNIQUE,
    mo_ta TEXT
);

-- =========================================================================
-- 2. NguoiDung (Tài khoản đăng nhập)
-- =========================================================================
CREATE TABLE IF NOT EXISTS NguoiDung (
    ma_nguoi_dung INTEGER PRIMARY KEY AUTOINCREMENT,
    ma_vai_tro INTEGER NOT NULL,
    ten_dang_nhap TEXT NOT NULL UNIQUE,
    mat_khau_hash TEXT NOT NULL,
    ho_ten TEXT NOT NULL,
    so_dien_thoai TEXT,
    email TEXT,
    trang_thai TEXT NOT NULL DEFAULT 'HoatDong'
        CHECK (trang_thai IN ('HoatDong', 'TamKhoa', 'NgungHoatDong')),
    ngay_tao TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    ngay_cap_nhat TEXT,
    dang_nhap_lan_cuoi TEXT,

    FOREIGN KEY (ma_vai_tro) REFERENCES VaiTro(ma_vai_tro)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================================
-- 3. NhatKyHeThong (Audit Log)
-- =========================================================================
CREATE TABLE IF NOT EXISTS NhatKyHeThong (
    ma_nhat_ky INTEGER PRIMARY KEY AUTOINCREMENT,
    ma_nguoi_dung INTEGER,
    hanh_dong TEXT NOT NULL,
    ten_bang TEXT NOT NULL,
    ma_ban_ghi INTEGER,
    chi_tiet TEXT,
    ngay_tao TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),

    FOREIGN KEY (ma_nguoi_dung) REFERENCES NguoiDung(ma_nguoi_dung)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- =========================================================================
-- 4. LoaiXe (Phân loại xe)
-- =========================================================================
CREATE TABLE IF NOT EXISTS LoaiXe (
    ma_loai_xe INTEGER PRIMARY KEY AUTOINCREMENT,
    ten_loai_xe TEXT NOT NULL UNIQUE,
    mo_ta TEXT,
    trang_thai TEXT NOT NULL DEFAULT 'HoatDong'
        CHECK (trang_thai IN ('HoatDong', 'NgungSuDung'))
);

-- =========================================================================
-- 5. Xe (Thông tin đội xe)
-- =========================================================================
CREATE TABLE IF NOT EXISTS Xe (
    ma_xe INTEGER PRIMARY KEY AUTOINCREMENT,
    ma_loai_xe INTEGER NOT NULL,
    bien_so_xe TEXT NOT NULL UNIQUE,
    so_khung TEXT NOT NULL UNIQUE,
    hang_xe TEXT NOT NULL,
    ten_xe TEXT NOT NULL,
    nam_san_xuat INTEGER NOT NULL CHECK (nam_san_xuat >= 1990),
    mau_sac TEXT,
    so_cho INTEGER NOT NULL CHECK (so_cho > 0),
    hop_so TEXT NOT NULL CHECK (hop_so IN ('SoSan', 'TuDong')),
    loai_nhien_lieu TEXT NOT NULL CHECK (loai_nhien_lieu IN ('Xang', 'Dau', 'Dien', 'Hybrid')),
    so_km_hien_tai INTEGER NOT NULL DEFAULT 0 CHECK (so_km_hien_tai >= 0),
    gia_thue_ngay REAL NOT NULL CHECK (gia_thue_ngay >= 0),
    duong_dan_hinh_anh TEXT,
    chu_xe TEXT,
    yeu_cau_bang_lai TEXT,
    mo_ta TEXT,
    trang_thai TEXT NOT NULL DEFAULT 'SanSang'
        CHECK (trang_thai IN ('SanSang', 'DangThue', 'BaoDuong', 'NgungHoatDong')),
    ngay_tao TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    ngay_cap_nhat TEXT,

    FOREIGN KEY (ma_loai_xe) REFERENCES LoaiXe(ma_loai_xe)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================================
-- 6. KhachHang (Khách thuê xe)
-- =========================================================================
CREATE TABLE IF NOT EXISTS KhachHang (
    ma_khach_hang INTEGER PRIMARY KEY AUTOINCREMENT,
    ho_ten TEXT NOT NULL,
    so_dien_thoai TEXT NOT NULL UNIQUE,
    email TEXT,
    so_cccd TEXT NOT NULL UNIQUE,
    so_gplx TEXT NOT NULL UNIQUE,
    dia_chi TEXT,
    trang_thai TEXT NOT NULL DEFAULT 'HoatDong'
        CHECK (trang_thai IN ('HoatDong', 'DanhSachDen')),
    ngay_tao TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- =========================================================================
-- 7. DatXe (Đơn đặt xe)
-- =========================================================================
CREATE TABLE IF NOT EXISTS DatXe (
    ma_dat_xe INTEGER PRIMARY KEY AUTOINCREMENT,
    ma_don_thue TEXT NOT NULL UNIQUE,
    ma_khach_hang INTEGER NOT NULL,
    ma_xe INTEGER NOT NULL,
    nguoi_tao INTEGER NOT NULL,
    ngay_nhan_xe TEXT NOT NULL,
    ngay_tra_xe TEXT NOT NULL,
    ngay_nhan_thuc_te TEXT,
    ngay_tra_thuc_te TEXT,
    tien_thue_xe REAL NOT NULL DEFAULT 0 CHECK (tien_thue_xe >= 0),
    tien_dich_vu REAL NOT NULL DEFAULT 0 CHECK (tien_dich_vu >= 0),
    phi_bao_duong REAL NOT NULL DEFAULT 0 CHECK (phi_bao_duong >= 0),
    tien_giam_gia REAL NOT NULL DEFAULT 0 CHECK (tien_giam_gia >= 0),
    tien_dat_coc REAL NOT NULL DEFAULT 0 CHECK (tien_dat_coc >= 0),
    tong_tien REAL NOT NULL DEFAULT 0 CHECK (tong_tien >= 0),
    ghi_chu TEXT,
    trang_thai TEXT NOT NULL DEFAULT 'ChoXacNhan'
        CHECK (trang_thai IN ('ChoXacNhan', 'DaXacNhan', 'DangThue', 'HoanThanh', 'DaHuy')),
    ngay_tao TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    ngay_cap_nhat TEXT,

    CHECK (ngay_tra_xe > ngay_nhan_xe),
    FOREIGN KEY (ma_khach_hang) REFERENCES KhachHang(ma_khach_hang)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (ma_xe) REFERENCES Xe(ma_xe)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (nguoi_tao) REFERENCES NguoiDung(ma_nguoi_dung)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =========================================================================
-- 8. DichVuDatXe (Dịch vụ đi kèm đơn thuê)
-- =========================================================================
CREATE TABLE IF NOT EXISTS DichVuDatXe (
    ma_dich_vu_dat_xe INTEGER PRIMARY KEY AUTOINCREMENT,
    ma_dat_xe INTEGER NOT NULL,
    ten_dich_vu TEXT NOT NULL,
    so_luong INTEGER NOT NULL DEFAULT 1 CHECK (so_luong > 0),
    don_gia REAL NOT NULL CHECK (don_gia >= 0),
    thanh_tien REAL GENERATED ALWAYS AS (so_luong * don_gia) STORED,

    FOREIGN KEY (ma_dat_xe) REFERENCES DatXe(ma_dat_xe)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- =========================================================================
-- 9. HopDong (Hợp đồng thuê xe - Quan hệ 1-1 với DatXe)
-- =========================================================================
CREATE TABLE IF NOT EXISTS HopDong (
    ma_hop_dong INTEGER PRIMARY KEY AUTOINCREMENT,
    ma_dat_xe INTEGER NOT NULL UNIQUE,
    nguoi_ky INTEGER NOT NULL,
    ma_hop_dong_code TEXT NOT NULL UNIQUE,
    ngay_ky TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    tien_coc_yeu_cau REAL NOT NULL DEFAULT 0 CHECK (tien_coc_yeu_cau >= 0),
    duong_dan_hop_dong TEXT,
    dieu_khoan TEXT,
    trang_thai TEXT NOT NULL DEFAULT 'HieuLuc'
        CHECK (trang_thai IN ('Nhap', 'HieuLuc', 'HoanTat', 'ThanhLy', 'Huy')),

    FOREIGN KEY (ma_dat_xe) REFERENCES DatXe(ma_dat_xe)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (nguoi_ky) REFERENCES NguoiDung(ma_nguoi_dung)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =========================================================================
-- 10. ThanhToan (Thu chi, đặt cọc và công nợ)
-- =========================================================================
CREATE TABLE IF NOT EXISTS ThanhToan (
    ma_thanh_toan INTEGER PRIMARY KEY AUTOINCREMENT,
    ma_dat_xe INTEGER NOT NULL,
    nguoi_xu_ly INTEGER NOT NULL,
    ma_giao_dich TEXT NOT NULL UNIQUE,
    loai_thanh_toan TEXT NOT NULL
        CHECK (loai_thanh_toan IN ('DatCoc', 'TienThue', 'PhuPhi', 'HoanCoc', 'CongNo')),
    so_tien REAL NOT NULL CHECK (so_tien > 0),
    phuong_thuc_thanh_toan TEXT NOT NULL
        CHECK (phuong_thuc_thanh_toan IN ('TienMat', 'ChuyenKhoan', 'The', 'ViDienTu')),
    trang_thai_thanh_toan TEXT NOT NULL DEFAULT 'ThanhCong'
        CHECK (trang_thai_thanh_toan IN ('ChoXuLy', 'ThanhCong', 'ThatBai', 'DaHoan')),
    ngay_thanh_toan TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    ghi_chu TEXT,

    FOREIGN KEY (ma_dat_xe) REFERENCES DatXe(ma_dat_xe)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (nguoi_xu_ly) REFERENCES NguoiDung(ma_nguoi_dung)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =========================================================================
-- 11. BaoDuongXe (Lịch sử & kế hoạch bảo dưỡng)
-- =========================================================================
CREATE TABLE IF NOT EXISTS BaoDuongXe (
    ma_bao_duong INTEGER PRIMARY KEY AUTOINCREMENT,
    ma_xe INTEGER NOT NULL,
    nguoi_thuc_hien INTEGER NOT NULL,
    loai_bao_duong TEXT NOT NULL,
    noi_dung TEXT,
    chi_phi REAL NOT NULL DEFAULT 0 CHECK (chi_phi >= 0),
    so_km INTEGER NOT NULL CHECK (so_km >= 0),
    ngay_bao_duong TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    ngay_bao_duong_tiep_theo TEXT,
    trang_thai TEXT NOT NULL DEFAULT 'HoanThanh'
        CHECK (trang_thai IN ('KeHoach', 'DangThucHien', 'HoanThanh')),

    FOREIGN KEY (ma_xe) REFERENCES Xe(ma_xe)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (nguoi_thuc_hien) REFERENCES NguoiDung(ma_nguoi_dung)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =========================================================================
-- 12. KiemTraXe (Biên bản giao/nhận xe và kiểm tra định kỳ)
-- =========================================================================
CREATE TABLE IF NOT EXISTS KiemTraXe (
    ma_kiem_tra INTEGER PRIMARY KEY AUTOINCREMENT,
    ma_xe INTEGER NOT NULL,
    ma_dat_xe INTEGER, -- NULL nếu kiểm tra định kỳ không gắn với đơn thuê
    nguoi_kiem_tra INTEGER NOT NULL,
    loai_kiem_tra TEXT NOT NULL
        CHECK (loai_kiem_tra IN ('GiaoXe', 'NhanXe', 'DinhKy')),
    so_km INTEGER NOT NULL CHECK (so_km >= 0),
    muc_nhien_lieu TEXT,
    ghi_chu_tinh_trang TEXT,
    ghi_chu_hu_hong TEXT,
    ngay_kiem_tra TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),

    FOREIGN KEY (ma_xe) REFERENCES Xe(ma_xe)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (ma_dat_xe) REFERENCES DatXe(ma_dat_xe)
        ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (nguoi_kiem_tra) REFERENCES NguoiDung(ma_nguoi_dung)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =========================================================================
-- 13. BaoCaoHuHong (Sự cố & hư hỏng xe)
-- =========================================================================
CREATE TABLE IF NOT EXISTS BaoCaoHuHong (
    ma_bao_cao_hu_hong INTEGER PRIMARY KEY AUTOINCREMENT,
    ma_xe INTEGER NOT NULL,
    ma_dat_xe INTEGER, -- NULL nếu hư hỏng phát sinh tại bãi xe
    nguoi_bao_cao INTEGER NOT NULL,
    mo_ta_hu_hong TEXT NOT NULL,
    chi_phi_du_kien REAL NOT NULL DEFAULT 0 CHECK (chi_phi_du_kien >= 0),
    chi_phi_thuc_te REAL CHECK (chi_phi_thuc_te IS NULL OR chi_phi_thuc_te >= 0),
    trang_thai TEXT NOT NULL DEFAULT 'MoiBaoCao'
        CHECK (trang_thai IN ('MoiBaoCao', 'DangSua', 'DaXuLy')),
    ngay_bao_cao TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    ngay_xu_ly TEXT,

    FOREIGN KEY (ma_xe) REFERENCES Xe(ma_xe)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (ma_dat_xe) REFERENCES DatXe(ma_dat_xe)
        ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (nguoi_bao_cao) REFERENCES NguoiDung(ma_nguoi_dung)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =========================================================================
-- INDEX TỐI ƯU TRUY VẤN
-- =========================================================================
CREATE INDEX IF NOT EXISTS IX_Xe_TrangThai ON Xe(trang_thai);
CREATE INDEX IF NOT EXISTS IX_DatXe_Xe_ThoiGian ON DatXe(ma_xe, ngay_nhan_xe, ngay_tra_xe);
CREATE INDEX IF NOT EXISTS IX_DatXe_TrangThai ON DatXe(trang_thai);
CREATE INDEX IF NOT EXISTS IX_ThanhToan_DatXe ON ThanhToan(ma_dat_xe, loai_thanh_toan);
CREATE INDEX IF NOT EXISTS IX_NhatKy_TraCuu ON NhatKyHeThong(ten_bang, ma_ban_ghi, ngay_tao DESC);
CREATE INDEX IF NOT EXISTS IX_BaoDuong_Xe ON BaoDuongXe(ma_xe, ngay_bao_duong DESC);
CREATE INDEX IF NOT EXISTS IX_KiemTra_Xe_DatXe ON KiemTraXe(ma_xe, ma_dat_xe);

CREATE TRIGGER IF NOT EXISTS trg_Xe_NamSanXuat_2005
BEFORE INSERT ON Xe
FOR EACH ROW WHEN NEW.nam_san_xuat < 2005
BEGIN SELECT RAISE(ABORT, 'nam_san_xuat phai tu 2005 tro di'); END;

CREATE TRIGGER IF NOT EXISTS trg_Xe_NamSanXuat_2005_Update
BEFORE UPDATE OF nam_san_xuat ON Xe
FOR EACH ROW WHEN NEW.nam_san_xuat < 2005
BEGIN SELECT RAISE(ABORT, 'nam_san_xuat phai tu 2005 tro di'); END;

-- =========================================================================
-- TRIGGER TỰ ĐỘNG CẬP NHẬT ngay_cap_nhat
-- =========================================================================
CREATE TRIGGER IF NOT EXISTS trg_NguoiDung_CapNhat
AFTER UPDATE ON NguoiDung
FOR EACH ROW
WHEN NEW.ngay_cap_nhat IS OLD.ngay_cap_nhat
BEGIN
    UPDATE NguoiDung
    SET ngay_cap_nhat = datetime('now', 'localtime')
    WHERE ma_nguoi_dung = OLD.ma_nguoi_dung;
END;

CREATE TRIGGER IF NOT EXISTS trg_Xe_CapNhat
AFTER UPDATE ON Xe
FOR EACH ROW
WHEN NEW.ngay_cap_nhat IS OLD.ngay_cap_nhat
BEGIN
    UPDATE Xe
    SET ngay_cap_nhat = datetime('now', 'localtime')
    WHERE ma_xe = OLD.ma_xe;
END;

CREATE TRIGGER IF NOT EXISTS trg_DatXe_CapNhat
AFTER UPDATE ON DatXe
FOR EACH ROW
WHEN NEW.ngay_cap_nhat IS OLD.ngay_cap_nhat
BEGIN
    UPDATE DatXe
    SET ngay_cap_nhat = datetime('now', 'localtime')
    WHERE ma_dat_xe = OLD.ma_dat_xe;
END;
