using Application.Features.Payments;

namespace Application.Abstractions
{
    public interface IPaymentService
    {
        Task<CreatePaymentCheckoutResult> CreateCheckoutAsync(
            CreatePaymentCheckoutCommand command,
            CancellationToken ct = default);
    }
}
