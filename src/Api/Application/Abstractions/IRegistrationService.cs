using Application.Features.Registrations;

namespace Application.Abstractions
{
    public interface IRegistrationService
    {
        Task<CreateRegistrationResult> CreateAsync(
            CreateRegistrationCommand command,
            CancellationToken ct = default);
    }
}
