using Application.Abstractions.Repositories;
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

        public async Task<Registration?> GetByIdAsync(Guid registrationId)
        {
            return await _context.Registrations
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == registrationId);
        }

        public async Task<Registration?> GetByIdWithWorkshopAsync(Guid registrationId)
        {
            return await _context.Registrations
                .Include(r => r.Workshop)
                .Include(r => r.Payment)
                .FirstOrDefaultAsync(r => r.Id == registrationId);
        }

        public async Task<List<Registration>> GetByUserIdAsync(Guid userId)
        {
            return await _context.Registrations
                .AsNoTracking()
                .Include(r => r.Workshop)
                .Include(r => r.Payment)
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<Registration?> GetByUserAndWorkshopAsync(Guid userId, Guid workshopId)
        {
            return await _context.Registrations
                .FirstOrDefaultAsync(r => r.UserId == userId && r.WorkshopId == workshopId && r.Status != Domain.RegistrationStatus.Cancelled);
        }

        public async Task<Registration?> GetByIdempotencyKeyAsync(Guid userId, string idempotencyKey)
        {
            return await _context.Registrations
                .Include(r => r.Workshop)
                .Include(r => r.Payment)
                .FirstOrDefaultAsync(r => r.UserId == userId && r.IdempotencyKey == idempotencyKey);
        }

        public async Task<Workshop?> GetWorkshopForUpdateAsync(Guid workshopId)
        {
            return await _context.Workshops
                .FirstOrDefaultAsync(w => w.Id == workshopId);
        }
    }
}
