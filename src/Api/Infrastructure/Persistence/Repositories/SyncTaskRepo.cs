using Application.Abstractions.Repositories;
using Domain;
using Domain.Entities;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class SyncTaskRepo : ISyncTaskRepo
    {
        private readonly AppDbContext _context;

        public SyncTaskRepo(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(SyncTask task)
        {
            await _context.SyncTasks.AddAsync(task);
        }

        public async Task<List<SyncTask>> GetAllAsync(int limit)
        {
            return await _context.SyncTasks
                .OrderByDescending(t => t.CreatedAt)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<SyncTask?> GetByIdAsync(Guid id)
        {
            return await _context.SyncTasks.FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<List<SyncTask>> GetFilteredTasksAsync()
        {
            return await _context.SyncTasks
                .Where(t => t.SyncState == SyncState.Filtered)
                .OrderBy(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<SyncTask>> GetPendingTasksAsync()
        {
            return await _context.SyncTasks
                .Where(t => t.SyncState == SyncState.Pending)
                .OrderBy(t => t.CreatedAt)
                .ToListAsync();
        }
    }
}
