using Application.Features.Workshops;

namespace Application.Abstractions
{
    public interface IWorkshopQueryService
    {
        Task<WorkshopListResult> GetListAsync(WorkshopListQuery query, CancellationToken ct = default);
        Task<WorkshopDetailResult?> GetByIdAsync(Guid id, CancellationToken ct = default);
    }
}
