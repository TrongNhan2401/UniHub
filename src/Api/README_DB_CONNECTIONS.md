# UniHub API - Hướng Dẫn Kết Nối Cơ Sở Dữ Liệu

Tài liệu này hướng dẫn teammate setup kết nối Supabase cho API bằng `dotnet user-secrets`.

## 1. Tổng quan kết nối

API dùng 2 connection string:

- `ConnectionStrings:Default`: dùng cho runtime API (Supabase pooler, port `6543`)
- `ConnectionStrings:Migration`: dùng cho EF migration (direct DB, port `5432`)

Không commit mật khẩu thật lên Git.

## 2. Điều kiện trước khi setup

- Đã clone repo
- Đã cài .NET SDK (phù hợp với project)
- Đã được cấp:
  - Supabase `project ref`
  - DB password

## 3. Setup user-secrets (lần đầu)

Chạy trong thư mục API project:

```bash
cd /c/Users/<your-user>/Desktop/UniHub/src/Api/Api
dotnet user-secrets init
```

## 4. Set connection strings

### 4.1 Runtime connection (pooler - port 6543)

```bash
dotnet user-secrets set "ConnectionStrings:Default" "Host=aws-1-ap-northeast-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.<project-ref>;Password=<your-password>;SSL Mode=Require;Trust Server Certificate=true"
```

### 4.2 Migration connection (direct - port 5432)

```bash
dotnet user-secrets set "ConnectionStrings:Migration" "Host=db.<project-ref>.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=<your-password>;SSL Mode=Require;Trust Server Certificate=true"
```

Lưu ý:

- Thay `<project-ref>` bằng giá trị thật (ví dụ: `uadbvcxyztvmnbcdagqw`)
- Thay `<your-password>` bằng DB password thật
- Không thêm `Pgbouncer=true` vào connection string

## 5. Kiểm tra secrets đã lưu

```bash
dotnet user-secrets list
```

Kỳ vọng thấy đủ 2 key:

- `ConnectionStrings:Default = ...`
- `ConnectionStrings:Migration = ...`

## 6. Chạy API và test kết nối DB

```bash
dotnet run
```

Nếu đúng, startup log sẽ in:

```text
✅ Supabase successfully connected.
```

Có thể test endpoint:

```bash
curl http://localhost:5186/api/health/db
```

Kỳ vọng response:

```json
{ "message": "✅ Supabase successfully connected." }
```

## 7. Troubleshooting nhanh

### 7.1 Log hiện `❌ Supabase connection failed.`

Kiểm tra lại:

- Username trong `ConnectionStrings:Default` có dạng `postgres.<project-ref thật>` không
- Password có đúng không
- Có để nhầm placeholder `<project-ref>` hoặc `YOURPASSWORD` không

### 7.2 Lỗi `address already in use` (port bị trùng)

Tìm PID đang giữ cổng:

```bash
netstat -ano | findstr :5186
```

Dừng process:

```bash
taskkill /PID <PID> /F
```

### 7.3 Cần set lại key bị sai

```bash
dotnet user-secrets set "ConnectionStrings:Default" "<new-value>"
```

## 8. Lệnh tiện ích

Xóa 1 key:

```bash
dotnet user-secrets remove "ConnectionStrings:Default"
```

Xóa toàn bộ secrets của project:

```bash
dotnet user-secrets clear
```

Nếu đang dùng command ở thư mục gốc repo, thêm `--project`:

```bash
dotnet user-secrets list --project src/Api/Api
dotnet user-secrets set "ConnectionStrings:Default" "<value>" --project src/Api/Api
```

---

Ghi chú:

- Runtime API: dùng pooler `6543`
- Migration: dùng direct `5432`
- Secrets phải chia sẻ qua kênh an toàn (không gửi trong public chat/repo)
