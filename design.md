# UniHub Workshop - Tóm Tắt Thiết Kế Kiến Trúc

**Phiên Bản:** 1.0  
**Ngày:** 22 Tháng 4, 2026  
**Trạng Thái:** Hoàn Thành Kiểm Tra Kiến Trúc

---

## 1. Tổng Quan Kiến Trúc

### 1.1 Tại Sao Chọn Modular Monolith?

**Lựa Chọn:** Monolith Mô-đun + Clean Architecture (Domain / Application / Infrastructure / API)

**So Sánh với Microservices:**

| Khía Cạnh                | Microservices               | Modular Monolith | Quyết Định     |
| ------------------------ | --------------------------- | ---------------- | -------------- |
| **Độ phức tạp vận hành** | Cao                         | Thấp             | ✅ Monolith    |
| **Tốc độ triển khai**    | Chậm                        | Nhanh            | ✅ Monolith    |
| **Tốc độ phát triển**    | Chậm                        | Nhanh            | ✅ Monolith    |
| **Debug**                | Khó (truy tracing phân tán) | Dễ (process đơn) | ✅ Monolith    |
| **Kích thước team**      | 5+ team                     | 1-2 team         | ✅ Monolith    |
| **Tính nhất quán DB**    | Phức tạp                    | Đơn giản         | ✅ Monolith    |
| **Mở rộng quy mô**       | Linh hoạt                   | Tính năng chặn   | 🟡 TBD Phase 2 |

**Kết Luận:** Bắt đầu với Modular Monolith. Giai Đoạn 2 có thể tách các dịch vụ quan trọng (Payment, Notification).

### 1.2 Các Lớp Clean Architecture

```
┌─────────────────────────────────┐
│  API Layer                      │
│  (Controllers, DTOs, Filters)   │
│  - Routing HTTP                 │
│  - Xác thực request             │
│  - Xử lý lỗi                    │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│  Application Layer              │
│  (Services, Commands, Queries)  │
│  - Điều phối logic business     │
│  - Biên giới giao dịch          │
│  - Phối hợp dịch vụ bên ngoài   │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│  Domain Layer                   │
│  (Entities, Aggregates)         │
│  - Quy tắc business thuần       │
│  - Không phụ thuộc              │
│  - Ngôn ngữ miền                │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│  Infrastructure Layer           │
│  (Repositories, DbContext)      │
│  - Truy cập dữ liệu             │
│  - Cache (Redis)                │
│  - Queue (Hangfire)             │
└─────────────────────────────────┘
```

**Các Mô-đun (trong monolith):**

- **Workshop:** CRUD workshop, tính sẵn có
- **Registration:** Đăng ký, hủy, danh sách
- **Payment:** Xử lý thanh toán, hoàn tiền
- **Notification:** Gửi email, Telegram
- **CheckIn:** Mã QR, ghi nhận tham dự
- **Admin:** Bảng điều khiển, báo cáo
- **Auth:** JWT, RBAC, quyền hạn
- **Common:** Tiện ích chung

---

## 2. Stack Công Nghệ

| Thành Phần         | Công Nghệ            | Lý Do                                      |
| ------------------ | -------------------- | ------------------------------------------ |
| **Backend**        | ASP.NET Core 7+      | Type-safe, async-first, hiệu suất cao      |
| **Database Chính** | PostgreSQL           | ACID, truy vấn phức tạp, hỗ trợ JSON       |
| **Cache & Lock**   | Redis                | < 1ms lookups, distributed locks           |
| **Queue & Jobs**   | Hangfire             | Retry tự động, Redis-backed                |
| **Auth**           | JWT + RBAC           | Stateless, mở rộng được, thân thiện mobile |
| **Resilience**     | Polly                | Circuit breaker, retry logic               |
| **Rate Limit**     | Token Bucket + Redis | Chịu được spike lưu lượng                  |

---

## 3. Luồng Yêu Cầu (Request Flow)

### 3.1 Đăng Ký Workshop

```
CLIENT          API              BACKEND                 DB
  │               │                  │                    │
  │ POST /register│                  │                    │
  ├──────────────>│                  │                    │
  │               │ 1. Auth (JWT)    │                    │
  │               ├─────────────────>│                    │
  │               │ 2. Rate limit    ├──────────────────>│
  │               │    (Redis)       │ CHECK token        │
  │               │ 3. Validate req  │ ALLOWED: YES       │
  │               │ 4. Reserve slot  │<──────────────────┤
  │               ├──────────────────────────────────────>│
  │               │ BEGIN TRANSACTION                     │
  │               │ SELECT workshop FOR UPDATE (lock)    │
  │               │ UPDATE available_slots = -1          │
  │               │ INSERT registration                  │
  │               │ COMMIT                               │
  │               │<──────────────────────────────────────┤
  │               │ 5. Queue notifications               │
  │               ├─────────────────>│                    │
  │ 200 OK        │                  │ ENQUEUE: email    │
  │ {id, qr_code} │                  │ ENQUEUE: QR       │
  │<──────────────┤                  │                    │
  │               │                  │ [Background Jobs]  │
  │               │                  │ - Tạo QR           │
  │               │                  │ - Gửi email        │
```

**Kết Quả:**

- ✓ Response < 200ms (không chặn trên jobs)
- ✓ Slot đảm bảo nguyên tử (không tăng vượt)
- ✓ Email + QR gửi async (1-2s)

### 3.2 Check-in Offline → Sync

```
MOBILE              LOCAL           API SERVER          DB
  │                  │                  │                 │
  │ [ONLINE]         │                  │                 │
  │ Sync student list│                  │                 │
  ├─────────────────>│ GET /workshops   │                 │
  │                  ├─────────────────>│                 │
  │                  │ Download list    │                 │
  │                  │<─────────────────┤                 │
  │                  │ Lưu SQLite       │                 │
  │                  │ ✓ Cache ready    │                 │
  │                  │                  │                 │
  │ [OFFLINE]        │                  │                 │
  │ Scan QR (200x)   │                  │                 │
  ├─────────────────>│ Parse QR → Match│                 │
  │ ✓ Check-in OK    │ SQLite → Record │                 │
  │ (locally)        │ queue: 200 rows │                 │
  │                  │                  │                 │
  │ [INTERNET RESTORED]                │                 │
  │                  │                  │                 │
  │ POST /sync       │                  │                 │
  │ [Batch: 200]     │                  │                 │
  ├─────────────────────────────────────>│                 │
  │                  │                  │ Dedup + insert  │
  │                  │                  ├────────────────>│
  │                  │                  │ 200 rows        │
  │                  │                  │<────────────────┤
  │ ✓ All synced     │                  │                 │
  │<─────────────────────────────────────┤                 │
```

---

## 4. Thiết Kế Database

### 4.1 PostgreSQL Schema Chính

```sql
-- Users & Auth
CREATE TABLE "User" (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'STUDENT',
    created_at TIMESTAMP
);

-- Workshops
CREATE TABLE "Workshop" (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    capacity INT,
    available_slots INT,
    price DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'OPEN',
    created_at TIMESTAMP
);
CREATE INDEX idx_workshop_status ON "Workshop"(status);

-- Registrations
CREATE TABLE "Registration" (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES "User",
    workshop_id BIGINT REFERENCES "Workshop",
    status VARCHAR(50) DEFAULT 'REGISTERED',
    payment_status VARCHAR(50),
    qr_code VARCHAR(500) UNIQUE,
    idempotency_key UUID UNIQUE,
    created_at TIMESTAMP,
    UNIQUE(student_id, workshop_id)
);

-- Attendance (Check-in)
CREATE TABLE "Attendance" (
    id BIGSERIAL PRIMARY KEY,
    registration_id BIGINT REFERENCES "Registration",
    checkin_timestamp TIMESTAMP,
    device_id VARCHAR(100),
    is_synced BOOLEAN DEFAULT true,
    created_at TIMESTAMP
);

-- Audit Trail
CREATE TABLE "AuditLog" (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id BIGINT,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP
);
```

### 4.2 Redis Usage

**Cache (TTL: 1-5 phút)**

```
workshop:list:{date}        → Danh sách workshop
workshop:{id}               → Chi tiết workshop
user:{id}:registrations     → Danh sách đăng ký
```

**Distributed Locks (TTL: 5-10s)**

```
lock:registration:{workshop_id}     → Dự trữ slot
lock:payment:{registration_id}      → Xử lý thanh toán
```

**Rate Limiting (Token Bucket)**

```
ratelimit:{user_id}:{endpoint}      → Token count
```

---

## 5. Cơ Chế Quan Trọng

### 5.1 Ngăn Chặn Race Condition

**Phương Pháp:** Atomic SQL UPDATE

```sql
UPDATE "Workshop"
SET available_slots = available_slots - 1
WHERE id = @id AND available_slots > 0;
-- Chỉ thành công nếu còn slot
-- Không cần explicit lock trong hầu hết trường hợp
```

**Kết Quả:**

- ✓ 2 yêu cầu đồng thời: 1 thành công, 1 thất bại
- ✓ Không bao giờ tăng vượt
- ✓ Hiệu suất cao (< 100ms)

### 5.2 Rate Limiting (Token Bucket)

```
Thuật toán: Token Bucket
- Dung lượng: 100 token
- Tỷ lệ: 100 token/phút
- Cho phép spike: 150 token tạm thời

Redis:
  ratelimit:user:endpoint = {tokens: 85, last_refill: T}

  Mỗi yêu cầu:
  ├─ Tính refill: elapsed_time * rate
  ├─ Tokens = min(capacity, tokens + refill)
  ├─ Consume 1 token
  └─ Nếu tokens < 1 → Return 429 Too Many Requests
```

### 5.3 Queue Xử Lý Async (Hangfire)

**Trước (Sync - Tồi):**

```
POST /register → Reserve (100ms) → Process payment (2-5s) → Timeout!
```

**Sau (Async - Tốt):**

```
POST /register → Reserve (100ms) → Enqueue (10ms) → Return 202
[Background] Payment (async) → QR → Email → Notifications
```

### 5.4 Idempotency

```csharp
// Client
POST /register
Idempotency-Key: UUID-ABC

// Server caches response 24 giờ
// Retry lần 2 → Return cached response (NO new charge)
```

### 5.5 Circuit Breaker (Polly)

```
States: CLOSED → (5 failures) → OPEN → (60s) → HALF-OPEN
                                  ↑
                          Nếu thất bại: quay lại OPEN
                          Nếu thành công: về CLOSED

Khi OPEN: Bypass call → Degrade gracefully
  (Student vẫn được xem workshop, payment resolve sau)
```

---

## 6. RBAC & Authentication

### 6.1 Roles & Permissions

| Role              | Quyền                                        | Người Dùng  |
| ----------------- | -------------------------------------------- | ----------- |
| **STUDENT**       | Xem workshop, đăng ký, QR, check-in          | Sinh viên   |
| **ORGANIZER**     | Tất cả STUDENT + tạo workshop, CSV, thống kê | BTC         |
| **CHECKIN_STAFF** | Xem workshop, quét QR, check-in, offline     | Nhân viên   |
| **ADMIN**         | Tất cả quyền, quản lý user, role, settings   | Super admin |

### 6.2 JWT Token

```json
{
  "sub": "user_123",
  "name": "Nguyễn Văn A",
  "role": "STUDENT",
  "permissions": ["workshop.read", "registration.create"],
  "exp": 1713875200
}
```

**Sử dụng:**

```
Authorization: Bearer eyJhbGciOi...
```

---

## 7. Tối Ưu Hiệu Suất

### 7.1 Mục Tiêu & Chỉ Số

| Chỉ Số                | Mục Tiêu       | Monitoring          |
| --------------------- | -------------- | ------------------- |
| Response time P99     | < 200ms        | Datadog/CloudWatch  |
| Throughput            | 1.200 req/phút | Load test           |
| DB query              | < 50ms         | Query logs          |
| Cache hit rate        | > 90%          | Redis stats         |
| API error rate        | < 0.5%         | Application metrics |
| Circuit breaker trips | < 0.1/day      | Alerts              |

### 7.2 Chiến Lược Caching

```
1. Cache workshop list → 1-minute TTL
2. Cache user sessions → 2-hour TTL
3. Cache registration status → 30-second TTL
4. Cache invalidate on UPDATE events
```

---

## 8. Các Quyết Định Kiến Trúc (ADRs)

### ADR-001: SQL vs NoSQL

**Quyết Định:** PostgreSQL (SQL)  
**Lý Do:** ACID transactions, complex queries, relational data  
**Trade-off:** Horizontal scaling phức tạp (Phase 2)

### ADR-002: Sync vs Async

**Quyết Định:** Hybrid (atomic reservation SYNC, everything else ASYNC)  
**Lý Do:** Immediate feedback + no timeout risk  
**Trade-off:** Complexity tăng

### ADR-003: Hangfire vs RabbitMQ

**Quyết Định:** Hangfire  
**Lý Do:** Built-in .NET, Redis-backed, job management UI  
**Trade-off:** RabbitMQ more scalable (migrate Phase 2)

### ADR-004: JWT vs Sessions

**Quyết Định:** JWT (stateless)  
**Lý Do:** Scalable, works for mobile, REST standard  
**Trade-off:** Cannot revoke mid-session (mitigated by short expiry)

### ADR-005: Redlock vs Simple Lock

**Quyết Định:** Redlock (critical operations)  
**Lý Do:** Handles distributed system issues gracefully  
**Trade-off:** Slight latency

### ADR-006: Token Bucket vs Sliding Window

**Quyết Định:** Token Bucket  
**Lý Do:** Allows bursts, memory-efficient, fair  
**Trade-off:** Sliding Window stricter but uses more memory

---

## 9. Triển Khai & Cơ Sở Hạ Tầng

### 9.1 Mô Phỏng

```
┌─────────────────────────────────┐
│  AWS / Cloud                    │
├─────────────────────────────────┤
│                                 │
│  Load Balancer (SSL/TLS)        │
│           ↓                     │
│  ┌─────────────────────────┐   │
│  │  API Instance 1,2,3...  │   │
│  │  (ASP.NET Core)         │   │
│  └──────┬──────────────────┘   │
│         ↓                       │
│  ┌─────────────────────────┐   │
│  │  PostgreSQL Primary     │   │
│  │  + Read Replicas        │   │
│  └──────┬──────────────────┘   │
│  ┌──────▼──────────────────┐   │
│  │  Redis Cluster          │   │
│  │  (Cache, Locks, Queues) │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │  Hangfire Server        │   │
│  │  (Background Jobs)      │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

### 9.2 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@db.internal:5432/unihub

# Cache & Queue
REDIS_CONNECTION_STRING=redis-cluster.internal:6379

# Auth
JWT_SECRET=<generated-secret>
JWT_EXPIRY_MINUTES=15

# Payment
STRIPE_API_KEY=sk_live_xxx

# Notifications
SENDGRID_API_KEY=xxx
TELEGRAM_BOT_TOKEN=xxx

# Logging
SENTRY_DSN=xxx
LOG_LEVEL=Information
```

---

## 10. Monitoring & Observability

### 10.1 Metrics Chính

```
Metric: Registration Success Rate
  = (Successful) / (Total Attempts) × 100%
  Target: > 98%

Metric: Payment Success Rate
  = (Successful Charges) / (Attempted) × 100%
  Target: > 99.5%

Metric: Response Time P99
  Target: < 200ms

Metric: Error Rate
  Target: < 0.5%
```

### 10.2 Logging

```csharp
_logger.LogInformation(
    "Registration attempt: {@Request}",
    new { StudentId = 5, WorkshopId = 1 });

_logger.LogWarning(
    "Race condition prevented",
    new { WorkshopId = 1 });

_logger.LogError(
    "Payment failed", ex,
    new { RegistrationId = 100 });
```

---

## 11. Tóm Tắt

| Thành Phần     | Công Nghệ             | Lý Do Chọn                     |
| -------------- | --------------------- | ------------------------------ |
| Framework      | ASP.NET Core          | Type-safe, async, high-perf    |
| Architecture   | Modular Monolith      | Fast iteration, simple deploy  |
| Database       | PostgreSQL            | ACID, complex queries          |
| Cache          | Redis                 | < 1ms lookups, locks           |
| Queue          | Hangfire              | Built-in retries, Redis-backed |
| Auth           | JWT + RBAC            | Stateless, scalable            |
| Rate Limit     | Token Bucket          | Burst-friendly, efficient      |
| Race Condition | Atomic SQL            | Simple, effective              |
| Resilience     | Polly Circuit Breaker | Graceful degradation           |

---

## 12. Mục Tiêu Hiệu Suất

```
Metric                              Target         Monitoring
───────────────────────────────────────────────────────────────
Registration response time          < 200ms        P99 latency
Concurrent registrations            1,200 req/min  Throughput
Database query time                 < 50ms         Query logs
Cache hit rate                      > 90%          Redis stats
API error rate                      < 0.5%         Metrics
Circuit breaker activation          < 0.1/day      Alerts
Payment success rate                > 99.5%        Transactions
Check-in sync latency               < 2 min        Device logs
CSV import time                     < 5 min/50K    Job logs
```

---

**Trạng Thái:** Sẵn sàng cho Phát Triển ✅  
**Kỳ Vọng Go-Live:** 8 tuần  
**Support Team:** DevOps + Backend Engineers
