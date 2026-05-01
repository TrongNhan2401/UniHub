using Application.Abstractions.Repositories;
using Application.DTOs.Registration;
using Domain;
using Domain.Entities;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class RegistrationRepo : IRegistrationRepo
    {
        private readonly AppDbContext _context;

        public RegistrationRepo(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Registration registration)
        {
            await _context.Registrations.AddAsync(registration);
        }

        public async Task<Registration?> GetByIdAsync(Guid id, bool asNoTracking = true)
        {
            var query = BuildBaseQuery(asNoTracking);
            return await query.FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<Registration?> GetByUserWorkshopAsync(Guid userId, Guid workshopId, bool asNoTracking = true)
        {
            var query = BuildBaseQuery(asNoTracking);
            return await query.FirstOrDefaultAsync(r => r.UserId == userId && r.WorkshopId == workshopId);
        }

        public async Task<Registration?> GetByUserAndIdempotencyKeyAsync(Guid userId, string idempotencyKey, bool asNoTracking = true)
        {
            var query = BuildBaseQuery(asNoTracking);
            return await query.FirstOrDefaultAsync(r => r.UserId == userId && r.IdempotencyKey == idempotencyKey);
        }

        public async Task<List<Registration>> GetMineAsync(Guid userId)
        {
            return await BuildBaseQuery(asNoTracking: true)
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<(List<Registration> Items, int TotalCount)> GetPagedAsync(Guid? workshopId, RegistrationStatus? status, int pageNumber, int pageSize)
        {
            var query = BuildBaseQuery(asNoTracking: true).AsQueryable();

            if (workshopId.HasValue)
            {
                query = query.Where(r => r.WorkshopId == workshopId.Value);
            }

            if (status.HasValue)
            {
                query = query.Where(r => r.Status == status.Value);
            }

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, total);
        }

        public async Task<List<Registration>> GetConfirmedByWorkshopAsync(Guid workshopId)
        {
            return await BuildBaseQuery(asNoTracking: true)
                .Where(r => r.WorkshopId == workshopId && r.Status == RegistrationStatus.Confirmed)
                .OrderBy(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<RegistrationExportCsvRowDto>> GetExportRowsAsync(Guid workshopId)
        {
            return await BuildBaseQuery(asNoTracking: true)
                .Where(r => r.WorkshopId == workshopId)
                .OrderBy(r => r.CreatedAt)
                .Select(r => new RegistrationExportCsvRowDto
                {
                    RegistrationId = r.Id,
                    StudentId = r.User.StudentId,
                    StudentName = r.User.FullName,
                    Email = r.User.Email ?? string.Empty,
                    WorkshopTitle = r.Workshop.Title,
                    WorkshopStartTime = r.Workshop.StartTime,
                    RegistrationStatus = r.Status.ToString().ToUpper(),
                    PaymentStatus = r.Workshop.IsFree
                        ? "NOT_REQUIRED"
                        : (r.Payment == null ? "PENDING" : r.Payment.Status.ToString().ToUpper()),
                    RegisteredAt = r.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<bool> ExistsAsync(Guid id)
        {
            return await _context.Registrations.AnyAsync(r => r.Id == id);
        }

        private IQueryable<Registration> BuildBaseQuery(bool asNoTracking)
        {
            IQueryable<Registration> query = _context.Registrations
                .Include(r => r.User)
                .Include(r => r.Workshop)
                .Include(r => r.Payment)
                .Include(r => r.Attendance);

            if (asNoTracking)
            {
                query = query.AsNoTracking();
            }

            return query;
        }
    }
}