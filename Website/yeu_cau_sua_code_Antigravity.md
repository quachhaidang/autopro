# YÊU CẦU SỬA CODE – ĐỀ TÀI QUẢN LÝ THUÊ XE Ô TÔ TỰ LÁI

> Nguồn yêu cầu: PDF đề tài quản lý thuê xe ô tô tự lái, trang 29–30.  
> **Nguyên tắc bắt buộc:** Chỉ triển khai những yêu cầu có trong tài liệu nguồn. Không tự bịa, tự thêm chức năng, trường dữ liệu, quy tắc nghiệp vụ hoặc giả định không được đề cập.

## 1. Mục tiêu

Đọc và kiểm tra code hiện tại của dự án, sau đó sửa giao diện và xử lý nghiệp vụ để đáp ứng đúng 4 yêu cầu trong tài liệu:

1. Lập danh sách xe cho thuê (BM1, QĐ1).
2. Lập phiếu thuê xe (BM2, QĐ2).
3. Tra cứu xe (BM3).
4. Lập phiếu thanh toán (BM4, QĐ4).

Chỉ sửa những phần liên quan để đáp ứng các yêu cầu trên. Không tự ý tạo thêm các module/chức năng khác.

## 2. Yêu cầu 1 – Lập danh sách xe cho thuê (BM1)

### 2.1 Các trường thông tin theo biểu mẫu BM1

Biểu mẫu lập danh sách xe cho thuê gồm:

- Tên xe
- Loại xe
- Hãng
- Năm sản xuất
- Chủ xe
- Yêu cầu bằng lái
- Đơn giá ngày

Giữ đúng các trường này. Không tự thêm trường nghiệp vụ vào biểu mẫu nếu tài liệu không yêu cầu.

### 2.2 Quy định QĐ1

- Có đúng 5 loại xe được liệt kê:
  - Xe tải
  - Xe máy
  - Xe 5 chỗ
  - Xe 7 chỗ
  - Xe khách
- Có 4 hãng xe. Tài liệu không ghi tên cụ thể của 4 hãng, vì vậy **không tự đặt tên hãng hoặc tự giới hạn hãng bằng danh sách giả định**. Nếu code cần danh sách hãng cụ thể, hãy hỏi người dùng.
- Năm sản xuất xe phải từ năm 2005 trở đi mới được nhập.
- Yêu cầu bằng lái có 10 loại:
  - A1
  - A2
  - A3
  - A4
  - B1
  - B2
  - C
  - D
  - E
  - F

### 2.3 Kiểm tra

- Kiểm tra năm sản xuất: không chấp nhận năm trước 2005.
- Loại xe phải thuộc 5 loại được quy định.
- Yêu cầu bằng lái phải thuộc 10 loại được liệt kê.
- Không tự tạo thêm điều kiện kiểm tra khác nếu không được quy định trong tài liệu.

## 3. Yêu cầu 2 – Lập phiếu thuê xe (BM2)

### 3.1 Các trường thông tin theo biểu mẫu BM2

Phiếu cho thuê gồm:

- Ngày cho thuê
- Khách hàng
- CMND
- SĐT
- Bằng lái
- Danh sách xe thuê với các cột:
  - STT
  - Tên xe
  - Số ngày
  - Loại xe
  - Đơn giá
  - Ghi chú

Giữ đúng các trường và cột có trong biểu mẫu nguồn.

### 3.2 Quy định QĐ2

- Khách hàng mới chỉ được thuê 1 xe.
- Khách hàng quen được thuê từ 2 đến 4 xe.
- Số ngày thuê xe máy phải dưới 10 ngày.
- Số ngày thuê ô tô phải dưới 7 ngày và lớn hơn 1 ngày.
- Bằng lái phải đảm bảo phù hợp.

### 3.3 Kiểm tra điều kiện thuê

- Xác định khách hàng mới hay khách hàng quen dựa trên thông tin/logic hiện có trong dự án.
- Khách hàng mới: chỉ được thuê 1 xe.
- Khách hàng quen: số xe thuê từ 2 đến 4.
- Xe máy: số ngày thuê dưới 10.
- Ô tô: số ngày thuê lớn hơn 1 và dưới 7 ngày.
- Kiểm tra bằng lái phải đảm bảo.

**Lưu ý:** Tài liệu không giải thích cách xác định chính xác “bằng lái phải đảm bảo” theo từng loại xe. Không tự suy diễn ma trận bằng lái–loại xe. Nếu hệ thống chưa có quy tắc này, hỏi người dùng trước khi lập quy tắc mới.

Tài liệu cũng không nói rõ các trường hợp khách hàng quen thuê 1 xe, khách hàng mới thuê nhiều xe, hay cách xử lý các trường hợp không nằm trong điều kiện đã ghi. Không tự tạo ngoại lệ hoặc quy định bổ sung.

## 4. Yêu cầu 3 – Tra cứu xe (BM3)

### 4.1 Các cột theo biểu mẫu BM3

Danh sách xe cho thuê có các cột:

- STT
- Tên xe
- Đơn giá ngày
- Loại xe
- Hãng xe
- Bằng lái tối thiểu

### 4.2 Yêu cầu thực hiện

- Chức năng tra cứu/hiển thị danh sách xe phải thể hiện các cột theo BM3.
- Không tự thêm tiêu chí lọc, chức năng tìm kiếm nâng cao hoặc cột dữ liệu khác nếu không có trong yêu cầu nguồn.
- Có thể tái sử dụng dữ liệu xe hiện có của phần BM1 nếu code đã có cấu trúc phù hợp; không tạo dữ liệu xe giả để thay thế dữ liệu dự án.

## 5. Yêu cầu 4 – Lập phiếu thanh toán (BM4)

### 5.1 Các trường thông tin theo biểu mẫu BM4

Phiếu thanh toán tiền thuê xe gồm:

- Khách hàng
- CMND
- Phí bảo dưỡng
- Tổng tiền

Giữ đúng các trường của biểu mẫu. Không tự thêm khoản phí hoặc trường tính tiền khác.

### 5.2 Quy định QĐ4 – Phí bảo dưỡng và chiết khấu

- Khách thuê vào các ngày **14/2, 30/4, 22/12 hoặc 1/5** thì không phải trả phí bảo dưỡng.
- Ngày thường, phí bảo dưỡng bằng **5% đơn giá ngày của xe đó**.
- Khách hàng thuê xe từ lần thứ 2 trở đi:
  - Được chiết khấu **5% tổng tiền thuê xe**.
  - Không phải trả phí bảo dưỡng.

### 5.3 Cách áp dụng quy định

- Nếu ngày thuê thuộc một trong các ngày miễn phí bảo dưỡng nêu trên, phí bảo dưỡng bằng 0.
- Nếu là ngày thường và khách không thuộc trường hợp thuê từ lần thứ 2 trở đi, phí bảo dưỡng áp dụng 5% đơn giá ngày của xe đó.
- Nếu khách hàng thuê từ lần thứ 2 trở đi, áp dụng chiết khấu 5% tổng tiền thuê xe và miễn phí bảo dưỡng.
- Tài liệu không chỉ rõ công thức chi tiết của “tổng tiền thuê xe” khi thuê nhiều xe, cách cộng tiền thuê, hay thứ tự làm tròn. Kiểm tra cách tính hiện có trong code; nếu chưa có thì hỏi người dùng, không tự đặt công thức ngoài nội dung tài liệu.

## 6. Danh sách chức năng và biểu mẫu phải đối chiếu

| STT | Tên yêu cầu | Biểu mẫu | Quy định |
|---|---|---|---|
| 1 | Lập danh sách xe cho thuê | BM1 | QĐ1 |
| 2 | Lập phiếu thuê xe | BM2 | QĐ2 |
| 3 | Tra cứu xe | BM3 | Không ghi quy định riêng |
| 4 | Lập phiếu thanh toán | BM4 | QĐ4 |

## 7. Hướng dẫn Antigravity khi sửa dự án

1. Trước tiên, đọc cấu trúc dự án và các file code hiện có.
2. Xác định các màn hình, form, model, database, chức năng đã có liên quan đến 4 yêu cầu.
3. Đối chiếu code hiện tại với BM1, QĐ1, BM2, QĐ2, BM3, BM4, QĐ4.
4. Chỉ sửa các phần thiếu, sai hoặc chưa đáp ứng yêu cầu nguồn.
5. Tận dụng cấu trúc, dữ liệu, component và logic đang có nếu phù hợp; không tạo bản thay thế trùng lặp.
6. Không tự đổi công nghệ, framework, cấu trúc dự án hoặc cơ sở dữ liệu.
7. Không tự thêm tính năng ngoài 4 yêu cầu trên.
8. Không tạo dữ liệu mẫu giả, tên hãng xe giả, quy định bằng lái giả hoặc điều kiện nghiệp vụ chưa có căn cứ.
9. Nếu gặp yêu cầu chưa rõ, dừng ở phần đó và đặt câu hỏi cụ thể cho người dùng trước khi tiếp tục.
10. Sau khi sửa, chạy kiểm tra phù hợp với môi trường dự án hiện tại; không tuyên bố đã kiểm thử nếu chưa thực sự chạy.

## 8. Những điều tuyệt đối không được tự ý thêm hoặc suy đoán

- Không thêm chức năng ngoài 4 yêu cầu đã nêu.
- Không tự tạo tên 4 hãng xe vì tài liệu không nêu tên.
- Không tự xây dựng bảng quy đổi bằng lái theo loại xe vì tài liệu chỉ nêu yêu cầu “bằng lái phải đảm bảo”.
- Không tự suy diễn công thức tính tổng tiền thuê xe, cách làm tròn hoặc các loại phụ phí khác.
- Không tự thay đổi số lượng loại xe hoặc loại bằng lái.
- Không tự sửa quy định số ngày thuê.
- Không tự bổ sung phí bảo dưỡng, thuế, phí dịch vụ, tiền cọc, tiền phạt, bảo hiểm hoặc phụ phí không có trong PDF.
- Không tự thêm đăng nhập, phân quyền, báo cáo, dashboard, thống kê, xuất Excel/PDF, thông báo hoặc chức năng khác nếu chúng không thuộc yêu cầu cần sửa và người dùng chưa yêu cầu.
- Không xóa chức năng hiện có không liên quan một cách tùy tiện. Nếu cần thay đổi có thể ảnh hưởng chức năng khác, phải giải thích và xin xác nhận.

## 9. Báo cáo sau khi hoàn thành

Sau khi sửa code, hãy báo cáo ngắn gọn:

- Những file đã thay đổi.
- Nội dung đã sửa theo từng yêu cầu BM1/QĐ1, BM2/QĐ2, BM3, BM4/QĐ4.
- Các điều kiện đã triển khai.
- Những yêu cầu chưa thể thực hiện do tài liệu thiếu thông tin.
- Kết quả kiểm tra/chạy dự án và lỗi còn lại (nếu có).

**Chỉ xác nhận hoàn thành những phần đã thực sự sửa và kiểm tra.**

---

## 10. Checklist đối chiếu theo tài liệu nguồn

- [ ] BM1 có đủ Tên xe, Loại xe, Hãng, Năm sản xuất, Chủ xe, Yêu cầu bằng lái, Đơn giá ngày.
- [ ] QĐ1 có đúng 5 loại xe.
- [ ] QĐ1 năm sản xuất từ 2005 trở đi.
- [ ] QĐ1 có đủ 10 loại bằng lái.
- [ ] BM2 có đủ thông tin phiếu thuê và các cột xe thuê.
- [ ] QĐ2 khách mới thuê tối đa 1 xe.
- [ ] QĐ2 khách quen thuê 2–4 xe.
- [ ] QĐ2 xe máy thuê dưới 10 ngày.
- [ ] QĐ2 ô tô thuê hơn 1 ngày và dưới 7 ngày.
- [ ] QĐ2 kiểm tra bằng lái, không tự suy diễn quy tắc.
- [ ] BM3 có đủ 6 cột theo tài liệu.
- [ ] BM4 có Khách hàng, CMND, Phí bảo dưỡng, Tổng tiền.
- [ ] QĐ4 miễn phí bảo dưỡng đúng 4 ngày được ghi.
- [ ] QĐ4 ngày thường phí bảo dưỡng 5% đơn giá ngày của xe.
- [ ] QĐ4 khách thuê từ lần thứ 2 được giảm 5% tổng tiền thuê và miễn bảo dưỡng.
- [ ] Không có nghiệp vụ/tính năng tự thêm ngoài tài liệu.
