using Domain.Entities;
using Domain.Shared;
using Microsoft.AspNetCore.Http;

namespace Application.Features.Interfaces
{
    public interface ISyncTaskService
    {
        Task<Result<SyncTask>> CreateSyncTaskAsync(IFormFile file);
        Task<Result<SyncTask>> GetTaskStatusAsync(Guid id);
        Task<Result<List<SyncTask>>> GetAllTasksAsync(int limit = 20);
        Task ProcessPendingTasksAsync(CancellationToken ct);
        Task ProcessFilteredTasksAsync(CancellationToken ct);
    }
}
