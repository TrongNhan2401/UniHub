using Application.DTOs.Payment;
using Domain.Shared;

namespace Application.Features.Interfaces
{
    public interface IPaymentService
    {
        Task<Result<CreateCheckoutResponseDto>> CreateCheckoutAsync(Guid userId, Guid registrationId, string? idempotencyKey);
        Task<Result<PaymentStatusDto>> GetByRegistrationAsync(Guid userId, Guid registrationId);
        Task<Result<bool>> HandlePayOsWebhookAsync(PayOsWebhookDto webhook);
        Task<Result<string>> ConfirmPayOsWebhookAsync(Guid actorUserId, string? webhookUrl, bool canConfirm);
        Task<Result<PaymentStatusDto>> RefundAsync(Guid actorUserId, Guid paymentId, string? reason, bool canRefund);
    }
}