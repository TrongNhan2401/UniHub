# Admin API Checklist

Cap nhat: 2026-05-09

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

## 5) API service da khai bao va su dung

- [x] `workshopService.getAll` (WorkshopsPage + DashboardPage)
- [x] `workshopService.getById` (WorkshopDetailPage)
- [x] `workshopService.create` (WorkshopsPage + CreateWorkshopModal)
- [x] `workshopService.update` (WorkshopDetailPage + WorkshopsPage)
- [x] `workshopService.cancel` (WorkshopDetailPage + WorkshopsPage)
- [x] `workshopService.publish` (co method, chua dung tren UI)
- [x] `workshopService.uploadPdf` (WorkshopDetailPage)
- [ ] `registrationService.getAll` (danh sach dang ky - trong WorkshopDetailPage)
- [ ] `registrationService.exportCsv` (export CSV)

## 6) Uu tien tiep theo de hoan thien

- [x] Noi WorkshopsPage vao `workshopService.getAll` + pagination that
- [x] Noi tao workshop modal vao `workshopService.create`
- [x] Noi sua workshop vao `workshopService.update`
- [x] Noi huy workshop vao `workshopService.cancel`
- [x] Noi WorkshopDetailPage vao API workshop + registrations + checkins + PDF upload
- [ ] Noi CalendarPage vao workshop API theo ngay/thang
- [x] Thay so lieu metric Dashboard bang du lieu API workshops

## 7) Phase 1 Hoan thanh - Ket noi cao cap API cho admin

**Date**: 2026-05-09

Da thuc hien thanh cong:

- Authentication: JWT login, auto-attach Bearer token, auto-logout on 401
- Workshop CRUD: List (pagination + search), Create, Update, Cancel
- Dashboard: Real metrics from API workshops
- Detail page: Full integration with edit modal, PDF upload, registrations/attendances display
- Build: npm build PASS (✓ 1696 modules, 0 errors)
- Git: All changes committed to feat/admin branch

Next phase: Calendar page + Registration export

## 7) Script chay nhanh de test

- [ ] Backend: `cd src/Api/Api && dotnet run`
- [ ] Admin web: `cd src/web/admin && npm run dev -- --port 3002 --strictPort`
- [ ] Login test: `organizer.seed@unihub.local / Organizer@123`
