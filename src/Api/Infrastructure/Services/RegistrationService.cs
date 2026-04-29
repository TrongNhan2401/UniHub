using Application.Abstractions;
using Application.Features.Registrations;
using Domain;
using Domain.Entities;
using Infrastructure.Persistence.Contexts;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Infrastructure.Services
{
    public sealed class RegistrationService : IRegistrationService
    {
        private const string RegistrationCreateScope = "reg_create";
        private readonly AppDbContext _db;

        public RegistrationService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<CreateRegistrationResult> CreateAsync(
            CreateRegistrationCommand command,
            CancellationToken ct = default)
        {
            var scopedIdempotencyKey = BuildIdempotencyScopeKey(
                command.UserId,
                RegistrationCreateScope,
                command.IdempotencyKey);

            var replayResponse = await TryGetReplayResponseAsync(scopedIdempotencyKey, ct);
            if (replayResponse is not null)
            {
                return replayResponse;
            }

            var workshop = await _db.Workshops
                .AsNoTracking()
                .Where(w => w.Id == command.WorkshopId && !w.IsDeleted)
                .Select(w => new
                {
                    w.Id,
                    w.IsFree,
                    w.Status,
                    w.StartTime
                })
                .FirstOrDefaultAsync(ct);

            if (workshop is null)
            {
                throw new RegistrationDomainException(
                    StatusCodes.Status404NotFound,
                    "Khong tim thay tai nguyen.",
                    "Workshop khong ton tai.");
            }

            if (!workshop.IsFree)
            {
                throw new RegistrationDomainException(
                    StatusCodes.Status409Conflict,
                    "Xung dot du lieu.",
                    "Workshop co phi se duoc ho tro o slice paid flow.");
            }

            if (workshop.Status != WorkshopStatus.Published)
            {
                throw new RegistrationDomainException(
                    StatusCodes.Status409Conflict,
                    "Xung dot du lieu.",
                    "Workshop chua o trang thai mo dang ky.");
            }

            if (workshop.StartTime <= DateTime.UtcNow)
            {
                throw new RegistrationDomainException(
                    StatusCodes.Status409Conflict,
                    "Xung dot du lieu.",
                    "Workshop da bat dau hoac da ket thuc, khong the dang ky.");
            }

            var hasActiveRegistration = await _db.Registrations
                .AsNoTracking()
                .AnyAsync(r => r.UserId == command.UserId
                    && r.WorkshopId == command.WorkshopId
                    && !r.IsDeleted
                    && r.Status != RegistrationStatus.Cancelled,
                    ct);

            if (hasActiveRegistration)
            {
                throw new RegistrationDomainException(
                    StatusCodes.Status409Conflict,
                    "Xung dot du lieu.",
                    "Ban da dang ky workshop nay truoc do.");
            }

            await using var tx = await _db.Database.BeginTransactionAsync(ct);

            var rowsAffected = await _db.Workshops
                .Where(w => w.Id == command.WorkshopId
                    && !w.IsDeleted
                    && w.IsFree
                    && w.Status == WorkshopStatus.Published
                    && w.StartTime > DateTime.UtcNow
                    && w.RegisteredCount < w.TotalSlots)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(w => w.RegisteredCount, w => w.RegisteredCount + 1), ct);

            if (rowsAffected == 0)
            {
                await tx.RollbackAsync(ct);
                throw new RegistrationDomainException(
                    StatusCodes.Status409Conflict,
                    "Xung dot du lieu.",
                    "Workshop da het cho trong hoac khong con mo dang ky.");
            }

            var registration = new Registration
            {
                UserId = command.UserId,
                WorkshopId = command.WorkshopId,
                Status = RegistrationStatus.Confirmed,
                IdempotencyKey = command.IdempotencyKey
            };

            _db.Registrations.Add(registration);

            var response = new CreateRegistrationResult
            {
                RegistrationId = registration.Id,
                WorkshopId = registration.WorkshopId,
                Status = "CONFIRMED",
                Payment = null,
                Qr = new RegistrationQrResult
                {
                    Status = "PENDING"
                }
            };

            _db.IdempotencyRecords.Add(new IdempotencyRecord
            {
                Key = scopedIdempotencyKey,
                ResponseBody = JsonSerializer.Serialize(response),
                StatusCode = StatusCodes.Status201Created,
                ExpiresAt = DateTime.UtcNow.AddHours(24)
            });

            try
            {
                await _db.SaveChangesAsync(ct);
                await tx.CommitAsync(ct);
            }
            catch (DbUpdateException)
            {
                await tx.RollbackAsync(ct);

                // Request trùng có thể chạy đồng thời; nếu key đã được lưu thì phát lại response cũ.
                var replayAfterConflict = await TryGetReplayResponseAsync(scopedIdempotencyKey, ct);
                if (replayAfterConflict is not null)
                {
                    return replayAfterConflict;
                }

                throw new RegistrationDomainException(
                    StatusCodes.Status409Conflict,
                    "Xung dot du lieu.",
                    "Ban da dang ky workshop nay truoc do.");
            }

            return response;
        }

        public async Task<MyRegistrationsResult> GetMyRegistrationsAsync(
            Guid userId,
            CancellationToken ct = default)
        {
            var items = await _db.Registrations
                .AsNoTracking()
                .Where(r => r.UserId == userId
                    && !r.IsDeleted
                    && !r.Workshop.IsDeleted)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new MyRegistrationItem
                {
                    RegistrationId = r.Id,
                    WorkshopId = r.WorkshopId,
                    WorkshopTitle = r.Workshop.Title,
                    StartTime = r.Workshop.StartTime,
                    Status = MapRegistrationStatus(r.Status),
                    PaymentStatus = r.Payment != null
                        ? MapPaymentStatus(r.Payment.Status)
                        : null,
                    QrStatus = ResolveQrStatus(r.Status, r.QrCode)
                })
                .ToListAsync(ct);

            return new MyRegistrationsResult
            {
                Items = items
            };
        }

        public async Task<CancelRegistrationResult> CancelAsync(
            Guid userId,
            Guid registrationId,
            CancellationToken ct = default)
        {
            var registration = await _db.Registrations
                .AsNoTracking()
                .Where(r => r.Id == registrationId
                    && r.UserId == userId
                    && !r.IsDeleted)
                .Select(r => new
                {
                    r.Id,
                    r.WorkshopId,
                    r.Status
                })
                .FirstOrDefaultAsync(ct);

            if (registration is null)
            {
                throw new RegistrationDomainException(
                    StatusCodes.Status404NotFound,
                    "Khong tim thay tai nguyen.",
                    "Khong tim thay registration cua ban.");
            }

            if (registration.Status == RegistrationStatus.Cancelled)
            {
                throw new RegistrationDomainException(
                    StatusCodes.Status409Conflict,
                    "Xung dot du lieu.",
                    "Registration da duoc huy truoc do.");
            }

            await using var tx = await _db.Database.BeginTransactionAsync(ct);

            var updatedRegistrations = await _db.Registrations
                .Where(r => r.Id == registrationId
                    && r.UserId == userId
                    && !r.IsDeleted
                    && r.Status != RegistrationStatus.Cancelled)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(r => r.Status, RegistrationStatus.Cancelled), ct);

            if (updatedRegistrations == 0)
            {
                await tx.RollbackAsync(ct);
                throw new RegistrationDomainException(
                    StatusCodes.Status409Conflict,
                    "Xung dot du lieu.",
                    "Registration da duoc huy truoc do.");
            }

            if (ShouldReleaseSlot(registration.Status))
            {
                await _db.Workshops
                    .Where(w => w.Id == registration.WorkshopId
                        && !w.IsDeleted
                        && w.RegisteredCount > 0)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(w => w.RegisteredCount, w => w.RegisteredCount - 1), ct);
            }

            await tx.CommitAsync(ct);

            return new CancelRegistrationResult
            {
                RegistrationId = registrationId,
                Status = "CANCELLED"
            };
        }

        private async Task<CreateRegistrationResult?> TryGetReplayResponseAsync(
            string scopedIdempotencyKey,
            CancellationToken ct)
        {
            var record = await _db.IdempotencyRecords
                .AsNoTracking()
                .Where(x => x.Key == scopedIdempotencyKey && x.ExpiresAt > DateTime.UtcNow)
                .Select(x => new { x.ResponseBody })
                .FirstOrDefaultAsync(ct);

            if (record is null)
            {
                return null;
            }

            return JsonSerializer.Deserialize<CreateRegistrationResult>(record.ResponseBody);
        }

        private static string BuildIdempotencyScopeKey(Guid userId, string endpoint, string idempotencyKey)
        {
            var normalized = idempotencyKey.Trim();
            var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));
            var hash = Convert.ToHexString(hashBytes.AsSpan(0, 16));

            return $"idem:{endpoint}:{userId:N}:{hash}";
        }

        private static string MapRegistrationStatus(RegistrationStatus status) => status switch
        {
            RegistrationStatus.Pending => "PENDING",
            RegistrationStatus.Confirmed => "CONFIRMED",
            RegistrationStatus.Cancelled => "CANCELLED",
            RegistrationStatus.WaitListed => "WAITLISTED",
            RegistrationStatus.PendingPayment => "PENDING_PAYMENT",
            RegistrationStatus.PaymentFailed => "PAYMENT_FAILED",
            _ => "UNKNOWN"
        };

        private static string MapPaymentStatus(PaymentStatus status) => status switch
        {
            PaymentStatus.Pending => "PENDING",
            PaymentStatus.Completed => "PAID",
            PaymentStatus.Failed => "FAILED",
            PaymentStatus.Refunded => "REFUNDED",
            PaymentStatus.Timeout => "TIMEOUT",
            _ => "UNKNOWN"
        };

        private static string ResolveQrStatus(RegistrationStatus status, string? qrCode)
        {
            if (status == RegistrationStatus.Cancelled)
            {
                return "DISABLED";
            }

            return string.IsNullOrWhiteSpace(qrCode)
                ? "PENDING"
                : "READY";
        }

        private static bool ShouldReleaseSlot(RegistrationStatus status) => status switch
        {
            RegistrationStatus.Confirmed => true,
            RegistrationStatus.Pending => true,
            RegistrationStatus.PendingPayment => true,
            _ => false
        };
    }

    public sealed class RegistrationDomainException : Exception
    {
        public RegistrationDomainException(int statusCode, string title, string detail)
            : base(detail)
        {
            StatusCode = statusCode;
            Title = title;
            Detail = detail;
        }

        public int StatusCode { get; }
        public string Title { get; }
        public string Detail { get; }
    }
}
