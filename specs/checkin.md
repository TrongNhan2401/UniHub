# Đặc Tả: Check-in Hỗ Trợ Offline

**ID Tài Liệu:** SPEC-CHK-001-VI  
**Phiên Bản:** 1.0  
**Cập Nhật Lần Cuối:** 22 Tháng 4, 2026  
**Trạng Thái:** Được phê duyệt cho Phát Triển

---

## 1. Tổng Quan

Đặc tả này xác định quy trình check-in để ghi nhận tham dự workshop. Nhân viên quét mã QR trên các thiết bị di động. Hệ thống **phải hỗ trợ hoạt động offline** (không internet) với đồng bộ cuối cùng khi kết nối được phục hồi.

### Tính Năng Chính

- ✅ Quét mã QR qua camera hoặc đầu đọc mã vạch
- ✅ **Offline-first:** Lưu trữ cục bộ (SQLite) khi không có internet
- ✅ **Đồng bộ tự động:** Tải lên check-in khi kết nối được phục hồi
- ✅ **Idempotent:** Không có tham dự trùng lặp nếu đồng bộ thất bại và thử lại
- ✅ **Dashboard thời gian thực:** Những người tổ chức xem thống kê check-in trực tiếp

---

## 2. Kiến Trúc

### 2.1 Ứng Dụng Di Động (PWA/Electron)

```
┌────────────────────────────────┐
│     Ứng Dụng Check-in          │
│  (PWA / Native / Electron)     │
├────────────────────────────────┤
│                                │
│  UI Layer:                     │
│  - Quét QR (camera)            │
│  - Danh sách tham dự           │
│  - Trạng thái đồng bộ          │
│                 ↓              │
│  Service Layer:                │
│  - Xử lý quét                  │
│  - Quản lý đồng bộ             │
│  - Phát hiện mạng              │
│                 ↓              │
│  Local Storage:                │
│  - SQLite (dữ liệu cache)      │
│  - Queue đợi đồng bộ           │
│  - Bản ghi tham dự             │
│                 ↓              │
│  Network:                      │
│  - Cuộc gọi API đồng bộ        │
│  - Retry tự động               │
│                                │
└────────────────────────────────┘
```

### 2.2 Lưu Trữ Cục Bộ (SQLite)

```sql
-- Cache: Danh sách workshop
CREATE TABLE workshop_cache (
    id INTEGER PRIMARY KEY,
    title TEXT,
    date TEXT,
    start_time TEXT,
    end_time TEXT,
    synced_at TIMESTAMP
);

-- Cache: Sinh viên đã đăng ký
CREATE TABLE student_cache (
    id INTEGER PRIMARY KEY,
    registration_id INTEGER,
    name TEXT,
    qr_code TEXT,
    workshop_id INTEGER,
    synced_at TIMESTAMP
);

-- Chờ đồng bộ: Các check-in chưa tải lên
CREATE TABLE pending_checkins (
    id INTEGER PRIMARY KEY,
    registration_id INTEGER,
    qr_code TEXT,
    checkin_timestamp TIMESTAMP,
    sync_status TEXT, -- PENDING, SYNCING, SYNCED
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP
);

-- Thông tin thiết bị
CREATE TABLE device_info (
    id INTEGER PRIMARY KEY,
    device_id TEXT UNIQUE,
    staff_id INTEGER,
    staff_name TEXT,
    last_sync TIMESTAMP
);
```

---

## 3. Quy Trình Chính

### 3.1 Khởi Tạo & Đồng Bộ (Trực Tuyến)

```
NHÂN VIÊN             ỨNG DỤNG             HỆ THỐNG
   │                    │                    │
   │ 1. Khởi động      │                    │
   ├──────────────────>│                    │
   │                  │ 2. Đăng nhập        │
   │                  │    (username/pass) │
   │                  ├───────────────────>│
   │                  │ ✓ JWT token        │
   │                  │<───────────────────┤
   │                  │                    │
   │ 2. Chọn workshop │                    │
   │    (AI Basics)   │                    │
   ├──────────────────>│                    │
   │                  │ 3. Lấy danh sách   │
   │                  │    sinh viên        │
   │                  ├───────────────────>│
   │                  │ 50 sinh viên        │
   │                  │ + mã QR             │
   │                  │<───────────────────┤
   │                  │                    │
   │                  │ 4. Lưu vào SQLite  │
   │                  │    - Workshops     │
   │                  │    - Students      │
   │                  │                    │
   │ ✓ Ứng dụng sẵn   │                    │
   │   (với/không NET)│                    │
```

### 3.2 Quét Mã QR (Trực Tuyến)

```
NHÂN VIÊN             ỨNG DỤNG             HỆ THỐNG
   │                    │                    │
   │ 1. Quét QR        │                    │
   │    (camera)       │                    │
   ├──────────────────>│                    │
   │                  │ 2. Phân tích QR    │
   │                  │    "REG-10001"     │
   │                  │                    │
   │                  │ 3. Mạng online?    │
   │                  │    CÓ              │
   │                  │                    │
   │                  │ 4. POST /checkin   │
   │                  ├───────────────────>│
   │                  │ {registration_id:  │
   │                  │  10001, ...}       │
   │                  │                    │
   │                  │ 5. Kiểm tra        │
   │                  │    - Hợp lệ?       │
   │                  │    - Trùng?        │
   │                  │    ✓ Chưa          │
   │                  │                    │
   │                  │ 6. INSERT tham dự  │
   │                  │<───────────────────┤
   │                  │ ✓ Thành công 200   │
   │ ✓ Check-in!      │                    │
   │ "Nguyễn Văn A    │                    │
   │  ✓ XONG"         │                    │
```

### 3.3 Quét Mã QR (Offline)

```
NHÂN VIÊN             ỨNG DỤNG
   │                    │
   │ 1. Quét QR        │
   ├──────────────────>│
   │                  │ 2. Phân tích: REG-10001
   │                  │
   │                  │ 3. Mạng? KHÔNG
   │                  │
   │                  │ 4. Tìm trong SQLite
   │                  │    ✓ FOUND: Nguyễn Văn A
   │                  │
   │                  │ 5. INSERT pending_checkins
   │                  │    sync_status = PENDING
   │                  │
   │ ✓ Check-in!      │ Response:
   │ "Nguyễn Văn A    │ {status: PENDING,
   │ ✓ XONG           │  msg: "Offline - sẽ
   │ (chờ đồng bộ)"   │  đồng bộ"}
   │                  │
   │ Quét 200 nữa...  │ Tất cả lưu cục bộ
   │ (tất cả offline) │
   │                  │
   │ [Internet phục hồi]
   │                  │
   │                  │ Phát hiện mạng!
   │                  │ Đồng bộ 200 check-in
   │                  │ (phần tiếp theo)
```

### 3.4 Đồng Bộ: Tải Lên Check-in (Khi Online)

```
ỨNG DỤNG              HỆ THỐNG              DB
   │                    │                   │
   │ 1. Phát hiện mạng  │                   │
   │    Tải lên pending │                   │
   │                    │                   │
   │ 2. GET pending     │                   │
   │    từ SQLite:      │                   │
   │    200 bản ghi     │                   │
   │                    │                   │
   │ 3. POST /checkin   │                   │
   │    /sync [Batch]   │                   │
   │    {200 records}   │                   │
   ├───────────────────>│                   │
   │                    │ 4. Kiểm tra từng: │
   │                    │    - Hợp lệ?      │
   │                    │    - Trùng?       │
   │                    │                   │
   │                    │ 5. BEGIN TX        │
   │                    │ 6. Các bản ghi mới │
   │                    │    INSERT         │
   │                    ├──────────────────>│
   │                    │ 200 bản ghi       │
   │                    │<──────────────────┤
   │                    │ 7. COMMIT         │
   │                    │                   │
   │ ✓ Phản hồi 200:    │                   │
   │ {                  │                   │
   │   successful: 200, │                   │
   │   failed: 0        │                   │
   │ }                  │                   │
   │<───────────────────┤                   │
   │                    │                   │
   │ 8. Update local:   │                   │
   │    pending_checkins│                   │
   │    sync_status=    │                   │
   │    SYNCED          │                   │
   │                    │                   │
   │ ✓ Đồng bộ hoàn     │                   │
   │   thành!           │                   │
```

---

## 4. Kịch Bản Lỗi

### 4.1 Check-in Trùng Lặp (Ngăn Chặn)

```
Kịch Bản: Nhân viên quét mã QR 2 lần (tai nạn)

T=0s   Quét QR
       ✓ Thành công: 201 INSERT tham dự

T=5s   Quét mã QR giống lại (retry)
       
Máy chủ:
  ├─ Kiểm tra: Sinh viên đã check-in hôm nay?
  │  SELECT * FROM Attendance
  │  WHERE registration_id = 10001
  │  AND DATE(checkin_timestamp) = TODAY
  │  
  │  ✓ Tìm thấy (từ lần quét đầu)
  │
  └─ Phản hồi: 409 Conflict
     "Sinh viên đã check-in rồi"
     
     ✗ KHÔNG INSERT bản ghi mới

Kết Quả:
  ✓ Attendance table: chỉ 1 bản ghi (không 2)
  ✓ Không check-in trùng lặp
```

### 4.2 Sinh Viên Không Trong Danh Sách

```
Nhân viên quét: "REG-10002-WEBDEV"
Offline lookup:
  SELECT * FROM student_cache
  WHERE qr_code = 'REG-10002-WEBDEV'
  AND workshop_id = 1
  
  ✗ KHÔNG TÌM THẤY

Phản hồi: 404 Not Found
  "Mã QR này không được đăng ký cho workshop này"

Hành động của Nhân viên:
  Xác nhận với sinh viên
```

### 4.3 Offline Kéo Dài (Dữ Liệu Cũ)

```
Kịch Bản: Offline 4 giờ, sinh viên mới đăng ký online

T=0h   Ứng dụng đồng bộ: 50 sinh viên
       Quét & lưu cục bộ 30 check-in

T=4h   Sinh viên mới: "Tôi vừa đăng ký!"
       Nhân viên: "Không có trong danh sách"
       
Vấn Đề: Dữ liệu cũ (4 giờ)

Giải Pháp:
  1. Khi online: Tap "Tải lại danh sách sinh viên"
     → Kéo danh sách mới từ máy chủ
  2. Hoặc: Nhập QR thủ công nếu sinh viên hiển thị
```

### 4.4 Lỗi Đồng Bộ Mạng

```
Quét 200 sinh viên offline

Khi đồng bộ:
  POST /checkin/sync [200 bản ghi]
  ├─ Bản ghi 1-100: Thành công ✓
  ├─ Bản ghi 101: Timeout kết nối
  └─ Kết nối mất

Trạng Thái cục bộ:
  - Bản ghi 1-100: sync_status = SYNCED
  - Bản ghi 101-200: sync_status = PENDING (retry_count=1)

Retry (sau 30s):
  POST /checkin/sync [200 bản ghi]
  
  Máy chủ phát hiện trùng (1-100):
  ├─ Bản ghi 1-100: Đã có rồi, bỏ qua
  └─ Bản ghi 101-200: Bản ghi mới, INSERT

Phản hồi 200:
  {
    "successful": 100,
    "skipped": 100,
    "message": "Đã đồng bộ 100 mới"
  }

Kết Quả:
  ✓ Tất cả 200 bản ghi đồng bộ
  ✓ Không trùng lặp
```

---

## 5. Ràng Buộc & Yêu Cầu

### 5.1 Ràng Buộc Offline

| Ràng Buộc | Triển Khai | Xác Thực |
|-----------|-----------|----------|
| Hoạt động không internet | Tất cả dữ liệu cache SQLite | Quét offline |
| Đồng bộ khi online | Tự động phát hiện mạng | Kiểm tra kết nối |
| Không mất dữ liệu | SQLite lưu trước HTTP | Xác minh lưu trữ |
| Đồng bộ idempotent | Kiểm tra trùng trước insert | Thử nghiệm trùng |
| Cache tươi | Đồng bộ danh sách sinh viên | So sánh timestamp |
| Queue bền vững | SQLite bền vững qua crash | Giết ứng dụng, xác minh dữ liệu |

### 5.2 Ràng Buộc Hiệu Suất

| Chỉ Số | Mục Tiêu | SLA |
|--------|----------|-----|
| Quét QR (online) | < 500ms | 99% yêu cầu |
| Quét QR (offline) | < 100ms | Lookup cục bộ chỉ |
| Thời gian đồng bộ/100 bản ghi | < 5s | Tải hàng loạt |
| Khởi động ứng dụng | < 2s | Cold start với dữ liệu |
| Truy vấn SQLite | < 50ms | SELECT đơn giản |
| Phát hiện mạng | < 2s | Giám sát liên tục |

### 5.3 Ràng Buộc Bảo Mật

- ✓ **Xác thực:** JWT + RBAC
- ✓ **Mã hóa cục bộ:** SQLite encrypted (SQLCipher)
- ✓ **Chuyên tuyến:** HTTPS chỉ cho đồng bộ
- ✓ **Xác thực lại:** Sau 1 giờ offline

---

## 6. Tiêu Chí Chấp Nhận

### 6.1 Tiêu Chí Chức Năng

- ✅ **AC1.1:** Nhân viên đăng nhập và xem danh sách workshop được gán
- ✅ **AC1.2:** Ứng dụng đồng bộ dữ liệu workshop & sinh viên trong 3s (online)
- ✅ **AC1.3:** Nhân viên quét QR nhận "Check-in thành công" trong 500ms (online)
- ✅ **AC1.4:** Nhân viên có thể quét tiếp tục không có internet (offline)
- ✅ **AC1.5:** Ứng dụng phát hiện internet được phục hồi & tự động đồng bộ
- ✅ **AC1.6:** Đồng bộ 200 check-in trong < 5s
- ✅ **AC1.7:** Quét trùng bị từ chối (409 Conflict)
- ✅ **AC1.8:** Máy chủ ngăn chặn tham dự trùng lặp
- ✅ **AC1.9:** Mã QR chứa đủ thông tin (ID, tên, workshop)
- ✅ **AC1.10:** Nhân viên xem thống kê check-in cục bộ

### 6.2 Tiêu Chí Hiệu Suất

- ✅ **AC2.1:** Ứng dụng offline 8+ giờ không kết nối mạng
- ✅ **AC2.2:** SQLite lưu 500+ bản ghi không suy giảm
- ✅ **AC2.3:** Đồng bộ tự động khi mạng được phục hồi (< 2s)
- ✅ **AC2.4:** Sử dụng bộ nhớ < 100MB ngay cả với 500 check-in
- ✅ **AC2.5:** Quét QR hoạt động với barcode scanner Bluetooth
- ✅ **AC2.6:** API đồng bộ xử lý 200+ check-in/yêu cầu
- ✅ **AC2.7:** Retry thất bại tự động (1s, 2s, 4s, 8s)
- ✅ **AC2.8:** Phát hiện kết nối phản hồi < 2s
- ✅ **AC2.9:** Ứng dụng sống sót qua gián đoạn mạng
- ✅ **AC2.10:** Sử dụng pin < 5% mỗi giờ

---

## 7. Hợp Đồng API

### 7.1 Đồng Bộ Ban Đầu

```http
GET /api/workshops/3/registrations HTTP/1.1
Authorization: Bearer <JWT>

Response 200:
{
  "workshop": {
    "id": 3,
    "title": "AI Basics",
    "date": "2026-04-25",
    "registered_count": 48
  },
  "registrations": [
    {
      "id": 10001,
      "name": "Nguyễn Văn A",
      "qr_code": "REG-10001-AIBAS"
    },
    ...
  ]
}
```

### 7.2 Quét Đơn (Online)

```http
POST /api/checkins HTTP/1.1
Authorization: Bearer <JWT>

{
  "registration_id": 10001,
  "scanned_qr": "REG-10001-AIBAS",
  "device_id": "device-123"
}

Response 200:
{
  "status": "OK",
  "student_name": "Nguyễn Văn A",
  "message": "Check-in thành công"
}
```

### 7.3 Đồng Bộ Hàng Loạt

```http
POST /api/checkins/sync HTTP/1.1
Authorization: Bearer <JWT>

{
  "device_id": "device-123",
  "checkins": [
    {
      "registration_id": 10001,
      "checkin_timestamp": "2026-04-25T09:15:00Z"
    },
    ... 199 more ...
  ]
}

Response 200:
{
  "successful": 200,
  "failed": 0,
  "message": "200 check-in đã đồng bộ"
}
```

---

## 8. Danh Sách Kiểm Tra Tóm Tắt

- ✅ Hỗ trợ hoạt động offline (SQLite cache cục bộ)
- ✅ Ngăn chặn check-in trùng (khử trùng trên đồng bộ)
- ✅ Xử lý lỗi mạng (retry + tính nhất quán cuối cùng)
- ✅ Đồng bộ tự động khi online (phát hiện kết nối)
- ✅ Tải lên hàng loạt để hiệu suất (200+ bản ghi/yêu cầu)
- ✅ Các hoạt động Idempotent (thử lại an toàn)
- ✅ Theo dõi thiết bị (device_id để kiểm toán)
- ✅ Phản hồi thân thiện với người dùng
- ✅ Mở rộng quy mô cho 100+ nhân viên check-in
- ✅ Xử lý lỗi sẵn sàng cho production
