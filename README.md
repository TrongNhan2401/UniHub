# UniHub

Huong dan nay duoc viet de mot nguoi moi hoan toan co the setup va chay du an tu dau.

## 1. Tong quan nhanh

UniHub gom 4 phan chinh:

1. API backend: ASP.NET Core (NET 10), port mac dinh `5186`.
2. Web Student: React + Vite, port mac dinh `5173`.
3. Web Admin: React + Vite, thuong chay `3002`.
4. Mobile Check-in: Expo React Native (Android/iOS/Web).

## 2. Dieu kien can truoc

Can cai truoc tren may:

1. .NET SDK 10.x
2. Node.js LTS (khuyen nghi 20.x)
3. npm
4. Docker Desktop (neu dung Postgres local bang Docker)
5. Git

Kiem tra nhanh:

```bash
dotnet --version
node --version
npm --version
docker --version
git --version
```

## 3. Clone source

```bash
git clone <YOUR_REPO_URL>
cd UniHub
```

Toan bo huong dan ben duoi deu tinh tu thu muc goc `UniHub`.

## 4. Setup Database va key backend

Co 2 cach chay DB: dung Supabase (neu team cap san) hoac dung Postgres local bang Docker.

### 4.1 Cach A - Dung Supabase (de theo tai lieu hien tai)

Can xin tu team:

1. `project-ref`
2. DB password

Vao thu muc API:

```bash
cd src/Api/Api
```

Khoi tao user secrets (chi can lam 1 lan):

```bash
dotnet user-secrets init
```

Set 2 connection string:

```bash
dotnet user-secrets set "ConnectionStrings:Default" "Host=aws-1-ap-northeast-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.<project-ref>;Password=<your-password>;SSL Mode=Require;Trust Server Certificate=true"
dotnet user-secrets set "ConnectionStrings:Migration" "Host=db.<project-ref>.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=<your-password>;SSL Mode=Require;Trust Server Certificate=true"
```

### 4.2 Cach B - Dung Postgres local bang Docker

Tu thu muc goc `UniHub`:

```bash
cd src/docker
cp .env.example .env
docker compose up -d
cd ../..
```

Sau do vao API va set connection string local:

```bash
cd src/Api/Api
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=unihub_workshop;Username=unihub;Password=unihub_dev_pwd;SSL Mode=Disable;Trust Server Certificate=true"
dotnet user-secrets set "ConnectionStrings:Migration" "Host=localhost;Port=5432;Database=unihub_workshop;Username=unihub;Password=unihub_dev_pwd;SSL Mode=Disable;Trust Server Certificate=true"
```

### 4.3 Set cac key bat buoc toi thieu cho backend

Van trong `src/Api/Api`, set JWT key (bat buoc):

```bash
dotnet user-secrets set "Jwt:Key" "REPLACE_THIS_WITH_A_REAL_SECRET_AT_LEAST_32_CHARS"
```

Neu muon test payment bang mock (khong can key PayOS that), bat mock:

```bash
dotnet user-secrets set "Payment:UseMock" "true"
dotnet user-secrets set "Payment:MockMode" "Success"
```

Neu muon test payment that voi PayOS, set them:

```bash
dotnet user-secrets set "Payment:PayOS:ClientId" "<PAYOS_CLIENT_ID>"
dotnet user-secrets set "Payment:PayOS:ApiKey" "<PAYOS_API_KEY>"
dotnet user-secrets set "Payment:PayOS:ChecksumKey" "<PAYOS_CHECKSUM_KEY>"
dotnet user-secrets set "Payment:PayOS:ReturnUrl" "http://localhost:5173/payment/result"
dotnet user-secrets set "Payment:PayOS:CancelUrl" "http://localhost:5173/payment/cancel"
dotnet user-secrets set "Payment:PayOS:WebhookUrl" "http://localhost:5186/api/payments/webhook/payos"
```

Neu can gui email that (khong bat buoc de chay local), set them:

```bash
dotnet user-secrets set "Email:SmtpHost" "smtp.gmail.com"
dotnet user-secrets set "Email:SmtpPort" "587"
dotnet user-secrets set "Email:Username" "<YOUR_GMAIL>"
dotnet user-secrets set "Email:Password" "<YOUR_GMAIL_APP_PASSWORD>"
dotnet user-secrets set "Email:FromAddress" "<YOUR_GMAIL>"
dotnet user-secrets set "Email:FromName" "UniHub Workshop"
dotnet user-secrets set "Email:EnableSsl" "true"
```

Kiem tra lai cac key da luu:

```bash
dotnet user-secrets list
```

## 5. Tao schema DB (migration)

Tu thu muc goc `UniHub`:

```bash
cd src/Api
```

Chay migration vao DB:

```bash
dotnet ef database update --project Infrastructure --startup-project Api
```

Neu may bao `dotnet-ef` chua co, cai them:

```bash
dotnet tool install --global dotnet-ef
dotnet ef database update --project Infrastructure --startup-project Api
```

## 6. Chay Backend API

Tu thu muc goc `UniHub`:

```bash
cd src/Api/Api
dotnet restore
dotnet build
dotnet run --launch-profile http
```

Khi chay thanh cong:

1. API: `http://localhost:5186`
2. Swagger: `http://localhost:5186/swagger`

## 7. Chay Web Student

Mo terminal moi, tu thu muc goc `UniHub`:

```bash
cd src/web/student
npm install
npm run dev
```

Web student doc o: `http://localhost:5173`

Ghi chu:

1. File `src/web/student/.env` da co `VITE_API_URL=http://localhost:5186/api`.
2. Neu API o may khac, sua lai `VITE_API_URL`.

## 8. Chay Web Admin

Mo terminal moi, tu thu muc goc `UniHub`:

```bash
cd src/web/admin
npm install
npm run dev -- --port 3002 --strictPort
```

Web admin: `http://localhost:3002`

Ghi chu:

1. File `src/web/admin/.env` da co `VITE_API_URL=http://localhost:5186/api`.
2. Neu API o may khac, sua lai `VITE_API_URL`.

## 9. Chay Mobile Check-in (Expo)

Mo terminal moi, tu thu muc goc `UniHub`:

```bash
cd src/mobile/check-in
npm install
npm start
```

Neu chay Android emulator:

```bash
npm run android
```

Bien API cho mobile:

1. App uu tien doc `EXPO_PUBLIC_API_URL`.
2. Neu khong set, app fallback:
   - Android emulator: `http://10.0.2.2:5186/api`
   - Platform khac: `http://localhost:5186/api`

Vi du set tam cho terminal hien tai (Git Bash):

```bash
export EXPO_PUBLIC_API_URL="http://localhost:5186/api"
npm start
```

## 10. Tai khoan test nhanh

He thong seed 1 tai khoan check-in staff khi startup:

1. Email: `checkin.seed@unihub.local`
2. Password: `Checkin@123`
3. Role: `CHECKIN_STAFF`

Ban co the tao them account organizer/student qua API:

1. `POST /api/auth/signup`
2. Hoac `POST /api/checkins/signup-staff` (can token organizer)

## 11. Thu tu chay day du khuyen nghi

1. Terminal 1: chay API (`src/Api/Api`).
2. Terminal 2: chay Web Student (`src/web/student`).
3. Terminal 3: chay Web Admin (`src/web/admin`).
4. Terminal 4: chay Mobile Check-in (`src/mobile/check-in`).

## 12. Loi thuong gap va cach xu ly nhanh

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

Kiem tra lai `ConnectionStrings:Default` da dung host/port/user/password chua.

3. Web goi API loi CORS:

- Dam bao web dang chay o localhost (`5173`, `3002`) hoac them origin vao config API.
- Dam bao `VITE_API_URL` tro dung API URL.

4. Mobile khong goi duoc API tren emulator:

- Dung `EXPO_PUBLIC_API_URL=http://10.0.2.2:5186/api` cho Android emulator.
- Dam bao may tinh va emulator truy cap cung host.

## 13. Tai lieu chi tiet

1. API auth/JWT: `docs/api_jwt.md`
2. API check-in: `docs/api_checkin.md`
3. API registration: `docs/api_registration.md`
4. API payment: `docs/api_payment.md`
5. Notification: `docs/api_notification.md`
6. Ghi chu ket noi DB Supabase: `src/Api/README_DB_CONNECTIONS.md`

---

Neu ban muon, co the bo sung tiep mot phan "One-command local run" bang `docker compose` + script `start-all` de team moi vao la chay ngay.
