using Application.DTOs.Registration;
using Domain.Shared;

namespace Application.Features.Interfaces
{
    public interface IRegistrationService
    {
        Task<Result<RegistrationDto>> CreateAsync(Guid userId, CreateRegistrationRequestDto request, string? idempotencyKey);
        Task<Result<RegistrationDto>> GetByIdAsync(Guid userId, Guid registrationId);
        Task<Result<List<RegistrationDto>>> GetMineAsync(Guid userId);
        Task<Result<bool>> CancelAsync(Guid userId, Guid registrationId);
    }
}
