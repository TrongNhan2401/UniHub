using Application.DTOs.Payment;
using Domain.Shared;

namespace Application.Features.Interfaces
{
    public interface IPaymentService
    {
        Task<Result<PaymentCheckoutDto>> InitiateAsync(Guid registrationId, Guid currentUserId, bool isOrganizer);
        Task<Result<PaymentDto>> GetByIdAsync(Guid paymentId, Guid currentUserId, bool isOrganizer);
        Task<Result<PaymentDto>> HandleWebhookAsync(PaymentWebhookRequestDto request);
        Task<Result<PaymentDto>> RefundAsync(Guid paymentId, Guid currentUserId, bool isOrganizer, string? reason);
    }
}