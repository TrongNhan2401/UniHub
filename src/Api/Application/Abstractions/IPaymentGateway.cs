using Application.DTOs.Payment;
using Domain.Shared;

namespace Application.Abstractions
{
    public interface IPaymentGateway
    {
        Task<Result<PaymentGatewayCreateLinkResultDto>> CreatePaymentLinkAsync(PaymentGatewayCreateLinkRequestDto request, CancellationToken cancellationToken = default);
        Task<Result<PaymentGatewayWebhookVerifyResultDto>> VerifyWebhookAsync(PayOsWebhookDto webhook, CancellationToken cancellationToken = default);
        Task<Result<string>> ConfirmWebhookAsync(string? webhookUrl, CancellationToken cancellationToken = default);
        Task<Result<string>> RefundAsync(PaymentGatewayRefundRequestDto request, CancellationToken cancellationToken = default);
    }
}