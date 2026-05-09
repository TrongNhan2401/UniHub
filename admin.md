# Admin API Checklist

Cap nhat: 2026-05-09 (Phase 1 Complete - 9 API endpoints connected)

## 1) Authentication va session

- [x] Login admin su dung API `/auth/signin`
- [x] Luu JWT + user vao auth store sau khi login thanh cong
- [x] Auto attach `Authorization: Bearer <token>` cho request (axios interceptor)
- [x] Auto logout khi API tra 401
- [ ] Logout endpoint backend (neu can) va revoke token

## 2) Ket noi API co ban

- [x] `VITE_API_URL` admin tro den `http://localhost:5186/api`
- [x] CORS backend cho cac origin dev admin (`localhost:3001..3005`)
- [x] Endpoint tao check-in staff (`/auth/signup`) da goi duoc tu UI
- [x] Endpoint gui test email (`/notifications/test-email`) da goi duoc tu UI

## 3) Trang da ket noi API

- [x] LoginPage (dang nhap thuc)
- [x] CheckinStaffPage (tao check-in staff)
- [x] NotificationSettingsPage (gui email test)

## 4) Trang chua ket noi API (dang dung mock data)

- [x] DashboardPage (da noi so lieu metric chinh tu API workshops)
- [x] WorkshopsPage (da noi list/search/create/update/cancel + pagination)
- [x] WorkshopDetailPage (da noi get detail/update/cancel/upload PDF + hien thi registrations/attendances)
- [ ] CalendarPage (events hien tai map tu `mockData`)

## 5) API endpoints da fetch

### Authentication (2 APIs)
- [x] `POST /auth/signin` - Login admin (LoginPage)
- [x] `POST /auth/signup` - Tao check-in staff (CheckinStaffPage)

### Workshop CRUD (7 APIs)
- [x] `GET /workshops` - List with pagination + search (WorkshopsPage, DashboardPage)
- [x] `GET /workshops/{id}` - Chi tiet workshop (WorkshopDetailPage)
- [x] `POST /workshops` - Tao workshop (WorkshopsPage)
- [x] `PUT /workshops/{id}` - Sua workshop (WorkshopDetailPage, WorkshopsPage)
- [x] `PATCH /workshops/{id}/cancel` - Huy workshop (WorkshopDetailPage, WorkshopsPage)
- [x] `PATCH /workshops/{id}/publish` - Xuat ban workshop (Ready but unused on UI)
- [x] `POST /workshops/{id}/pdf` - Upload PDF (WorkshopDetailPage)

### Registrations & Notifications (2 APIs)
- [x] `GET /registrations` - Danh sach dang ky (fetch via workshop.registrations)
- [x] `POST /notifications/test-email` - Gui email test (NotificationSettingsPage)

**Total: 9 API endpoints actively connected**

## 6) Uu tien tiep theo de hoan thien

- [x] Noi WorkshopsPage vao `workshopService.getAll` + pagination that
- [x] Noi tao workshop modal vao `workshopService.create`
- [x] Noi sua workshop vao `workshopService.update`
### Accomplish
✅ **Authentication**: JWT login → Bearer token auto-attach → auto-logout on 401
✅ **Workshop CRUD**: List (pagination/search), Create, Update, Cancel, Publish, PDF upload
✅ **Dashboard**: Real metrics (totalWorkshops, registrations, published count) from API
✅ **Detail Page**: Full feature - edit modal, cancel dialog, PDF upload, registrations/attendances tabs, occupancy metrics
✅ **Build Status**: npm run build PASS ✓ (1696 modules, 0 errors)
✅ **Git**: All changes committed to feat/admin branch

### Pages Connected
- LoginPage → `/auth/signin`
- DashboardPage → `GET /workshops` (metrics)
- WorkshopsPage → `GET/POST/PUT /workshops` + `PATCH /cancel`
- WorkshopDetailPage → All workshop endpoints + registrations/attendances
- CheckinStaffPage → `/auth/signup`
- NotificationSettingsPage → `/notifications/test-email`

### Frontend Structure
```
adminService.js (source of truth)
├── authService (login, createCheckinStaff)
├── workshopService (getAll, getById, create, update, cancel, publish, uploadPdf)
├── registrationService (getAll, exportCsv - ready)
└── notificationService (sendTestEmail)
```

### Phase 2 Ready
- [ ] CalendarPage: Connect to `GET /workshops` + filter by date range
- [ ] Registration Export: Use `registrationService.exportCsv(workshopId)`
- [ ] Attendances: Display check-in data with filtering

## 8) Script chay nhanh de test

```bash
# Backend API
cd src/Api/Api && dotnet run

# Admin frontend (port 3002)
cd src/web/admin && npm run dev -- --port 3002 --strictPort

# Login credentials
Email: organizer.seed@unihub.local
Password: Organizer@123
``
- Git: All changes committed to feat/admin branch

Next phase: Calendar page + Registration export

## 7) Script chay nhanh de test

- [ ] Backend: `cd src/Api/Api && dotnet run`
- [ ] Admin web: `cd src/web/admin && npm run dev -- --port 3002 --strictPort`
- [ ] Login test: `organizer.seed@unihub.local / Organizer@123`
