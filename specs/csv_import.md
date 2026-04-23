# Đặc Tả: Nhập CSV & Đồng Bộ Hàng Loạt Sinh Viên

**ID Tài Liệu:** SPEC-CSV-001-VI  
**Phiên Bản:** 1.0  
**Cập Nhật Lần Cuối:** 22 Tháng 4, 2026  
**Trạng Thái:** Được phê duyệt cho Phát Triển

---

## 1. Tổng Quan

Đặc tả này xác định quy trình nhập CSV tự động để tải lên hàng loạt dữ liệu sinh viên. Những người tổ chức chuẩn bị tệp CSV (danh sách sinh viên) và tải lên thông qua cổng quản trị. Một công việc theo lịch biểu xử lý tệp hàng đêm, xác thực từng bản ghi, phát hiện bản sao, và upsert vào cơ sở dữ liệu.

### Tính Năng Chính

- ✅ Công việc theo lịch biểu nền (Hangfire)
- ✅ Giao dịch nguyên tử (tất cả hoặc không)
- ✅ Phát hiện xung đột (sinh viên trùng)
- ✅ Báo cáo lỗi toàn diện
- ✅ Xử lý idempotent (có thể thử lại an toàn)
- ✅ Thông báo email cho người tải lên

---

## 2. Định Dạng Tệp CSV

### 2.1 Cấu Trúc Dự Kiến

```csv
student_id,full_name,email,phone,workshop_id,workshop_title,notes
STUDENT001,Nguyễn Văn A,nva@unihub.edu.vn,+84912345678,1,AI Basics,
STUDENT002,Trần Thị B,ttb@unihub.edu.vn,+84912345679,1,AI Basics,Sinh viên trao đổi
STUDENT003,Lê Văn C,lvc@unihub.edu.vn,+84912345680,2,Web Development,
```

### 2.2 Thông Số Trường

| Trường | Loại | Bắt Buộc | Xác Thực | Ví Dụ |
|-------|------|----------|---------|--------|
| **student_id** | Text (PK) | Có | Duy nhất/sinh viên | STUDENT001 |
| **full_name** | Text | Có | 2-100 ký tự | Nguyễn Văn A |
| **email** | Text | Có | Định dạng email hợp lệ | nva@unihub.edu.vn |
| **phone** | Text | Không | Bắt đầu +84 hoặc trống | +84912345678 |
| **workshop_id** | Integer | Có | Tồn tại trong bảng Workshop | 1 |
| **workshop_title** | Text | Không | Để tham khảo | AI Basics |
| **notes** | Text | Không | Tối đa 500 ký tự | Sinh viên trao đổi |

---

## 3. Quy Trình Chính (Kịch Bản Thành Công)

### 3.1 Tải Lên CSV

```
NGƯỜI TỔ CHỨC         CỔNG QUẢN TRỊ         HỆ THỐNG
      │                    │                   │
      │ 1. Chọn file CSV   │                   │
      ├───────────────────>│                   │
      │                   │ 2. Kiểm tra:       │
      │                   │    - Kích thước    │
      │                   │    - Max 10 MB    │
      │                   │    ✓ Pass: 2.3 MB│
      │                   │                   │
      │                   │ 3. Lưu vào đĩa    │
      │                   ├──────────────────>│
      │                   │ File: student.csv│
      │                   │<──────────────────┤
      │                   │                   │
      │                   │ 4. INSERT         │
      │                   │    CsvImport      │
      │                   │    {status: PEND} │
      │                   ├──────────────────>│
      │                   │<──────────────────┤
      │                   │                   │
      │ ✓ Upload được     │ 5. Phản hồi 202   │
      │   lên lịch hôm     │ {job_id: 1234,    │
      │   nay lúc 2 AM    │  status: PENDING} │
      │<───────────────────┤                   │
      │                   │                   │
      │    [Thời gian:    │                   │
      │     2:00 AM]      │ 6. Hangfire:      │
      │                   │    Bắt đầu job    │
```

### 3.2 Hangfire Xử Lý CSV

```
HANGFIRE JOB          CƠSỞ DỮ LIỆU        ĐÃ GỬIEMAIL
     │                   │                  │
     │ 1. Đọc file       │                  │
     │    CSV            │                  │
     ├──────────────────>│                  │
     │ 50 hàng           │                  │
     │<──────────────────┤                  │
     │                   │                  │
     │ 2. Xác thực mỗi   │                  │
     │    hàng:          │                  │
     │    - Email hợp lệ │                  │
     │    - Workshop tồn│                  │
     │    - ID hợp lệ    │                  │
     │                   │                  │
     │ 3. BEGIN TRANS    │                  │
     ├──────────────────>│                  │
     │                   │ BEGIN             │
     │<──────────────────┤                  │
     │                   │                  │
     │ 4. UPSERT mỗi     │                  │
     │    hàng:          │                  │
     │                   │                  │
     │    Hàng 1:        │                  │
     │    SELECT * FROM  │                  │
     │    User WHERE ... │                  │
     │    ├──────────────────────────────>│
     │    │ NOT FOUND     │                  │
     │    │ INSERT User   │                  │
     │    │ INSERT Reg    │                  │
     │                   │                  │
     │    Hàng 2:        │                  │
     │    SELECT * FROM  │                  │
     │    User WHERE ... │                  │
     │    ├──────────────────────────────>│
     │    │ FOUND         │                  │
     │    │ UPDATE User   │                  │
     │    │ (nếu khác)    │                  │
     │                   │                  │
     │ 5. COMMIT TRANS   │                  │
     ├──────────────────>│                  │
     │                   │ COMMIT            │
     │<──────────────────┤                  │
     │                   │                  │
     │ 6. Ghi nhật ký    │                  │
     │    - Tổng: 50     │                  │
     │    - Mới: 45      │                  │
     │    - Cập nhật: 5  │                  │
     │    - Lỗi: 0       │                  │
     │                   │                  │
     │ 7. UPDATE status  │                  │
     │    = COMPLETED    │                  │
     ├──────────────────>│                  │
     │<──────────────────┤                  │
     │                   │                  │
     │ 8. Gửi email      │                  │
     │    báo cáo        │                  │
     ├──────────────────────────────────────>│
     │                   │                  │
     │                   │                  │ Để: organizer@...
     │                   │                  │ Chủ đề: Báo cáo
     │                   │                  │ nhập CSV - Job #1234
     │                   │                  │
     │                   │                  │ Nội dung:
     │                   │                  │ Tổng: 50
     │                   │                  │ Thành công: 50
     │                   │                  │ Lỗi: 0
```

---

## 4. Kịch Bản Lỗi

### 4.1 Email Không Hợp Lệ

```
Hàng CSV:
STUDENT001,Nguyễn Văn A,invalid-email,...

Xử lý:
  ├─ Xác thực email: invalid-email
  │  Regex: ^[A-Za-z0-9._%+-]+@...
  │  ✗ KHÔNG hợp lệ
  │
  └─ Hành động:
     - Đánh dấu hàng FAILED
     - Ghi nhật ký lỗi
     - KHÔNG insert
     - Tiếp tục hàng khác

Kết Quả:
  ✓ 49 hàng insert
  ✗ 1 hàng thất bại
  Email báo cáo: "49 thành công, 1 thất bại"
```

### 4.2 Workshop Không Tìm Thấy

```
Hàng CSV:
STUDENT002,Trần Thị B,...,999,Fake Workshop,

Xử lý:
  SELECT id FROM Workshop
  WHERE id = 999
  ✗ NOT FOUND
  
  Hàng FAILED
  Lỗi: "Workshop not found: 999"

Khuyến Nghị:
  - Kiểm tra Workshop IDs
  - Email nên liệt kê tất cả workshop
```

### 4.3 Sinh Viên Trùng Lặp

```
Hàng 1: STUDENT003, Lê Văn C, ..., workshop 1
Hàng 2: STUDENT003, Lê Văn C, ..., workshop 1 (DUP)

Xử Lý:
  Hàng 1:
    SELECT * FROM Registration
    WHERE student_id = 3 AND workshop_id = 1
    NOT FOUND
    ✓ INSERT
  
  Hàng 2:
    SELECT * FROM Registration
    WHERE student_id = 3 AND workshop_id = 1
    FOUND (từ hàng 1)
    ⊘ SKIP (bản sao)

Kết Quả:
  ✓ Hàng 1: inserted
  ⊘ Hàng 2: skipped
  Báo cáo: "1 thành công, 1 bản sao"
```

### 4.4 Lỗi Giao Dịch DB (Rollback)

```
Xử Lý 50 bản ghi, tất cả hợp lệ:
  ├─ Hàng 1-49: Insert thành công
  ├─ Hàng 50: ✗ LỖI
  │  Lý do: Unique constraint violation
  │  (Email trùng)
  │
  └─ Cơ sở dữ liệu ROLLBACK tất cả 50 hàng

Kết Quả:
  ✗ Nhập thất bại
  Status: FAILED
  Lý do: "Constraint violation at row 50"
  
  Email: "Nhập thất bại. Không có bản ghi nào được insert.
         Lỗi: Email trùng tại hàng 50.
         Vui lòng kiểm tra CSV và thử lại."
```

---

## 5. Ràng Buộc & Yêu Cầu

### 5.1 Ràng Buộc Tính Nhất Quán

- ✓ **Nguyên tử tất cả hoặc không:** BEGIN TX → COMMIT/ROLLBACK
- ✓ **Không đăng ký trùng:** Kiểm tra (student_id, workshop_id) unique
- ✓ **User tồn tại trước Reg:** FK constraint
- ✓ **Workshop tồn tại:** Xác thực trước insert
- ✓ **Email duy nhất:** UNIQUE constraint

### 5.2 Ràng Buộc Hiệu Suất

| Chỉ Số | Mục Tiêu | SLA |
|--------|----------|-----|
| Phân tích CSV | < 2s/1000 hàng | Mỗi 1000 hàng |
| Xác thực | < 1s/1000 hàng | Mỗi 1000 hàng |
| Insert DB | < 5s/1000 hàng | Mỗi 1000 hàng |
| Tổng xử lý | < 10s/1000 hàng | Mỗi 1000 hàng |
| Hoàn thành job | < 5 phút | Cho 50.000 bản ghi |
| Email thông báo | < 5 phút | Sau job hoàn thành |

### 5.3 Ràng Buộc Tệp

| Ràng Buộc | Giới Hạn | Lý Do |
|-----------|----------|--------|
| Kích thước tệp | Max 10 MB | Tránh cạn kiệt bộ nhớ |
| Số hàng | Max 50.000 | Hiệu suất DB |
| Số cột | 7 cột | Lược đồ cố định |
| Mã hóa | UTF-8 | Hỗ trợ tiếng Việt |

### 5.4 Bảo Mật

- ✓ **Xác thực:** JWT + RBAC
- ✓ **Phép cấp:** Chỉ ORGANIZER/ADMIN
- ✓ **Mã hóa:** AES-256 tại rest
- ✓ **Audit trail:** Ai tải lên, khi nào, kết quả

---

## 6. Tiêu Chí Chấp Nhận

### 6.1 Tiêu Chí Chức Năng

- ✅ **AC1.1:** Người tổ chức có thể tải lên tệp CSV qua cổng quản trị
- ✅ **AC1.2:** Hệ thống xác thực định dạng CSV & kích thước tệp
- ✅ **AC1.3:** Hangfire xử lý tệp tại thời gian theo lịch (2 AM hàng ngày)
- ✅ **AC1.4:** Trình phân tích CSV đọc chính xác tất cả hàng & cột
- ✅ **AC1.5:** Người xác thực kiểm tra: định dạng email, workshop tồn tại, trường bắt buộc
- ✅ **AC1.6:** Hệ thống phát hiện sinh viên trùng đã đăng ký
- ✅ **AC1.7:** Bản ghi hợp lệ được insert vào User & Registration tables
- ✅ **AC1.8:** Bản ghi không hợp lệ bị từ chối với thông báo lỗi chi tiết
- ✅ **AC1.9:** Email báo cáo được gửi cho người tải lên sau khi xử lý
- ✅ **AC1.10:** Giao dịch tất cả hoặc không: nếu lỗi → rollback toàn bộ

### 6.2 Tiêu Chí Hiệu Suất

- ✅ **AC2.1:** Xử lý 1.000 hàng trong < 3 giây
- ✅ **AC2.2:** Xử lý 50.000 hàng trong < 5 phút
- ✅ **AC2.3:** Sử dụng bộ nhớ < 500 MB cho tệp 50.000 hàng
- ✅ **AC2.4:** Pool kết nối DB không cạn kiệt (< 10 kết nối)
- ✅ **AC2.5:** Job hoàn thành thành công 99% thời gian
- ✅ **AC2.6:** Job thất bại được tự động thử lại (3 lần)
- ✅ **AC2.7:** Email thông báo đến trong 5 phút sau job
- ✅ **AC2.8:** Audit trail ghi: ai tải lên, khi nào, số hàng, trạng thái

---

## 7. Hợp Đồng API

### 7.1 Tải Lên Tệp CSV

```http
POST /api/admin/csv/upload HTTP/1.1
Authorization: Bearer <JWT>
Content-Type: multipart/form-data

file: <binary CSV content>

Response 202 Accepted:
{
  "job_id": "1234",
  "status": "PENDING",
  "message": "Tệp CSV được tải lên và lên lịch xử lý.",
  "scheduled_time": "2026-04-23T02:00:00Z",
  "file_size_bytes": 2300,
  "estimated_row_count": 50
}

Response 400 Bad Request:
{
  "error": "FILE_TOO_LARGE",
  "message": "Kích thước tệp vượt quá giới hạn 10 MB"
}
```

### 7.2 Kiểm Tra Trạng Thái Nhập

```http
GET /api/admin/csv/status/1234 HTTP/1.1
Authorization: Bearer <JWT>

Response 200:
{
  "job_id": "1234",
  "status": "COMPLETED",
  "uploaded_at": "2026-04-22T10:30:00Z",
  "processed_at": "2026-04-23T02:05:00Z",
  "results": {
    "total_rows": 50,
    "successful": 48,
    "failed": 2
  },
  "errors": [
    {
      "row": 3,
      "error": "INVALID_EMAIL",
      "detail": "invalid-email"
    }
  ]
}
```

### 7.3 Tải Xuống Báo Cáo

```http
GET /api/admin/csv/report/1234/download HTTP/1.1
Authorization: Bearer <JWT>

Response 200:
Content-Type: text/csv

student_id,full_name,email,status,error_message
STUDENT001,Nguyễn Văn A,nva@unihub.edu.vn,SUCCESS,
STUDENT002,Trần Thị B,ttb@unihub.edu.vn,SUCCESS,
STUDENT003,Lê Văn C,lvc@unihub.edu.vn,FAILED,INVALID_EMAIL
```

---

## 8. Lịch Trình & Sạch Dữ Liệu

### 8.1 Lịch Trình Hangfire

```
Lịch trình: Hàng ngày lúc 2:00 AM (Múi giờ Việt Nam)
Job ID: csv-import-daily
Xử lý: Tất cả CSV có status = PENDING

Nếu job thất bại:
  - Hangfire retry tự động (3 lần, lùi lại)
  - Nếu thất bại 3 lần → Alert admin
```

### 8.2 Làm Sạch Tệp

```
Chính Sách Lưu Giữ:
  - Giữ tệp CSV 30 ngày sau khi xử lý
  - Xóa nội dung tệp (giữ metadata để kiểm toán)
  - Sao lưu quan trọng lên S3 (tuân thủ)

Làm Sạch Tự Động:
  - Hangfire job: Hàng ngày 3:00 AM
  - Xóa tệp CSV > 30 ngày
  - Giữ CsvImport metadata trong DB (audit trail)
```

---

## 9. Tiêu Chí Kiểm Tra

### Test Case 1: Kịch Bản Hạnh Phúc

```
Cho: CSV hợp lệ 50 sinh viên duy nhất
Khi: Job xử lý tệp 2 AM
Sau:
  ✓ 50 User records insert
  ✓ 50 Registration records tạo
  ✓ Email báo cáo: "50 thành công"
  ✓ Status = COMPLETED
```

### Test Case 2: Phát Hiện Bản Sao

```
Cho: CSV 10 hàng, 5 sinh viên đã đăng ký
Khi: Job xử lý
Sau:
  ✓ 5 User mới insert
  ✓ 5 bản sao phát hiện (skip, không insert lại)
  ✓ Email: "5 thành công, 5 bản sao"
```

### Test Case 3: Lỗi Xác Thực

```
Cho: CSV 10 hàng:
  - Hàng 3: Email không hợp lệ
  - Hàng 7: Workshop ID 999 (không tồn tại)
Khi: Job xử lý
Sau:
  ✓ 8 hàng hợp lệ insert
  ✓ 2 hàng không hợp lệ skip
  ✓ Email: "8 thành công, 2 lỗi"
  ✓ Chi tiết lỗi được liệt kê
```

### Test Case 4: Lỗi DB (Khôi Phục)

```
Cho: CSV 50 hàng, timeout DB tại hàng 25
Khi: Job gặp lỗi
Sau:
  ✓ Transaction ROLLBACK (không insert)
  ✓ Status = FAILED
  ✓ Hangfire retry (sau 60s)
  ✓ Retry #2: Thành công
  ✓ Email: "Thử lại 1 lần, hoàn thành thành công"
```

### Test Case 5: Hiệu Suất Tệp Lớn

```
Cho: CSV 50.000 sinh viên
Khi: Job xử lý
Sau:
  ✓ Hoàn thành < 5 phút
  ✓ Sử dụng bộ nhớ < 500 MB
  ✓ DB hiệu suất: P99 query < 100ms
  ✓ Tất cả 50.000 insert chính xác
```

---

## 10. Danh Sách Kiểm Tra Tóm Tắt

- ✅ Nhập hàng ngày (2 AM theo lịch)
- ✅ Giao dịch nguyên tử (tất cả hoặc không)
- ✅ Xác thực toàn diện (email, workshop, trường bắt buộc)
- ✅ Phát hiện bản sao & xử lý
- ✅ Báo cáo lỗi chi tiết
- ✅ Thông báo email cho người tải lên
- ✅ Retry tự động (3 lần, lùi lại)
- ✅ Audit trail (ai tải lên, khi nào, kết quả)
- ✅ Tối ưu hiệu suất (50K hàng < 5 phút)
- ✅ Xử lý lỗi sẵn sàng cho production
