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

## 9. Hướng dẫn chạy Swagger cho teammate

Mục tiêu: mở được giao diện Swagger UI để test nhanh API trước khi làm Auth/JWT.

### 9.1 Điều kiện

- Đã cài package `Swashbuckle.AspNetCore`
- Đã chạy được API bằng `dotnet run`
- Environment là `Development`

### 9.2 Chạy Swagger

1. Chạy API:

```bash
cd src/Api/Api
dotnet run
```

2. Mở Swagger UI trên trình duyệt:

```text
http://localhost:5186/swagger
```

3. Nếu cần kiểm tra JSON của Swagger:

```bash
curl http://localhost:5186/swagger/v1/swagger.json
```

Kỳ vọng: trả về HTTP `200` và JSON OpenAPI.

### 9.3 Những gì đã được config trong Program.cs

- `builder.Services.AddEndpointsApiExplorer();`
- `builder.Services.AddSwaggerGen();`
- Trong `if (app.Environment.IsDevelopment())`:
  - `app.UseSwagger();`
  - `app.UseSwaggerUI(...)` với endpoint `/swagger/v1/swagger.json`

### 9.4 Troubleshooting Swagger

- Không mở được `/swagger`:
  - Kiểm tra app có chạy ở `Development` không
  - Kiểm tra log startup có lỗi bind port không

- Lỗi `address already in use`:

```bash
netstat -ano | findstr :5186
taskkill /PID <PID> /F
```

- `curl` không ra JSON:
  - Đảm bảo URL đúng: `/swagger/v1/swagger.json`
  - Đảm bảo app đang chạy trước khi gọi `curl`

---

Ghi chú:

- Runtime API: dùng pooler `6543`
- Migration: dùng direct `5432`
- Secrets phải chia sẻ qua kênh an toàn (không gửi trong public chat/repo)
