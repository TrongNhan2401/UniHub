using Application.Abstractions.Repositories;
using Domain.Entities;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class AttendanceRepo : IAttendanceRepo
    {
        private readonly AppDbContext _context;

        public AttendanceRepo(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Attendance attendance)
        {
            await _context.Attendances.AddAsync(attendance);
        }

        public async Task<Attendance?> GetByRegistrationIdAsync(Guid registrationId, bool asNoTracking = true)
        {
            var query = BuildBaseQuery(asNoTracking);
            return await query.FirstOrDefaultAsync(a => a.RegistrationId == registrationId);
        }

        public async Task<bool> ExistsByRegistrationIdAsync(Guid registrationId)
        {
            return await _context.Attendances.AnyAsync(a => a.RegistrationId == registrationId);
        }

        public async Task<(List<Attendance> Items, int TotalCount)> GetByWorkshopPagedAsync(Guid workshopId, int pageNumber, int pageSize)
        {
            var query = BuildBaseQuery(asNoTracking: true)
                .Where(a => a.WorkshopId == workshopId)
                .OrderByDescending(a => a.CheckedInAt);

            var total = await query.CountAsync();
            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, total);
        }

        private IQueryable<Attendance> BuildBaseQuery(bool asNoTracking)
        {
            IQueryable<Attendance> query = _context.Attendances
                .Include(a => a.Registration)
                    .ThenInclude(r => r.User)
                .Include(a => a.Workshop)
                .Include(a => a.User);

            if (asNoTracking)
            {
                query = query.AsNoTracking();
            }

            return query;
        }
    }
}