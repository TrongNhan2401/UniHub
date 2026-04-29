using Application.Abstractions;
using Application.Features.Registrations;
using Domain;
using Domain.Entities;
using Infrastructure.Persistence.Contexts;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services
{
    public sealed class RegistrationService : IRegistrationService
    {
        private readonly AppDbContext _db;

        public RegistrationService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<CreateRegistrationResult> CreateAsync(
            CreateRegistrationCommand command,
            CancellationToken ct = default)
        {
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

            try
            {
                await _db.SaveChangesAsync(ct);
                await tx.CommitAsync(ct);
            }
            catch (DbUpdateException)
            {
                await tx.RollbackAsync(ct);
                throw new RegistrationDomainException(
                    StatusCodes.Status409Conflict,
                    "Xung dot du lieu.",
                    "Ban da dang ky workshop nay truoc do.");
            }

            return new CreateRegistrationResult
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
        }
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
