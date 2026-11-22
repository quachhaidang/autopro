winget install --id Git.Git -e --source wingetconst path = require("node:path");
const crypto = require("node:crypto");
const fs = require("node:fs");
const { app } = require("electron");
const { DatabaseSync } = require("node:sqlite");

const sourceDatabasePath = path.join(__dirname, "..", "AutoPro_Data", "Data.db");
const packagedDatabasePath = process.resourcesPath
  ? path.join(process.resourcesPath, "AutoPro_Data", "Data.db")
  : sourceDatabasePath;
const isPackaged = Boolean(app && app.isPackaged);
const databasePath = isPackaged
  ? path.join(app.getPath("userData"), "AutoPro_Data", "Data.db")
  : sourceDatabasePath;

if (isPackaged && !fs.existsSync(databasePath)) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  fs.copyFileSync(packagedDatabasePath, databasePath);
}

const db = new DatabaseSync(databasePath);
db.exec("PRAGMA foreign_keys = ON");

const VEHICLE_TYPES = ["Xe tải", "Xe máy", "Xe 5 chỗ", "Xe 7 chỗ", "Xe khách"];
const LICENSE_TYPES = ["A1", "A2", "A3", "A4", "B1", "B2", "C", "D", "E", "F"];
const IMAGE_BY_BRAND = {
  Toyota: "vinfast.webp",
  Honda: "honda.webp",
  Hyundai: "hyundai.webp",
  Mazda: "mazda3.webp",
  Mercedes: "mercedes.webp",
  "Mercedes-Benz": "mercedes.webp",
  MG: "mg5.webp",
  Mitsubishi: "mitsubishi.webp",
  VinFast: "vinfast.webp"
};
const STATUS_TO_UI = { ChoXacNhan: "pending", DaXacNhan: "confirmed", DangThue: "active", HoanThanh: "completed", DaHuy: "cancelled" };
const STATUS_TO_DB = { pending: "ChoXacNhan", confirmed: "DaXacNhan", active: "DangThue", completed: "HoanThanh", cancelled: "DaHuy" };
const SEATS_BY_CATEGORY = { "Xe tải": 3, "Xe máy": 2, "Xe 5 chỗ": 5, "Xe 7 chỗ": 7, "Xe khách": 16 };

function defaultVehicleImage(brand, name = "") {
  const normalizedBrand = String(brand || "").trim();
  if (IMAGE_BY_BRAND[normalizedBrand]) return IMAGE_BY_BRAND[normalizedBrand];
  const normalizedName = String(name || "").toLowerCase();
  if (normalizedName.includes("santa") || normalizedName.includes("hyundai")) return "hyundai.webp";
  if (normalizedName.includes("xpander") || normalizedName.includes("mitsubishi")) return "mitsubishi.webp";
  return "vinfast.webp";
}

function vehicleImage(value, brand, name) {
  const image = String(value || "").trim();
  if (/^data:image\/(?:jpeg|png|webp|gif);base64,[a-z0-9+/]+=*$/i.test(image)) {
    if (image.length > 700000) throw new Error("Ảnh xe sau khi nén vẫn quá lớn.");
    return image;
  }
  if (/^(?:images\/)?[a-z0-9][a-z0-9._-]*\.(?:webp|png|jpe?g|gif)$/i.test(image)) {
    return image.replace(/^images\//i, "");
  }
  return defaultVehicleImage(brand, name);
}

function hasColumn(table, column) {
  const allowedTables = ["Xe", "DatXe", "NguoiDung", "KhachHang", "LoaiXe"];
  if (!allowedTables.includes(table)) throw new Error("Tên bảng không hợp lệ.");
  return db.prepare(`PRAGMA table_info(${table})`).all().some((item) => item.name === column);
}

function migrateSchema() {
  db.prepare("INSERT OR IGNORE INTO VaiTro (ten_vai_tro, mo_ta) VALUES ('Khách hàng', 'Tài khoản khách thuê xe')").run();
  if (!hasColumn("Xe", "chu_xe")) db.exec("ALTER TABLE Xe ADD COLUMN chu_xe TEXT");
  if (!hasColumn("Xe", "yeu_cau_bang_lai")) db.exec("ALTER TABLE Xe ADD COLUMN yeu_cau_bang_lai TEXT");
  if (!hasColumn("DatXe", "phi_bao_duong")) db.exec("ALTER TABLE DatXe ADD COLUMN phi_bao_duong REAL NOT NULL DEFAULT 0 CHECK (phi_bao_duong >= 0)");
  const vehiclesWithoutImages = db.prepare("SELECT ma_xe, hang_xe, ten_xe FROM Xe WHERE duong_dan_hinh_anh IS NULL OR TRIM(duong_dan_hinh_anh) = ''").all();
  const setVehicleImage = db.prepare("UPDATE Xe SET duong_dan_hinh_anh = ? WHERE ma_xe = ?");
  for (const vehicle of vehiclesWithoutImages) setVehicleImage.run(defaultVehicleImage(vehicle.hang_xe, vehicle.ten_xe), vehicle.ma_xe);
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_Xe_NamSanXuat_2005
    BEFORE INSERT ON Xe WHEN NEW.nam_san_xuat < 2005
    BEGIN SELECT RAISE(ABORT, 'Năm sản xuất phải từ 2005 trở đi'); END;
    CREATE TRIGGER IF NOT EXISTS trg_Xe_NamSanXuat_2005_Update
    BEFORE UPDATE OF nam_san_xuat ON Xe WHEN NEW.nam_san_xuat < 2005
    BEGIN SELECT RAISE(ABORT, 'Năm sản xuất phải từ 2005 trở đi'); END;
  `);
  const rename = db.prepare("UPDATE LoaiXe SET ten_loai_xe = ? WHERE ma_loai_xe = ?");
  rename.run("Xe 5 chỗ", 1); rename.run("Xe 7 chỗ", 2); rename.run("Xe tải", 4);
  db.prepare("UPDATE Xe SET ma_loai_xe = 2 WHERE ma_loai_xe = 3").run();
  db.prepare("DELETE FROM LoaiXe WHERE ma_loai_xe = 3").run();
  for (const type of ["Xe máy", "Xe khách"]) db.prepare("INSERT OR IGNORE INTO LoaiXe (ten_loai_xe, mo_ta) VALUES (?, ?)").run(type, `Loại xe theo BM1: ${type}`);
  const demoVehicles = [
    { category: "Xe 5 chỗ", brand: "Mazda", name: "Mazda 3", year: 2024, seats: 5, price: 1100000, image: "mazda3.webp" },
    { category: "Xe 5 chỗ", brand: "Mercedes-Benz", name: "Mercedes-Benz C-Class", year: 2023, seats: 5, price: 2800000, image: "mercedes.webp" },
    { category: "Xe 5 chỗ", brand: "VinFast", name: "VinFast VF 8", year: 2024, seats: 5, price: 1600000, image: "vinfast.webp" }
  ];
  const insertDemo = db.prepare(`INSERT INTO Xe (ma_loai_xe, bien_so_xe, so_khung, hang_xe, ten_xe, nam_san_xuat, so_cho, hop_so, loai_nhien_lieu, gia_thue_ngay, duong_dan_hinh_anh, chu_xe, yeu_cau_bang_lai, trang_thai)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'TuDong', ?, ?, ?, 'Auto Pro', 'B2', 'SanSang')`);
  demoVehicles.forEach((vehicle, index) => {
    if (db.prepare("SELECT 1 FROM Xe WHERE ten_xe = ?").get(vehicle.name)) return;
    const type = db.prepare("SELECT ma_loai_xe FROM LoaiXe WHERE ten_loai_xe = ?").get(vehicle.category);
    if (type) insertDemo.run(type.ma_loai_xe, `DEMO-${Date.now()}-${index}`, `DEMO-${Date.now()}-${index}-${Math.random()}`, vehicle.brand, vehicle.name, vehicle.year, vehicle.seats, vehicle.loaiNhienLieu || "Xang", vehicle.price, vehicle.image);
  });
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derived = crypto.pbkdf2Sync(password, salt, 150000, 32, "sha256").toString("hex");
  return `pbkdf2$150000$${salt}$${derived}`;
}

function verifyPassword(password, encoded) {
  const [algorithm, rounds, salt, expected] = String(encoded || "").split("$");
  if (algorithm !== "pbkdf2" || !rounds || !salt || !expected) return false;
  const actual = crypto.pbkdf2Sync(password, salt, Number(rounds), 32, "sha256").toString("hex");
  return actual.length === expected.length && crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

function ensureDemoAccounts() {
  const demoPasswords = { admin: "AutoPro2026!", quanly: "AutoPro2026!", nhanvien: "AutoPro2026!", ketoan: "AutoPro2026!" };
  for (const [username, password] of Object.entries(demoPasswords)) {
    const user = db.prepare("SELECT ma_nguoi_dung, mat_khau_hash FROM NguoiDung WHERE ten_dang_nhap = ?").get(username);
    if (user && !String(user.mat_khau_hash).startsWith("pbkdf2$")) db.prepare("UPDATE NguoiDung SET mat_khau_hash = ? WHERE ma_nguoi_dung = ?").run(hashPassword(password), user.ma_nguoi_dung);
  }
}

migrateSchema();
ensureDemoAccounts();

function typeId(category) {
  if (!VEHICLE_TYPES.includes(category)) throw new Error("Loại xe không hợp lệ.");
  const row = db.prepare("SELECT ma_loai_xe FROM LoaiXe WHERE ten_loai_xe = ?").get(category);
  if (!row) throw new Error("Loại xe chưa có trong SQLite.");
  return row.ma_loai_xe;
}

function validateFleet(payload) {
  const year = Number(payload.year); const price = Number(payload.price);
  if (!payload.name || !payload.brand || !payload.owner) throw new Error("Thiếu thông tin BM1.");
  if (!Number.isInteger(year) || year < 2005) throw new Error("Năm sản xuất phải từ 2005 trở đi.");
  if (!Number.isFinite(price) || price < 0) throw new Error("Đơn giá ngày không hợp lệ.");
  if (!LICENSE_TYPES.includes(payload.license)) throw new Error("Yêu cầu bằng lái không hợp lệ.");
  typeId(payload.category);
  vehicleImage(payload.image, payload.brand, payload.name);
}

function listFleet() {
  return db.prepare(`SELECT x.ma_xe AS id, x.hang_xe AS brand, x.ten_xe AS name, l.ten_loai_xe AS category,
    x.nam_san_xuat AS year, COALESCE(x.chu_xe, '') AS owner, COALESCE(x.yeu_cau_bang_lai, '') AS license,
    x.gia_thue_ngay AS price, COALESCE(x.duong_dan_hinh_anh, '') AS image, x.trang_thai AS dbStatus
    FROM Xe x JOIN LoaiXe l ON l.ma_loai_xe = x.ma_loai_xe ORDER BY x.ma_xe`).all().map((car) => ({ ...car, image: car.image || defaultVehicleImage(car.brand, car.name), status: car.dbStatus, featured: false }));
}

function createFleet(payload) {
  validateFleet(payload);
  const stamp = Date.now();
  const result = db.prepare(`INSERT INTO Xe (ma_loai_xe, bien_so_xe, so_khung, hang_xe, ten_xe, nam_san_xuat, so_cho, hop_so, loai_nhien_lieu, gia_thue_ngay, duong_dan_hinh_anh, chu_xe, yeu_cau_bang_lai)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'TuDong', 'Xang', ?, ?, ?, ?)`).run(typeId(payload.category), `TEMP-${stamp}`, `TEMP-${stamp}-${Math.random()}`, payload.brand, payload.name, Number(payload.year), SEATS_BY_CATEGORY[payload.category] || 5, Number(payload.price), vehicleImage(payload.image, payload.brand, payload.name), payload.owner, payload.license);
  return listFleet().find((car) => car.id === Number(result.lastInsertRowid));
}

function updateFleet(id, payload) {
  validateFleet(payload);
  db.prepare(`UPDATE Xe SET ma_loai_xe = ?, hang_xe = ?, ten_xe = ?, nam_san_xuat = ?, so_cho = ?, gia_thue_ngay = ?, duong_dan_hinh_anh = ?, chu_xe = ?, yeu_cau_bang_lai = ? WHERE ma_xe = ?`)
    .run(typeId(payload.category), payload.brand, payload.name, Number(payload.year), SEATS_BY_CATEGORY[payload.category] || 5, Number(payload.price), vehicleImage(payload.image, payload.brand, payload.name), payload.owner, payload.license, Number(id));
  return listFleet().find((car) => car.id === Number(id));
}

function deleteFleet(id) {
  if (db.prepare("SELECT COUNT(*) AS count FROM DatXe WHERE ma_xe = ?").get(Number(id)).count > 0) throw new Error("Không thể xóa xe đã có phiếu thuê.");
  db.prepare("DELETE FROM Xe WHERE ma_xe = ?").run(Number(id)); return true;
}

function dateParts(value) {
  const match = String(value || "").match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?/);
  return { date: match ? match[1] : "", time: match && match[2] ? match[2] : "00:00" };
}

function listBookings() {
  return db.prepare(`SELECT d.ma_dat_xe AS dbId, d.ma_don_thue AS id, k.ho_ten AS fullname, k.so_dien_thoai AS phone,
    k.email, k.so_cccd AS customerId, k.so_gplx AS driverLicense, x.ten_xe AS carType, x.ma_xe AS carId, x.hang_xe AS carBrand,
    d.ngay_nhan_xe AS rawPickup, d.ngay_tra_xe AS rawReturn, d.tien_thue_xe AS rentalSubtotal, d.tien_dich_vu AS serviceTotal,
    d.phi_bao_duong AS maintenanceFee,
    d.tien_giam_gia AS discount, d.tong_tien AS total, d.ghi_chu AS note, d.trang_thai AS dbStatus
    FROM DatXe d JOIN KhachHang k ON k.ma_khach_hang = d.ma_khach_hang JOIN Xe x ON x.ma_xe = d.ma_xe ORDER BY d.ma_dat_xe DESC`).all().map((booking) => {
    const pickup = dateParts(booking.rawPickup); const returned = dateParts(booking.rawReturn);
    return { ...booking, pickupDate: pickup.date, pickupTime: pickup.time, returnDate: returned.date, returnTime: returned.time, status: STATUS_TO_UI[booking.dbStatus] || booking.dbStatus };
  });
}

function customerId(payload) {
  const found = db.prepare("SELECT ma_khach_hang FROM KhachHang WHERE so_cccd = ? OR so_dien_thoai = ?").get(payload.customerId, payload.phone);
  if (found) {
    db.prepare("UPDATE KhachHang SET ho_ten = ?, email = ?, so_gplx = ?, dia_chi = ? WHERE ma_khach_hang = ?").run(payload.fullname, payload.email || null, payload.driverLicense, payload.pickupAddress || null, found.ma_khach_hang);
    return found.ma_khach_hang;
  }
  return Number(db.prepare("INSERT INTO KhachHang (ho_ten, so_dien_thoai, email, so_cccd, so_gplx, dia_chi) VALUES (?, ?, ?, ?, ?, ?)").run(payload.fullname, payload.phone, payload.email || null, payload.customerId, payload.driverLicense, payload.pickupAddress || null).lastInsertRowid);
}

function createBookings(payload) {
  const items = Array.isArray(payload.items) && payload.items.length ? payload.items : [payload];
  const creator = Number(payload.userId) || 1; const inserted = [];
  if (!payload.fullname || !payload.phone || !payload.customerId || !payload.driverLicense) throw new Error("Vui lòng nhập đủ thông tin khách hàng.");
  db.exec("BEGIN IMMEDIATE");
  try {
    const customer = customerId(payload);
    for (const item of items) {
      const car = db.prepare("SELECT ma_xe FROM Xe WHERE ma_xe = ?").get(Number(item.carId));
      if (!car) throw new Error("Không tìm thấy xe trong SQLite.");
      const pickup = `${item.pickupDate} ${item.pickupTime || "00:00"}:00`; const returned = `${item.returnDate} ${item.returnTime || "00:00"}:00`;
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:00$/.test(pickup) || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:00$/.test(returned) || returned <= pickup) throw new Error("Khoảng thời gian thuê không hợp lệ.");
      for (const field of ["rentalSubtotal", "serviceTotal", "maintenanceFee", "discount", "total"]) {
        if (!Number.isFinite(Number(item[field])) || Number(item[field]) < 0) throw new Error("Chi phí đơn thuê không hợp lệ.");
      }
      const calculatedTotal = Number(item.rentalSubtotal) + Number(item.serviceTotal) + Number(item.maintenanceFee) - Number(item.discount);
      if (Math.abs(calculatedTotal - Number(item.total)) > 1) throw new Error("Tổng tiền đơn thuê không khớp với các khoản phí.");
      if (db.prepare(`SELECT 1 FROM DatXe WHERE ma_xe = ? AND trang_thai NOT IN ('DaHuy', 'HoanThanh') AND ngay_nhan_xe < ? AND ngay_tra_xe > ? LIMIT 1`).get(car.ma_xe, returned, pickup)) throw new Error("Xe đã có phiếu thuê trong khoảng thời gian này.");
      const id = `DX-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}-${inserted.length + 1}`;
      const result = db.prepare(`INSERT INTO DatXe (ma_don_thue, ma_khach_hang, ma_xe, nguoi_tao, ngay_nhan_xe, ngay_tra_xe, tien_thue_xe, tien_dich_vu, phi_bao_duong, tien_giam_gia, tong_tien, ghi_chu, trang_thai)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ChoXacNhan')`).run(id, customer, car.ma_xe, creator, pickup, returned, Number(item.rentalSubtotal || 0), Number(item.serviceTotal || 0), Number(item.maintenanceFee || 0), Number(item.discount || 0), Number(item.total || 0), item.note || null);
      inserted.push({ id, dbId: Number(result.lastInsertRowid) });
    }
    db.exec("COMMIT"); return inserted;
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

function updateBookingStatus(id, status) {
  if (!STATUS_TO_DB[status]) throw new Error("Trạng thái đơn không hợp lệ.");
  db.prepare("UPDATE DatXe SET trang_thai = ? WHERE ma_don_thue = ?").run(STATUS_TO_DB[status], id); return true;
}

function createPayment(payload) {
  const booking = db.prepare("SELECT ma_dat_xe, tong_tien FROM DatXe WHERE ma_don_thue = ?").get(payload.bookingId);
  if (!booking) throw new Error("Không tìm thấy phiếu thuê.");
  const amount = Number(payload.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Số tiền thanh toán không hợp lệ.");
  if (!["TienMat", "ChuyenKhoan", "The", "ViDienTu"].includes(payload.method)) throw new Error("Phương thức thanh toán không hợp lệ.");
  const paid = db.prepare("SELECT COALESCE(SUM(so_tien), 0) AS total FROM ThanhToan WHERE ma_dat_xe = ?").get(booking.ma_dat_xe).total;
  if (amount > Number(booking.tong_tien) - Number(paid) + 0.01) throw new Error("Số tiền thanh toán vượt quá số tiền còn phải trả.");
  const transaction = `GD-${Date.now()}`;
  db.prepare(`INSERT INTO ThanhToan (ma_dat_xe, nguoi_xu_ly, ma_giao_dich, loai_thanh_toan, so_tien, phuong_thuc_thanh_toan, ghi_chu)
    VALUES (?, ?, ?, 'TienThue', ?, ?, ?)`).run(booking.ma_dat_xe, Number(payload.userId) || 1, transaction, amount, payload.method, payload.note || null);
  return { transaction, amount };
}

function login(username, password) {
  const user = db.prepare(`SELECT ma_nguoi_dung AS userId, ma_vai_tro AS roleId, ten_dang_nhap AS username, ho_ten AS name, so_dien_thoai AS phone, email, mat_khau_hash AS passwordHash FROM NguoiDung WHERE ten_dang_nhap = ? OR email = ?`).get(username, username);
  if (!user || !verifyPassword(password, user.passwordHash)) throw new Error("Tài khoản hoặc mật khẩu không chính xác.");
  db.prepare("UPDATE NguoiDung SET dang_nhap_lan_cuoi = datetime('now','localtime') WHERE ma_nguoi_dung = ?").run(user.userId); delete user.passwordHash; return user;
}

function register(payload) {
  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim().toLowerCase();
  const phone = String(payload.phone || "").trim();
  const password = String(payload.password || "");
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{10,11}$/.test(phone) || password.length < 8) throw new Error("Thông tin đăng ký không hợp lệ.");
  const role = db.prepare("SELECT ma_vai_tro FROM VaiTro WHERE ten_vai_tro = 'Khách hàng'").get() || { ma_vai_tro: 3 };
  const result = db.prepare("INSERT INTO NguoiDung (ma_vai_tro, ten_dang_nhap, mat_khau_hash, ho_ten, so_dien_thoai, email) VALUES (?, ?, ?, ?, ?, ?)").run(role.ma_vai_tro, email, hashPassword(password), name, phone, email);
  return { userId: Number(result.lastInsertRowid), username: email, name, phone, email };
}

function changePassword(payload) {
  const userId = Number(payload.userId);
  const currentPassword = String(payload.currentPassword || "");
  const newPassword = String(payload.newPassword || "");
  if (!userId || currentPassword.length < 1 || newPassword.length < 8) throw new Error("Mật khẩu mới phải có ít nhất 8 ký tự.");
  const user = db.prepare("SELECT mat_khau_hash FROM NguoiDung WHERE ma_nguoi_dung = ?").get(userId);
  if (!user || !verifyPassword(currentPassword, user.mat_khau_hash)) throw new Error("Mật khẩu hiện tại không chính xác.");
  db.prepare("UPDATE NguoiDung SET mat_khau_hash = ? WHERE ma_nguoi_dung = ?").run(hashPassword(newPassword), userId);
  return true;
}

function dashboard() {
  const count = (sql) => db.prepare(sql).get().count;
  const revenue = db.prepare("SELECT COALESCE(SUM(tong_tien), 0) AS total FROM DatXe WHERE trang_thai != 'DaHuy'").get().total;
  const monthly = db.prepare("SELECT substr(ngay_tao, 1, 7) AS month, COUNT(*) AS orders, COALESCE(SUM(tong_tien), 0) AS revenue FROM DatXe WHERE trang_thai != 'DaHuy' GROUP BY substr(ngay_tao, 1, 7) ORDER BY month DESC LIMIT 6").all().reverse();
  return { fleet: count("SELECT COUNT(*) AS count FROM Xe"), available: count("SELECT COUNT(*) AS count FROM Xe WHERE trang_thai = 'SanSang'"), active: count("SELECT COUNT(*) AS count FROM DatXe WHERE trang_thai = 'DangThue'"), orders: count("SELECT COUNT(*) AS count FROM DatXe"), pending: count("SELECT COUNT(*) AS count FROM DatXe WHERE trang_thai = 'ChoXacNhan'"), completed: count("SELECT COUNT(*) AS count FROM DatXe WHERE trang_thai = 'HoanThanh'"), cancelled: count("SELECT COUNT(*) AS count FROM DatXe WHERE trang_thai = 'DaHuy'"), revenue, monthly };
}

function clearLegacyStorage() { return ["autoProFleet", "autoProBookings", "autoProUsers", "autoProManagerDemo"]; }

module.exports = { databasePath, listFleet, createFleet, updateFleet, deleteFleet, listBookings, createBookings, updateBookingStatus, createPayment, login, register, changePassword, dashboard, clearLegacyStorage };
