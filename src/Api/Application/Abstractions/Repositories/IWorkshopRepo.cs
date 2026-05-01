using Domain.Entities;
using System.Threading.Tasks;

namespace Application.Abstractions.Repositories
{
    public interface IWorkshopRepo
    {
        Task<Workshop> AddAsync(Workshop workshop);
        Task<(List<Workshop> Items, int TotalCount)> GetPagedAsync(int pageNumber, int pageSize, System.DateTime? date = null);
        Task<Workshop?> GetByIdAsync(Guid id);
        Task<Workshop?> GetByIdForUpdateAsync(Guid id);
        Task<bool> TryReserveSlotAsync(Guid workshopId, DateTime nowUtc);
        Task<bool> TryReleaseSlotAsync(Guid workshopId);
    }
}
