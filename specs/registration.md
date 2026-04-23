# Đặc Tả: Đăng Ký Workshop Với Thanh Toán

**ID Tài Liệu:** SPEC-REG-001-VI  
**Phiên Bản:** 1.0  
**Cập Nhật Lần Cuối:** 22 Tháng 4, 2026  
**Trạng Thái:** Được phê duyệt cho Phát Triển

---

## 1. Tổng Quan

Đặc tả này xác định quy trình hoàn chỉnh để sinh viên đăng ký workshop, bao gồm các workshop miễn phí và có phí. Hệ thống phải:

- Dự trữ slot một cách nguyên tử (không tăng vượt)
- Xử lý thanh toán
- Tạo mã QR
- Gửi xác nhận
- Xử lý lỗi gracefully
- Ngăn chặn race condition

---

## 2. Quy Trình Chính (Kịch Bản Thành Công)

### 2.1 Workshop Miễn Phí

```
SINH VIÊN                    HỆ THỐNG                       DB
   │                            │                           │
   │ 1. Xem danh sách           │                           │
   │    workshop                │                           │
   ├──────────────────────────>│                           │
   │                            │ 2. Kiểm tra JWT            │
   │                            │ 3. Kiểm tra rate limit     │
   │                            ├──────────────────────────>│
   │                            │ 4. SELECT workshop        │
   │                            │    FOR UPDATE              │
   │                            │    (Khóa)                 │
   │                            │ 5. KIỂM TRA:              │
   │                            │    available_slots > 0?   │
   │                            │    ✓ CÓ: 12 slot          │
   │                            │                           │
   │                            │ 6. UPDATE slot -1          │
   │ ✓ Đăng ký thành công      │ 7. INSERT registration     │
   │ Mã QR: [...]              │ 8. COMMIT                  │
   │                            │                           │
   │ [Async Background]         │ 9. ENQUEUE:                │
   │ - Tạo mã QR                │    - Tạo QR                │
   │ - Gửi email                │    - Gửi email             │
   │                            │                           │
```

**Kết Quả:**
- ✓ Phản hồi 201 < 200ms
- ✓ slot giảm từ 12 → 11
- ✓ Email xác nhận gửi trong 2 giây
- ✓ Mã QR được lưu vào cơ sở dữ liệu

### 2.2 Workshop Có Phí

```
SINH VIÊN                    HỆ THỐNG                       DB
   │                            │                           │
   │ 1. POST /register          │                           │
   │    (với payment_intent)    │                           │
   ├──────────────────────────>│                           │
   │                            │ 2. BEGIN TRANSACTION       │
   │                            │ 3. Dự trữ slot (tạm)      │
   │                            ├──────────────────────────>│
   │                            │ Update slot               │
   │                            │<──────────────────────────┤
   │                            │ 4. INSERT registration    │
   │                            │    status=PENDING         │
   │                            ├──────────────────────────>│
   │                            │<──────────────────────────┤
   │                            │ 5. COMMIT                 │
   │                            │ 6. ENQUEUE async:         │
   │ ✓ Phản hồi 202             │    ProcessPayment(...)    │
   │ "Đang xử lý thanh toán"    │                           │
   │                            │                           │
   │                            │ [Background]              │
   │                            │ 7. Call Stripe API        │
   │                            │    (timeout: 30s)         │
   │ [Poll status]              │ 8. Nếu thành công:        │
   │ GET /register/status       │    UPDATE payment_status  │
   │                            │    = COMPLETED            │
   │ ✓ Payment: COMPLETED       │ 9. Enqueue: Generate QR   │
   │ ✓ QR code included         │                           │
```

**Kết Quả:**
- ✓ Phản hồi 202 < 200ms (không chặn)
- ✓ Xử lý thanh toán async
- ✓ Email với QR gửi sau 2-3 giây
- ✓ Retry tự động nếu timeout

---

## 3. Kịch Bản Lỗi

### 3.1 Race Condition: Workshop Đầy

```
SINH VIÊN A                  SINH VIÊN B
   │                             │
   │ POST /register              │
   ├─────────────────────────────┤
   │                             │ POST /register
   │                             │ (chờ khóa)
   │ BEGIN TX                    │
   │ SELECT FOR UPDATE ✓         │
   │ available_slots = 50 ✓      │
   │                             │
   │ UPDATE available = 49       │
   │                             │
   │ COMMIT ✓                    │
   │ Response 201 OK ✓           │
   │                             │
   │                             │ BEGIN TX
   │                             │ SELECT FOR UPDATE ✓
   │                             │ available_slots = 49
   │                             │ UPDATE available = 48
   │                             │ COMMIT ✓
   │                             │ Response 201 OK ✓

✓ ĐÚNG! Không tăng vượt
```

**Kết Quả:**
- ✓ Không có race condition
- ✓ Chỉ 2 sinh viên được đăng ký
- ✓ Không tăng vượt dung lượng

### 3.2 Timeout Thanh Toán (Retry Logic)

```
Lần 1 (T=0s):
  POST payment provider
  ✗ Timeout: 30 giây
  
  [Hệ thống queue retry]
  Delay: 60 giây

Lần 2 (T=60s):
  POST payment provider
  ✗ Connection refused
  
  [Retry lần 2]
  Delay: 120 giây

Lần 3 (T=180s):
  ✓ Thành công: charge_id = ch_456
  
  Update DB
  payment_status = COMPLETED
  Gửi email xác nhận
```

**Kết Quả:**
- ✓ Tối đa 3 lần thử
- ✓ Lùi lại theo cấp số nhân
- ✓ Cuối cùng thành công

### 3.3 Đăng Ký Trùng (Idempotency Key)

```
Yêu Cầu 1:
  POST /register
  Idempotency-Key: UUID-AAA
  ✓ Thành công: ID 100
  (Email xác nhận gửi nhưng mất trên mạng)

Yêu Cầu 1 (Retry):
  POST /register
  Idempotency-Key: UUID-AAA (GIỐNG NHAU)
  
  Máy chủ kiểm tra Redis:
  "Đã xử lý UUID-AAA" → Trả về response cached
  
  Phản hồi 201 (KHÔNG tạo đăng ký mới)

Kết Quả:
  ✓ Chỉ 1 khoản phí trên thẻ
  ✓ Chỉ 1 mã QR
  ✓ Chỉ 1 email gửi
```

**Lợi Ích:**
- ✓ Ngăn chặn các khoản phí trùng lặp
- ✓ Ngăn chặn đăng ký trùng
- ✓ An toàn cho retry

### 3.4 Thanh Toán Bị Từ Chối

```
Sinh viên đăng ký workshop có phí
Số tiền: 299.000 VND

Xử lý thanh toán:
  POST /charges (Stripe)
  ✗ Phản hồi: 402 Payment Required
  {
    "error": "Thẻ bị từ chối. Không đủ tiền."
  }

Hệ thống:
  1. UPDATE registration
     payment_status = 'FAILED'
  
  2. ROLLBACK slot dự trữ:
     UPDATE workshop
     SET available_slots = available_slots + 1
  
  3. Gửi email cho sinh viên:
     "Thanh toán thất bại. Vui lòng thử thẻ khác."

Kết Quả:
  ✓ Slot trả lại cho workshop
  ✓ Không có đăng ký treo
  ✓ Sinh viên có thể thử lại
```

---

## 4. Ràng Buộc & Yêu Cầu

### 4.1 Ràng Buộc Tính Nhất Quán

- ✓ **Không tăng vượt:** UPDATE nguyên tử với available_slots > 0
- ✓ **Thanh toán trước QR:** payment_status = COMPLETED trước khi gửi QR
- ✓ **Idempotency:** Cùng khóa yêu cầu → Cùng phản hồi
- ✓ **Một đăng ký/sinh viên/workshop:** UNIQUE constraint
- ✓ **Giá nhất quán:** Lưu giá trong bản ghi đăng ký

### 4.2 Ràng Buộc Hiệu Suất

| Chỉ Số | Mục Tiêu | SLA |
|--------|----------|-----|
| Thời gian phản hồi đăng ký | < 200ms | 99% yêu cầu |
| Thời gian truy vấn DB | < 50ms | Query logs |
| Tỷ lệ cache hit | > 90% | Redis stats |
| Tỷ lệ lỗi API | < 0,5% | Metrics ứng dụng |

### 4.3 Ràng Buộc Bảo Mật

- ✓ **Xác thực:** JWT + RBAC
- ✓ **Dữ liệu thanh toán:** PCI DSS compliance
- ✓ **Idempotency key:** UUID cryptographically random
- ✓ **Rate limiting:** 100 req/phút/sinh viên
- ✓ **Audit trail:** Ghi lại tất cả thay đổi

---

## 5. Tiêu Chí Chấp Nhận

### 5.1 Tiêu Chí Chức Năng

- ✅ **AC1.1:** Sinh viên có thể đăng ký workshop miễn phí và nhận phản hồi 201 < 200ms
- ✅ **AC1.2:** Sinh viên có thể đăng ký workshop có phí và nhận phản hồi 202 với URL polling
- ✅ **AC1.3:** Mã QR được tạo và gửi email trong 2 phút
- ✅ **AC1.4:** Không có 2 sinh viên đăng ký cho cùng 1 slot (0 sự cố race condition)
- ✅ **AC1.5:** Retry thanh toán thành công sau timeout (3 lần, lùi lại)
- ✅ **AC1.6:** Yêu cầu trùng (idempotency key giống) trả về response cached
- ✅ **AC1.7:** Thanh toán thất bại tự động trả lại slot
- ✅ **AC1.8:** Email xác nhận có chi tiết workshop + mã QR
- ✅ **AC1.9:** Admin xem tất cả đăng ký (trạng thái thanh toán, tham dự)
- ✅ **AC1.10:** Audit trail ghi lại đăng ký, thanh toán, hủy

### 5.2 Tiêu Chí Hiệu Suất

- ✅ **AC2.1:** Xử lý 12.000 đăng ký đồng thời trong 10 phút (1.200 req/phút)
- ✅ **AC2.2:** DB không cạn hết connection pool (< 150/200 sử dụng)
- ✅ **AC2.3:** Circuit breaker mở sau 5 lỗi liên tiếp
- ✅ **AC2.4:** Payment timeout 30s; request trả về 202 (xử lý async tiếp)
- ✅ **AC2.5:** Tỷ lệ lỗi API < 0,5% tại tải cao

---

## 6. Hợp Đồng API

### 6.1 Yêu Cầu: Đăng Ký Workshop

```http
POST /api/registrations HTTP/1.1
Authorization: Bearer <JWT>
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000

{
  "workshop_id": 1,
  "payment_method": "FREE"
}
```

### 6.2 Phản Hồi: 201 Workshop Miễn Phí

```json
{
  "id": 10001,
  "workshop_id": 1,
  "status": "REGISTERED",
  "payment_status": "COMPLETED",
  "qr_code": "data:image/png;base64,iVBOR...",
  "registered_at": "2026-04-22T10:30:00Z",
  "message": "Đăng ký thành công! Kiểm tra email để biết chi tiết."
}
```

### 6.3 Phản Hồi: 202 Workshop Có Phí (Đang Xử Lý)

```json
{
  "id": 10002,
  "status": "REGISTERED",
  "payment_status": "PENDING",
  "message": "Đăng ký nhận được. Đang xử lý thanh toán...",
  "polling_url": "/api/registrations/10002/status"
}
```

### 6.4 Phản Hồi: 409 Không Còn Slot

```json
{
  "error": "WORKSHOP_FULL",
  "message": "Workshop không còn slot khả dụng",
  "details": {
    "workshop_id": 1,
    "capacity": 50,
    "available_slots": 0
  }
}
```

---

## 7. Bảng Thay Đổi Database

```sql
-- Đăng ký mới
INSERT INTO "Registration" (
    student_id, workshop_id, registration_status,
    qr_code, payment_status, idempotency_key
) VALUES (5, 1, 'REGISTERED', 'REG-10001-...', 'COMPLETED', 'UUID-...');

-- Cập nhật slot (NGUYÊN TỬ)
UPDATE "Workshop"
SET available_slots = available_slots - 1
WHERE id = 1 AND available_slots > 0;
-- Chỉ thành công nếu còn slot

-- Ghi nhận kiểm toán
INSERT INTO "AuditLog" (
    user_id, action, entity_type, entity_id, new_values
) VALUES (5, 'REGISTER', 'Registration', 10001, '...');
```

---

## 8. Danh Sách Kiểm Tra Tóm Tắt

- ✅ Ngăn chặn race condition (UPDATE nguyên tử)
- ✅ Xử lý lỗi thanh toán (retry + idempotency)
- ✅ Xử lý async (QR, email)
- ✅ Ghi nhận kiểm toán (tất cả thay đổi)
- ✅ Suy giảm graceful (circuit breaker)
- ✅ Đạt mục tiêu hiệu suất (< 200ms)
- ✅ Mở rộng quy mô cho 12.000 người dùng
- ✅ Xử lý lỗi sẵn sàng cho production

