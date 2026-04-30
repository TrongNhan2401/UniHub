using Application.DTOs.Workshop;
using Domain.Shared;
using Domain.Entities;
using System.Threading.Tasks;

namespace Application.Features.Interfaces
{
    public interface IWorkshopService
    {
        Task<Result<WorkshopDto>> CreateWorkshopAsync(CreateWorkshopDto dto, Guid userId);
        Task<Result<WorkshopDto>> UpdateWorkshopAsync(Guid id, UpdateWorkshopDto dto);
        Task<Result<bool>> PublishWorkshopAsync(Guid id);
        Task<Result<bool>> CancelWorkshopAsync(Guid id);
        Task<Result<string>> UploadWorkshopPdfAsync(Guid id, Microsoft.AspNetCore.Http.IFormFile file);
        Task<Result<PagedResult<WorkshopListDto>>> GetWorkshopsPagedAsync(int pageNumber, int pageSize, DateTime? date = null);
        Task<Result<WorkshopDetailDto>> GetWorkshopDetailAsync(Guid id);
    }
}
