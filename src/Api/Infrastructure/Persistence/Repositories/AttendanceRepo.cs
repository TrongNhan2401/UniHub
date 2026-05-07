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

        public async Task<Attendance?> GetByRegistrationIdAsync(Guid registrationId)
        {
            return await _context.Attendances
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.RegistrationId == registrationId);
        }

        public async Task<List<Attendance>> GetByWorkshopIdAsync(Guid workshopId)
        {
            return await _context.Attendances
                .AsNoTracking()
                .Where(a => a.WorkshopId == workshopId)
                .OrderByDescending(a => a.CheckedInAt)
                .ToListAsync();
        }
    }
}
