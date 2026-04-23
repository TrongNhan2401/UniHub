# UniHub Workshop - Đề Xuất Hệ Thống

**Phiên Bản:** 1.0  
**Ngày:** 22 Tháng 4, 2026  
**Trạng Thái:** Được phê duyệt cho Giai Đoạn Thiết Kế

---

## 1. Phân Tích Vấn Đề

### Google Form Thất Bại Khi Quy Mô Tăng Lớn

| Vấn Đề                                | Tác Động                                           | Số Liệu                             |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------- |
| **Độ trễ form**                       | Thời gian phản hồi > 3 giây tại thời điểm cao điểm | 12.000 người dùng trong 10 phút     |
| **Không có tính sẵn có slot thực tế** | Sinh viên đăng ký workshop đã đầy                  | 40% đăng ký bị lãng phí             |
| **Check-in thủ công (giấy/email)**    | Mất hàng đăng ký, check-in trùng lặp               | 15% lỗi check-in                    |
| **Không tích hợp thanh toán**         | Workshop có phí cần xác thực thủ công              | 2-3 giờ công việc admin/ngày        |
| **Không xử lý yêu cầu đồng thời**     | Race condition: tăng vượt slot 20-30%              | Vượt quá dung lượng workshop        |
| **Không có khả năng offline**         | Nhân viên không thể check-in khi không có internet | Sự kiện bị dừng lại khi mất kết nối |
| **Không có phân tích dữ liệu**        | Không có hiểu biết sâu về nhu cầu workshop         | Không thể tối ưu hóa lập kế hoạch   |

### Kịch Bản Thực Tế

Giả sử workshop "Phát Triển Mobile" có 50 slot:

- Thứ Hai 9:00: 200 đăng ký trong 5 phút
- Hệ thống chấp nhận tất cả 200 (race condition)
- Chỉ 50 sinh viên có thể tham dự → xung đột & nản lòng
- Nhân viên check-in: phải đối chiếu thủ công với danh sách email

**Tác Động Kinh Doanh:**

- Độ hài lòng sinh viên: -40%
- Công việc thêm cho admin: +5 giờ/ngày
- Không thể mở rộng quy mô cho 10.000+ sinh viên

---

## 2. Giải Pháp Đề Xuất: Nền Tảng UniHub Workshop

### Mục Tiêu Chiến Lược

| Mục Tiêu                   | Chỉ Tiêu                                     | Chỉ Số Thành Công                       |
| -------------------------- | -------------------------------------------- | --------------------------------------- |
| **Đăng ký thời gian thực** | < 500ms thời gian phản hồi tại 12K đồng thời | P99 latency                             |
| **Ngăn chặn tăng vượt**    | 0 sự cố tăng vượt                            | Các bài kiểm tra race condition         |
| **Kiểm tra offline**       | Hoạt động không có internet                  | Đồng bộ trong 2 phút khi kết nối        |
| **Giảm công việc admin**   | Nhập CSV tự động mỗi đêm                     | -3 giờ/ngày công việc thủ công          |
| **Hỗ trợ thanh toán**      | Workshop miễn phí + có phí                   | Logic retry và xử lý timeout            |
| **Phân tích sẵn sàng**     | Theo dõi nhu cầu, tỷ lệ vắng mặt             | Bảng điều khiển cho những người tổ chức |
| **Hỗ trợ quy mô**          | Xử lý 12.000 đăng ký/10 phút                 | Kiểm tra tải green                      |

### Chỉ Số Chính

```
Người Dùng Đồng Thời:           12.000 (pik)
Tỷ Lệ Đăng Ký:                  1.200 đăng ký/phút (duy trì)
Dung Lượng Workshop:            50-300 slot
Workshop Hàng Ngày:             8-12 song song
Kéo Dài Sự Kiện:                5 ngày
Thiết Bị Check-in:              50-100 di động/máy tính bảng
Uptime Mục Tiêu:                99,9%
RTO (Khôi Phục):                < 15 phút
RPO (Dữ Liệu):                  < 5 phút
```

---

## 3. Người Dùng & Persona

### 3.1 Sinh Viên (Người Dùng Cuối)

- **Mục Tiêu:** Tìm workshop thú vị, đăng ký dễ dàng, xác nhận ngay lập tức
- **Quy Trình:**
  1. Duyệt danh mục workshop (lọc theo ngày/giờ)
  2. Xem tính sẵn có slot thời gian thực
  3. Đăng ký (miễn phí hoặc thanh toán)
  4. Nhận mã QR qua email/trong ứng dụng
  5. Check-in tại sự kiện
  6. Xem chứng chỉ

### 3.2 Người Tổ Chức (Admin Workshop)

- **Mục Tiêu:** Quản lý workshop, xem thống kê đăng ký, theo dõi check-in
- **Quy Trình:**
  1. Tạo workshop (hàng loạt hoặc nhập CSV)
  2. Đặt dung lượng, giá cả, lịch biểu
  3. Xem đăng ký thời gian thực
  4. Tạo danh sách người tham dự
  5. Xuất báo cáo tham dự
  6. Gửi thông báo hàng loạt

### 3.3 Nhân Viên Check-in (Tại Hiện Trường)

- **Mục Tiêu:** Quét QR, đánh dấu tham dự, hoạt động offline
- **Quy Trình:**
  1. Đăng nhập bằng ứng dụng di động (trực tuyến)
  2. Đồng bộ danh sách workshop + sinh viên đã đăng ký
  3. Quét mã QR của người tham dự
  4. Đánh dấu có mặt (thêm dấu thời gian)
  5. Chuyển sang chế độ offline (không có internet)
  6. Tiếp tục quét
  7. Tự động đồng bộ khi kết nối được phục hồi

---

## 4. Phạm Vi Và Không Phạm Vi

### TRONG PHẠM VI

**Giai Đoạn 1 (MVP):**

- ✅ Cổng đăng ký sinh viên (web + responsive di động)
- ✅ Hiển thị tính sẵn có workshop thời gian thực
- ✅ Tạo và phân phối mã QR
- ✅ Xử lý thanh toán (Stripe/PayOS)
- ✅ Thông báo email
- ✅ Check-in cơ bản (chế độ trực tuyến)
- ✅ Bảng điều khiển admin (RBAC)
- ✅ Nhập CSV (những người tổ chức tải lên danh sách sinh viên)

**Giai Đoạn 2 (Sau Khởi Động):**

- ✅ Check-in offline (ứng dụng di động với đồng bộ cục bộ)
- ✅ Thông báo Telegram
- ✅ Tạo PDF chứng chỉ + tóm tắt AI
- ✅ Phân tích nâng cao (bản đồ nhiệt, dự báo nhu cầu)
- ✅ Ứng dụng di động (native hoặc PWA)

### KHÔNG TRONG PHẠM VI

❌ Khuyến nghị workshop dựa trên ML  
❌ Ghi hình/phát trực tiếp workshop  
❌ Các tính năng xã hội (follow, chia sẻ)  
❌ Tích hợp bên thứ ba (Zoom, Teams)  
❌ Hỗ trợ đa ngôn ngữ (Giai Đoạn 2)  
❌ Chứng chỉ Blockchain/NFT

---

## 5. Đánh Giá Rủi Ro Kỹ Thuật

### Các Mục Có Rủi Ro Cao

| Rủi Ro                               | Xác Suất   | Tác Động   | Giảm Thiểu                               |
| ------------------------------------ | ---------- | ---------- | ---------------------------------------- |
| **Race condition (tăng vượt)**       | CAO        | KHẨN CẤP   | Cập nhật DB nguyên tử + Redis lock       |
| **Timeout thanh toán tải cao**       | CAO        | CAO        | Khóa idempotency + circuit breaker Polly |
| **Cạn kiệt kết nối DB**              | TRUNG BÌNH | CAO        | Connection pooling + async queue         |
| **Thiết bị check-in staff offline**  | CAO        | TRUNG BÌNH | SQLite cục bộ + sync queue               |
| **Hỏng dữ liệu nhập CSV**            | TRUNG BÌNH | CAO        | Xác thực + rollback giao dịch            |
| **Xung đột mã QR**                   | THẤP       | TRUNG BÌNH | UUID + hash mật mã                       |
| **Lỗi gửi email**                    | TRUNG BÌNH | TRUNG BÌNH | Retry queue + fallback Telegram          |
| **Race condition vô hiệu hóa cache** | TRUNG BÌNH | TRUNG BÌNH | TTL-based + xóa dựa trên sự kiện         |

---

## 6. Tiêu Chí Thành Công

### Sẵn Sàng Go-Live

- ✅ Kiểm tra tải: 12.000 người dùng đồng thời
- ✅ 0 race condition (kiểm tra đăng ký đã qua)
- ✅ Tỷ lệ lỗi thanh toán < 0,1%
- ✅ Tỷ lệ gửi email thành công > 99%
- ✅ Thời gian phản hồi API P99 < 500ms
- ✅ Phê duyệt từ 3 bên liên quan
- ✅ Ký kết UAT từ sinh viên

### Giám Sát Sau Khởi Động (2 Tuần Đầu)

- 📊 Theo dõi tỷ lệ đăng ký (mục tiêu: 500+ đăng ký/giờ)
- 📊 Giám sát tỷ lệ lỗi API (mục tiêu: < 0,5%)
- 📊 Kiểm tra tỷ lệ thành công check-in (mục tiêu: > 98%)
- 📊 Thu thập phản hồi sinh viên (NPS > 7)
- 📊 Đo thời gian tải trang (di động: < 2s)

---

## 7. Lịch Trình

```
Tuần 1-2:   Backend API + DB schema + Auth
Tuần 3-4:   Frontend + tích hợp thanh toán
Tuần 5:     Modul check-in + nhập CSV
Tuần 6:     Kiểm tra + tối ưu hóa
Tuần 7:     Triển khai staging + UAT
Tuần 8:     Go-live + hỗ trợ
```

---

## Phụ Lục: Các Giả Định

1. **Stack công nghệ** đã được phê duyệt (ASP.NET Core, PostgreSQL, Redis)
2. **Nhà cung cấp thanh toán** (Stripe/PayOS) khả dụng tại khu vực triển khai
3. **Dịch vụ SMS/Email** (Twilio/SendGrid) có sẵn
4. **Cơ sở dữ liệu sinh viên** có thể nhập qua CSV hoặc API
5. **Dữ liệu Workshop** được quản lý bởi những người tổ chức qua bảng điều khiển admin
6. **Không yêu cầu tích hợp hệ thống cũ** cho Giai Đoạn 1
7. **Triển khai một múi giờ** (Múi giờ Chuẩn Việt Nam - UTC+7)
