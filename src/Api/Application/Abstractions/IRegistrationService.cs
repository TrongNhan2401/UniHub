using Application.Features.Registrations;

namespace Application.Abstractions
{
    public interface IRegistrationService
    {
        Task<CreateRegistrationResult> CreateAsync(
            CreateRegistrationCommand command,
            CancellationToken ct = default);

        Task<MyRegistrationsResult> GetMyRegistrationsAsync(
            Guid userId,
            CancellationToken ct = default);

        Task<CancelRegistrationResult> CancelAsync(
            Guid userId,
            Guid registrationId,
            CancellationToken ct = default);

        Task<ConfirmPaymentResult> ConfirmDemoPaymentSuccessAsync(
            Guid userId,
            Guid registrationId,
            CancellationToken ct = default);
    }
}
