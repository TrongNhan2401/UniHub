using Application.DTOs.CheckIn;
using Domain.Shared;

namespace Application.Features.Interfaces
{
    public interface ICheckInService
    {
        Task<Result<List<CheckInWorkshopRegistrationDto>>> GetWorkshopRegistrationsAsync(Guid workshopId);
        Task<Result<CheckInValidationDto>> ValidateAsync(Guid registrationId, Guid workshopId);
        Task<Result<CheckInResultDto>> CheckInAsync(CheckInRequestDto request);
        Task<Result<CheckInSyncResultDto>> SyncAsync(CheckInSyncRequestDto request);
        Task<Result<PagedResult<CheckInResultDto>>> GetHistoryAsync(Guid workshopId, int pageNumber, int pageSize);
    }
}