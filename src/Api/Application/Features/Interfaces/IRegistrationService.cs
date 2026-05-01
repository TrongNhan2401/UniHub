using Application.DTOs.Registration;
using Domain.Shared;

namespace Application.Features.Interfaces
{
    public interface IRegistrationService
    {
        Task<Result<RegistrationDto>> CreateAsync(Guid userId, CreateRegistrationRequestDto request, string? idempotencyKey);
        Task<Result<RegistrationDto>> GetByIdAsync(Guid registrationId, Guid currentUserId, bool isOrganizer);
        Task<Result<List<RegistrationDto>>> GetMineAsync(Guid userId);
        Task<Result<PagedResult<RegistrationDto>>> GetPagedAsync(Guid? workshopId, string? status, int pageNumber, int pageSize);
        Task<Result<bool>> CancelAsync(Guid registrationId, Guid currentUserId, bool isOrganizer);
        Task<Result<RegistrationExportFileDto>> ExportCsvAsync(Guid workshopId);
        Task<Result<RegistrationDto>> RegenerateQrAsync(Guid registrationId);
    }
}