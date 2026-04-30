using Domain.Entities;

namespace Application.Abstractions.Repositories
{
    public interface ISyncTaskRepo
    {
        Task<SyncTask?> GetByIdAsync(Guid id);
        Task<List<SyncTask>> GetAllAsync(int limit);
        Task AddAsync(SyncTask task);
        Task<List<SyncTask>> GetPendingTasksAsync();
        Task<List<SyncTask>> GetFilteredTasksAsync();
    }
}
