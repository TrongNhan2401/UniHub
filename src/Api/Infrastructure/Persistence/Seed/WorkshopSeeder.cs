using Domain;
using Domain.Entities;
using Infrastructure.Persistence.Contexts;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Infrastructure.Persistence.Seed
{
    public static class WorkshopSeeder
    {
        private const string SeedMarkerKey = "seed:workshop:v2";

        public static async Task SeedAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken = default)
        {
            using var scope = serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
            var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("WorkshopSeeder");

            // Marker giúp seed chỉ chạy hiệu lực 1 lần, nhưng vẫn cho phép nâng cấp seed cũ chưa có marker.
            var seedDone = await db.IdempotencyRecords
                .AsNoTracking()
                .AnyAsync(x => x.Key == SeedMarkerKey, cancellationToken);

            if (seedDone)
            {
                logger.LogInformation("Workshop seed marker already exists. Skipping seed.");
                return;
            }

            var organizer = await EnsureUserAsync(
                email: "organizer.seed@unihub.local",
                fullName: "UniHub Organizer (Seed)",
                role: UserRole.Organizer,
                roleName: SystemRoleSeeder.Organizer,
                password: "Organizer@123",
                studentId: "ORG-0001");

            _ = await EnsureUserAsync(
                email: "checkin.seed@unihub.local",
                fullName: "UniHub Checkin Staff (Seed)",
                role: UserRole.CheckInStaff,
                roleName: SystemRoleSeeder.CheckInStaff,
                password: "Checkin@123",
                studentId: "CHK-0001");

            var students = new Dictionary<string, AppUser>();
            for (var i = 1; i <= 12; i++)
            {
                var email = $"student{i:00}.seed@unihub.local";
                var student = await EnsureUserAsync(
                    email: email,
                    fullName: $"Sinh vien seed {i:00}",
                    role: UserRole.Student,
                    roleName: SystemRoleSeeder.Student,
                    password: "Student@123",
                    studentId: $"SEED{i:0000}");

                students[email] = student;
            }

            var now = DateTime.UtcNow;
            var workshopDefinitions = new[]
            {
                new WorkshopDefinition("AI Cơ Bản Cho Sinh Viên", "Workshop giới thiệu các khái niệm AI/ML cơ bản, ứng dụng thực tế và lộ trình học tập cho sinh viên mới bắt đầu.", "TS. Trần Minh Khoa", "Tiến sĩ AI tại ĐH Bách Khoa TP.HCM, 8 năm kinh nghiệm nghiên cứu.", "A101", now.AddDays(2).Date.AddHours(8), now.AddDays(2).Date.AddHours(10), 60, true, 0, WorkshopStatus.Published, "https://maps.unihub.local/rooms/A101", "https://cdn.unihub.local/pdf/ai-co-ban.pdf", "Tóm tắt: Giới thiệu AI cơ bản và các case study thực tế."),
                new WorkshopDefinition("Clinic CV Xin Việc 2026", "Chuyên gia HR hướng dẫn viết CV, chuẩn bị phỏng vấn và định hướng nghề nghiệp cho sinh viên năm cuối.", "Nguyễn Thị Anh Thư", "HR Manager tại FPT Software với 10 năm kinh nghiệm tuyển dụng.", "B201", now.AddDays(3).Date.AddHours(14), now.AddDays(3).Date.AddHours(16), 80, false, 50000, WorkshopStatus.Published, "https://maps.unihub.local/rooms/B201", "https://cdn.unihub.local/pdf/clinic-cv.pdf", "Tóm tắt: Checklist CV ATS, kỹ thuật phỏng vấn STAR, portfolio."),
                new WorkshopDefinition("React Native Bootcamp", "Workshop thực hành xây dựng app mobile cross-platform với React Native từ zero đến demo.", "Lê Văn Kiên", "Senior Mobile Engineer tại Grab Vietnam.", "C301", now.AddDays(5).Date.AddHours(8), now.AddDays(5).Date.AddHours(12), 50, false, 100000, WorkshopStatus.Published, "https://maps.unihub.local/rooms/C301", "https://cdn.unihub.local/pdf/react-native-bootcamp.pdf", "Tóm tắt: Setup, navigation, state management, build APK demo."),
                new WorkshopDefinition("Open Source và GitHub cho Người Mới", "Hướng dẫn đóng góp vào dự án open source, sử dụng Git nâng cao và xây dựng portfolio GitHub.", "Phạm Đức Long", "Contributor tại nhiều dự án OSS lớn trên GitHub.", "D102", now.AddDays(7).Date.AddHours(9), now.AddDays(7).Date.AddHours(11), 100, true, 0, WorkshopStatus.Published, "https://maps.unihub.local/rooms/D102", "https://cdn.unihub.local/pdf/open-source-github.pdf", "Tóm tắt: Chọn issue, quy trình PR, chuẩn commit message."),
                new WorkshopDefinition("Workshop Blockchain Nâng Cao", "Đi sâu vào smart contract, DeFi và ứng dụng blockchain trong doanh nghiệp.", "Trần Hữu Đức", "Blockchain Architect tại Tomochain.", "E201", now.AddDays(10).Date.AddHours(13), now.AddDays(10).Date.AddHours(16), 40, false, 200000, WorkshopStatus.Draft, "https://maps.unihub.local/rooms/E201", "https://cdn.unihub.local/pdf/blockchain-nang-cao.pdf", "Tóm tắt: EVM, smart contract audit và use case doanh nghiệp."),
                new WorkshopDefinition("Data Analyst Từ Con Số Đến Insight", "Phân tích dữ liệu bằng SQL, dashboard và storytelling cho sinh viên mới đi làm.", "Đinh Gia Hân", "Data Lead tại Tiki.", "A203", now.AddDays(12).Date.AddHours(8), now.AddDays(12).Date.AddHours(11), 70, false, 75000, WorkshopStatus.Published, "https://maps.unihub.local/rooms/A203", "https://cdn.unihub.local/pdf/data-analyst-insight.pdf", "Tóm tắt: SQL thực chiến, dashboard KPI, data storytelling."),
                new WorkshopDefinition("Kỹ Năng Thuyết Trình Cho Kỹ Sư", "Kỹ thuật trình bày ý tưởng kỹ thuật cho PM, khách hàng và hội đồng chuyên môn.", "Phan Nhật Nam", "Engineering Manager tại NashTech.", "B105", now.AddDays(14).Date.AddHours(13), now.AddDays(14).Date.AddHours(15), 90, true, 0, WorkshopStatus.Published, "https://maps.unihub.local/rooms/B105", "https://cdn.unihub.local/pdf/thuyet-trinh-ky-su.pdf", "Tóm tắt: Cấu trúc bài nói, xử lý Q&A, demo hiệu quả."),
                new WorkshopDefinition("Kiến Trúc Microservices Cơ Bản", "Nền tảng thiết kế microservices, giao tiếp service và chiến lược observability.", "Vũ Hoàng Duy", "Solution Architect tại KMS Technology.", "C210", now.AddDays(16).Date.AddHours(9), now.AddDays(16).Date.AddHours(12), 55, false, 120000, WorkshopStatus.Published, "https://maps.unihub.local/rooms/C210", "https://cdn.unihub.local/pdf/microservices-co-ban.pdf", "Tóm tắt: API gateway, saga pattern, logging và tracing."),
                new WorkshopDefinition("Mô Phỏng Phỏng Vấn Fresher", "Buổi mock interview 1-1 giúp sinh viên luyện phản xạ và hoàn thiện kỹ năng phỏng vấn.", "Trương Mỹ Linh", "Tech Recruiter tại VNG.", "D305", now.AddDays(18).Date.AddHours(8), now.AddDays(18).Date.AddHours(11), 45, false, 30000, WorkshopStatus.Published, "https://maps.unihub.local/rooms/D305", "https://cdn.unihub.local/pdf/mock-interview-fresher.pdf", "Tóm tắt: Câu hỏi thường gặp, phản hồi chi tiết theo từng ứng viên."),
                new WorkshopDefinition("Nền Tảng Kubernetes Trong 1 Buổi", "Giải thích kiến trúc K8s, deployment cơ bản và vận hành pod/service trên cluster.", "Đoàn Quốc Huy", "DevOps Engineer tại Shopee.", "E110", now.AddDays(20).Date.AddHours(13), now.AddDays(20).Date.AddHours(16), 65, false, 90000, WorkshopStatus.Published, "https://maps.unihub.local/rooms/E110", "https://cdn.unihub.local/pdf/kubernetes-1-buoi.pdf", "Tóm tắt: Pod, service, deployment, configmap và autoscaling."),
                new WorkshopDefinition("Design Thinking Cho Sản Phẩm Số", "Tư duy thiết kế lấy người dùng làm trung tâm và quy trình thử nghiệm nhanh.", "Lâm Khánh Vy", "Product Designer tại MoMo.", "A305", now.AddDays(-4).Date.AddHours(9), now.AddDays(-4).Date.AddHours(11), 120, true, 0, WorkshopStatus.Completed, "https://maps.unihub.local/rooms/A305", "https://cdn.unihub.local/pdf/design-thinking.pdf", "Tóm tắt: Persona, user journey, prototype nhanh và test giả thuyết.")
            };

            var workshopsByTitle = new Dictionary<string, Workshop>(StringComparer.Ordinal);
            foreach (var def in workshopDefinitions)
            {
                var workshop = await db.Workshops.FirstOrDefaultAsync(w => w.Title == def.Title, cancellationToken);

                if (workshop is null)
                {
                    workshop = new Workshop();
                    db.Workshops.Add(workshop);
                }

                workshop.Title = def.Title;
                workshop.Description = def.Description;
                workshop.SpeakerName = def.SpeakerName;
                workshop.SpeakerBio = def.SpeakerBio;
                workshop.Room = def.Room;
                workshop.RoomMapUrl = def.RoomMapUrl;
                workshop.PdfUrl = def.PdfUrl;
                workshop.AiSummary = def.AiSummary;
                workshop.AiSummaryGeneratedAt = DateTime.UtcNow;
                workshop.StartTime = def.StartTime;
                workshop.EndTime = def.EndTime;
                workshop.TotalSlots = def.TotalSlots;
                workshop.IsFree = def.IsFree;
                workshop.Price = def.Price;
                workshop.Status = def.Status;
                workshop.CreatedByUserId = organizer.Id;

                workshopsByTitle[def.Title] = workshop;
            }

            await db.SaveChangesAsync(cancellationToken);

            var registrationDefinitions = new[]
            {
                new RegistrationDefinition("student01.seed@unihub.local", "AI Cơ Bản Cho Sinh Viên", RegistrationStatus.Confirmed, false),
                new RegistrationDefinition("student02.seed@unihub.local", "AI Cơ Bản Cho Sinh Viên", RegistrationStatus.Confirmed, false),
                new RegistrationDefinition("student03.seed@unihub.local", "AI Cơ Bản Cho Sinh Viên", RegistrationStatus.Pending, false),
                new RegistrationDefinition("student04.seed@unihub.local", "Clinic CV Xin Việc 2026", RegistrationStatus.Confirmed, true),
                new RegistrationDefinition("student05.seed@unihub.local", "Clinic CV Xin Việc 2026", RegistrationStatus.Confirmed, true),
                new RegistrationDefinition("student06.seed@unihub.local", "Clinic CV Xin Việc 2026", RegistrationStatus.Cancelled, false),
                new RegistrationDefinition("student01.seed@unihub.local", "React Native Bootcamp", RegistrationStatus.Confirmed, true),
                new RegistrationDefinition("student07.seed@unihub.local", "React Native Bootcamp", RegistrationStatus.Pending, false),
                new RegistrationDefinition("student08.seed@unihub.local", "Open Source và GitHub cho Người Mới", RegistrationStatus.Confirmed, false),
                new RegistrationDefinition("student09.seed@unihub.local", "Open Source và GitHub cho Người Mới", RegistrationStatus.Confirmed, false),
                new RegistrationDefinition("student10.seed@unihub.local", "Data Analyst Từ Con Số Đến Insight", RegistrationStatus.Confirmed, true),
                new RegistrationDefinition("student11.seed@unihub.local", "Data Analyst Từ Con Số Đến Insight", RegistrationStatus.Pending, false),
                new RegistrationDefinition("student12.seed@unihub.local", "Kỹ Năng Thuyết Trình Cho Kỹ Sư", RegistrationStatus.Confirmed, false),
                new RegistrationDefinition("student03.seed@unihub.local", "Kiến Trúc Microservices Cơ Bản", RegistrationStatus.Confirmed, true),
                new RegistrationDefinition("student04.seed@unihub.local", "Mô Phỏng Phỏng Vấn Fresher", RegistrationStatus.Pending, false),
                new RegistrationDefinition("student05.seed@unihub.local", "Nền Tảng Kubernetes Trong 1 Buổi", RegistrationStatus.Confirmed, true),
                new RegistrationDefinition("student06.seed@unihub.local", "Design Thinking Cho Sản Phẩm Số", RegistrationStatus.Confirmed, false, true),
                new RegistrationDefinition("student07.seed@unihub.local", "Design Thinking Cho Sản Phẩm Số", RegistrationStatus.Confirmed, false, true)
            };

            var registrationByUserWorkshop = new Dictionary<(Guid UserId, Guid WorkshopId), Registration>();
            foreach (var def in registrationDefinitions)
            {
                var user = students[def.StudentEmail];
                var workshop = workshopsByTitle[def.WorkshopTitle];

                var registration = await db.Registrations
                    .Include(r => r.Payment)
                    .Include(r => r.Attendance)
                    .FirstOrDefaultAsync(r => r.UserId == user.Id && r.WorkshopId == workshop.Id, cancellationToken);

                if (registration is null)
                {
                    registration = new Registration
                    {
                        UserId = user.Id,
                        WorkshopId = workshop.Id
                    };
                    db.Registrations.Add(registration);
                }

                registration.Status = def.Status;
                registration.QrToken = $"qr-{workshop.Id:N}-{user.Id:N}";
                registration.QrCode = $"UNI-{workshop.Id.ToString("N")[..8]}-{user.Id.ToString("N")[..8]}";
                registration.IdempotencyKey = $"seed-reg-{workshop.Id:N}-{user.Id:N}";

                registrationByUserWorkshop[(user.Id, workshop.Id)] = registration;
            }

            await db.SaveChangesAsync(cancellationToken);

            foreach (var def in registrationDefinitions.Where(x => x.WithPayment))
            {
                var user = students[def.StudentEmail];
                var workshop = workshopsByTitle[def.WorkshopTitle];
                var registration = registrationByUserWorkshop[(user.Id, workshop.Id)];

                if (workshop.IsFree)
                {
                    continue;
                }

                var payment = registration.Payment;
                if (payment is null)
                {
                    payment = new Payment
                    {
                        RegistrationId = registration.Id,
                        UserId = user.Id
                    };
                    db.Payments.Add(payment);
                }

                payment.Amount = workshop.Price;
                payment.Status = registration.Status == RegistrationStatus.Confirmed
                    ? PaymentStatus.Completed
                    : PaymentStatus.Pending;
                payment.IdempotencyKey = $"seed-pay-{registration.Id:N}";
                payment.GatewayTransactionId = $"SEED-TXN-{registration.Id.ToString("N")[..12]}";
                payment.GatewayResponse = "{\"source\":\"seed\",\"ok\":true}";
                payment.RetryCount = 0;
                payment.PaidAt = payment.Status == PaymentStatus.Completed ? DateTime.UtcNow.AddDays(-1) : null;
                payment.ExpiredAt = DateTime.UtcNow.AddDays(2);
            }

            foreach (var def in registrationDefinitions.Where(x => x.WithAttendance))
            {
                var user = students[def.StudentEmail];
                var workshop = workshopsByTitle[def.WorkshopTitle];
                var registration = registrationByUserWorkshop[(user.Id, workshop.Id)];

                if (registration.Status != RegistrationStatus.Confirmed)
                {
                    continue;
                }

                var attendance = registration.Attendance;
                if (attendance is null)
                {
                    attendance = new Attendance
                    {
                        RegistrationId = registration.Id,
                        UserId = user.Id,
                        WorkshopId = workshop.Id
                    };
                    db.Attendances.Add(attendance);
                }

                attendance.Status = AttendanceStatus.CheckedIn;
                attendance.CheckedInAt = workshop.StartTime.AddMinutes(10);
                attendance.IsSyncedFromOffline = false;
                attendance.OfflineDeviceId = null;
            }

            foreach (var workshop in workshopsByTitle.Values)
            {
                workshop.RegisteredCount = await db.Registrations
                    .CountAsync(r => r.WorkshopId == workshop.Id && r.Status == RegistrationStatus.Confirmed, cancellationToken);
            }

            var summary = new
            {
                Workshops = workshopsByTitle.Count,
                Students = students.Count,
                Registrations = registrationDefinitions.Length,
                CompletedAtUtc = DateTime.UtcNow
            };

            db.IdempotencyRecords.Add(new IdempotencyRecord
            {
                Key = SeedMarkerKey,
                ResponseBody = JsonSerializer.Serialize(summary),
                StatusCode = StatusCodes.Status201Created,
                ExpiresAt = DateTime.UtcNow.AddYears(20)
            });

            await db.SaveChangesAsync(cancellationToken);

            logger.LogInformation(
                "Seed completed: {WorkshopCount} workshops, {StudentCount} students, {RegistrationCount} registrations.",
                workshopsByTitle.Count,
                students.Count,
                registrationDefinitions.Length);

            async Task<AppUser> EnsureUserAsync(
                string email,
                string fullName,
                UserRole role,
                string roleName,
                string password,
                string studentId)
            {
                var user = await userManager.FindByEmailAsync(email);
                if (user is null)
                {
                    user = new AppUser
                    {
                        UserName = email,
                        Email = email,
                        FullName = fullName,
                        EmailConfirmed = true,
                        Role = role,
                        StudentId = studentId
                    };

                    var createResult = await userManager.CreateAsync(user, password);
                    if (!createResult.Succeeded)
                    {
                        var createErrors = string.Join("; ", createResult.Errors.Select(e => $"{e.Code}: {e.Description}"));
                        throw new InvalidOperationException($"WorkshopSeeder: Không tạo được user {email}. {createErrors}");
                    }

                    logger.LogInformation("Seeded user account: {Email}", email);
                }
                else
                {
                    user.FullName = fullName;
                    user.Role = role;
                    user.StudentId = studentId;
                    user.EmailConfirmed = true;

                    var updateResult = await userManager.UpdateAsync(user);
                    if (!updateResult.Succeeded)
                    {
                        var updateErrors = string.Join("; ", updateResult.Errors.Select(e => $"{e.Code}: {e.Description}"));
                        throw new InvalidOperationException($"WorkshopSeeder: Không cập nhật được user {email}. {updateErrors}");
                    }
                }

                if (!await userManager.IsInRoleAsync(user, roleName))
                {
                    var addRoleResult = await userManager.AddToRoleAsync(user, roleName);
                    if (!addRoleResult.Succeeded)
                    {
                        var roleErrors = string.Join("; ", addRoleResult.Errors.Select(e => $"{e.Code}: {e.Description}"));
                        throw new InvalidOperationException($"WorkshopSeeder: Không gán được role {roleName} cho {email}. {roleErrors}");
                    }
                }

                return user;
            }
        }

        private sealed record WorkshopDefinition(
            string Title,
            string Description,
            string SpeakerName,
            string SpeakerBio,
            string Room,
            DateTime StartTime,
            DateTime EndTime,
            int TotalSlots,
            bool IsFree,
            decimal Price,
            WorkshopStatus Status,
            string RoomMapUrl,
            string PdfUrl,
            string AiSummary);

        private sealed record RegistrationDefinition(
            string StudentEmail,
            string WorkshopTitle,
            RegistrationStatus Status,
            bool WithPayment,
            bool WithAttendance = false);
    }
}
