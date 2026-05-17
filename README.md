# UniHub

Hướng dẫn này được viết để một người mới hoàn toàn có thể setup và chạy dự án từ đầu.

## 1. Tổng quan nhanh

UniHub gồm 4 phần chính:

1. API backend: ASP.NET Core (NET 10), port mac dinh `5186`.
2. Web Student: React + Vite, port mac dinh `5173`.
3. Web Admin: React + Vite, thuong chay `3002`.
4. Mobile Check-in: Expo React Native (Android/iOS/Web).

## 2. Điều kiện cần trước

Cần cài trước trên máy:

1. .NET SDK 10.x
2. Node.js LTS (khuyen nghi 20.x)
3. npm
4. Docker Desktop (neu dung Postgres local bang Docker)
5. Git

Kiểm tra nhanh:

```bash
dotnet --version
node --version
npm --version
docker --version
git --version
```

## 3. Clone source code

```bash
git clone <YOUR_REPO_URL>
cd UniHub
```

Toàn bộ hướng dẫn bên dưới đều tính từ thư mục gốc `UniHub`.

## 4. Setup Database và key backend

Có 2 cách chạy DB: dùng Supabase (nếu team cấp sẵn) hoặc dùng Postgres local bằng Docker.

### 4.1 Cách A - Dùng Supabase (dễ theo tài liệu hiện tại)

Cần xin từ team:

1. `project-ref`
2. DB password

Vào thư mục API:

```bash
cd src/Api/Api
```

Khởi tạo user secrets (chỉ cần làm 1 lần):

```bash
dotnet user-secrets init
```

Set 2 connection strings:

```bash
dotnet user-secrets set "ConnectionStrings:Default" "Host=aws-1-ap-northeast-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.<project-ref>;Password=<your-password>;SSL Mode=Require;Trust Server Certificate=true"
dotnet user-secrets set "ConnectionStrings:Migration" "Host=db.<project-ref>.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=<your-password>;SSL Mode=Require;Trust Server Certificate=true"
```

### 4.2 Cách B - Dùng Postgres local bằng Docker

Từ thư mục gốc `UniHub`:

```bash
cd src/docker
cp .env.example .env
docker compose up -d
cd ../..
```

Sau đó vào API và set connection string local:

```bash
cd src/Api/Api
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=unihub_workshop;Username=unihub;Password=unihub_dev_pwd;SSL Mode=Disable;Trust Server Certificate=true"
dotnet user-secrets set "ConnectionStrings:Migration" "Host=localhost;Port=5432;Database=unihub_workshop;Username=unihub;Password=unihub_dev_pwd;SSL Mode=Disable;Trust Server Certificate=true"
```

### 4.3 Set các key bắt buộc tối thiểu cho backend

Vẫn trong `src/Api/Api`, set JWT key (bắt buộc):

```bash
dotnet user-secrets set "Jwt:Key" "REPLACE_THIS_WITH_A_REAL_SECRET_AT_LEAST_32_CHARS"
```

Nếu muốn test payment bằng mock (không cần key PayOS thật), bật mock:

```bash
dotnet user-secrets set "Payment:UseMock" "true"
dotnet user-secrets set "Payment:MockMode" "Success"
```

Nếu muốn test payment thật với PayOS, set thêm:

```bash
dotnet user-secrets set "Payment:PayOS:ClientId" "<PAYOS_CLIENT_ID>"
dotnet user-secrets set "Payment:PayOS:ApiKey" "<PAYOS_API_KEY>"
dotnet user-secrets set "Payment:PayOS:ChecksumKey" "<PAYOS_CHECKSUM_KEY>"
dotnet user-secrets set "Payment:PayOS:ReturnUrl" "http://localhost:5173/payment/result"
dotnet user-secrets set "Payment:PayOS:CancelUrl" "http://localhost:5173/payment/cancel"
dotnet user-secrets set "Payment:PayOS:WebhookUrl" "http://localhost:5186/api/payments/webhook/payos"
```

Nếu cần gửi email thật (không bắt buộc để chạy local), set thêm:

```bash
dotnet user-secrets set "Email:SmtpHost" "smtp.gmail.com"
dotnet user-secrets set "Email:SmtpPort" "587"
dotnet user-secrets set "Email:Username" "<YOUR_GMAIL>"
dotnet user-secrets set "Email:Password" "<YOUR_GMAIL_APP_PASSWORD>"
dotnet user-secrets set "Email:FromAddress" "<YOUR_GMAIL>"
dotnet user-secrets set "Email:FromName" "UniHub Workshop"
dotnet user-secrets set "Email:EnableSsl" "true"
```

Kiểm tra lại các key đã lưu:

```bash
dotnet user-secrets list
```

## 5. Tạo schema DB (migration)

Từ thư mục gốc `UniHub`:

```bash
cd src/Api
```

Chạy migration vào DB:

```bash
dotnet ef database update --project Infrastructure --startup-project Api
```

Nếu máy báo `dotnet-ef` chưa có, cài thêm:

```bash
dotnet tool install --global dotnet-ef
dotnet ef database update --project Infrastructure --startup-project Api
```

## 6. Chạy Backend API

Từ thư mục gốc `UniHub`:

```bash
cd src/Api/Api
dotnet restore
dotnet build
dotnet run --launch-profile http
```

Khi chạy thành công:

1. API: `http://localhost:5186`
2. Swagger: `http://localhost:5186/swagger`

## 7. Chạy Web Student

Mở terminal mới, từ thư mục gốc `UniHub`:

```bash
cd src/web/student
npm install
npm run dev
```

Web student đọc ở: `http://localhost:5173`

Ghi chú:

1. File `src/web/student/.env` đã có `VITE_API_URL=http://localhost:5186/api`.
2. Nếu API ở máy khác, sửa lại `VITE_API_URL`.

## 8. Chạy Web Admin

Mở terminal mới, từ thư mục gốc `UniHub`:

```bash
cd src/web/admin
npm install
npm run dev -- --port 3002 --strictPort
```

Web admin: `http://localhost:3002`

Ghi chú:

1. File `src/web/admin/.env` đã có `VITE_API_URL=http://localhost:5186/api`.
2. Nếu API ở máy khác, sửa lại `VITE_API_URL`.

## 9. Chạy Mobile Check-in (Expo)

Mở terminal mới, từ thư mục gốc `UniHub`:

```bash
cd src/mobile/check-in
npm install
npm start
```

Nếu chạy Android emulator:

```bash
npm run android
```

Biến API cho mobile:

1. App ưu tiên đọc `EXPO_PUBLIC_API_URL`.
2. Nếu không set, app fallback:
   - Android emulator: `http://10.0.2.2:5186/api`
   - Platform khác: `http://localhost:5186/api`

Ví dụ set tạm cho terminal hiện tại (Git Bash):

```bash
export EXPO_PUBLIC_API_URL="http://localhost:5186/api"
npm start
```

## 10. Tài khoản test nhanh

Hệ thống seed 1 tài khoản check-in staff khi startup:

1. Email: `checkin.seed@unihub.local`
2. Password: `Checkin@123`
3. Role: `CHECKIN_STAFF`

Bạn có thể tạo thêm account organizer/student qua API:

1. `POST /api/auth/signup`
2. Hoặc `POST /api/checkins/signup-staff` (cần token organizer)

## 11. Thứ tự chạy đầy đủ khuyên nghị

1. Terminal 1: chạy API (`src/Api/Api`).
2. Terminal 2: chạy Web Student (`src/web/student`).
3. Terminal 3: chạy Web Admin (`src/web/admin`).
4. Terminal 4: chạy Mobile Check-in (`src/mobile/check-in`).

## 12. Lỗi thường gặp và cách xử lý nhanh

1. Port 5186 dang bi chiem:

```bash
netstat -ano | findstr :5186
taskkill /PID <PID> /F
```

2. API bao loi ket noi DB:

```bash
cd src/Api/Api
dotnet user-secrets list
```

Kiểm tra lại `ConnectionStrings:Default` đã đúng host/port/user/password chưa.

3. Web gọi API lỗi CORS:

- Đảm bảo web đang chạy ở localhost (`5173`, `3002`) hoặc thêm origin vào config API.
- Đảm bảo `VITE_API_URL` trỏ đúng API URL.

4. Mobile không gọi được API trên emulator:

- Dùng `EXPO_PUBLIC_API_URL=http://10.0.2.2:5186/api` cho Android emulator.
- Đảm bảo máy tính và emulator truy cập cùng host.

## 13. Tài liệu chi tiết

1. API auth/JWT: `docs/api_jwt.md`
2. API check-in: `docs/api_checkin.md`
3. API registration: `docs/api_registration.md`
4. API payment: `docs/api_payment.md`
5. Notification: `docs/api_notification.md`
6. Ghi chú kết nối DB Supabase: `src/Api/README_DB_CONNECTIONS.md`

---

Nếu bạn muốn, có thể bổ sung tiếp một phần "One-command local run" bằng `docker compose` + script `start-all` để team mới vào là chạy ngay.
