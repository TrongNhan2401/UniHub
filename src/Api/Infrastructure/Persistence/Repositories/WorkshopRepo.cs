using Application.Abstractions.Repositories;
using Domain.Entities;
using Infrastructure.Persistence.Contexts;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;

namespace Infrastructure.Persistence.Repositories
{
    public class WorkshopRepo : IWorkshopRepo
    {
        private readonly AppDbContext _context;

        public WorkshopRepo(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Workshop> AddAsync(Workshop workshop)
        {
            await _context.Workshops.AddAsync(workshop);
            return workshop;
        }

        public async Task<(List<Workshop> Items, int TotalCount)> GetPagedAsync(int pageNumber, int pageSize, System.DateTime? date = null)
        {
            var query = _context.Workshops.AsNoTracking().AsQueryable();

            if (date.HasValue)
            {
                var targetDate = date.Value.Date;
                var nextDay = targetDate.AddDays(1);
                query = query.Where(w => w.StartTime >= targetDate && w.StartTime < nextDay);
            }

            query = query.OrderByDescending(w => w.CreatedAt);
            
            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<Workshop?> GetByIdAsync(Guid id)
        {
            return await _context.Workshops
                .AsNoTracking()
                .Include(w => w.Registrations)
                    .ThenInclude(r => r.User)
                .Include(w => w.Attendances)
                    .ThenInclude(a => a.User)
                .FirstOrDefaultAsync(w => w.Id == id);
        }
    }
}
