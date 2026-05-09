using Application.Abstractions;
using Application.DTOs.Payment;
using Domain.Shared;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services
{
    /// <summary>
    /// Mock Payment Gateway Failure - dùng để mô phỏng cổng thanh toán lỗi.
    /// Kích hoạt bằng cách đặt Payment:UseMock=true và Payment:MockMode=Failure.
    /// </summary>
    public class MockPaymentGatewayFailure : IPaymentGateway
    {
        private readonly ILogger<MockPaymentGatewayFailure> _logger;

        public MockPaymentGatewayFailure(ILogger<MockPaymentGatewayFailure> logger)
        {
            _logger = logger;
        }

        public Task<Result<PaymentGatewayCreateLinkResultDto>> CreatePaymentLinkAsync(
            PaymentGatewayCreateLinkRequestDto request,
            CancellationToken cancellationToken = default)
        {
            _logger.LogWarning(
                "[MOCK FAILURE GATEWAY] CreatePaymentLink called - simulate gateway failure. OrderCode={OrderCode}",
                request.OrderCode);

            return Task.FromResult(Result.Failure<PaymentGatewayCreateLinkResultDto>(
                new Error(
                    "Payment.ServiceUnavailable",
                    "[MOCK] Cong thanh toan tam thoi khong kha dung. Vui long thu lai sau vai phut.")));
        }

        public Task<Result<PaymentGatewayWebhookVerifyResultDto>> VerifyWebhookAsync(
            PayOsWebhookDto webhook,
            CancellationToken cancellationToken = default)
        {
            _logger.LogWarning(
                "[MOCK FAILURE GATEWAY] VerifyWebhook called - simulate verify failure. OrderCode={OrderCode}",
                webhook.Data?.OrderCode);

            return Task.FromResult(Result.Failure<PaymentGatewayWebhookVerifyResultDto>(
                new Error(
                    "Payment.ServiceUnavailable",
                    "[MOCK] Khong the xac minh webhook vi cong thanh toan dang loi.")));
        }

        public Task<Result<string>> ConfirmWebhookAsync(string? webhookUrl, CancellationToken cancellationToken = default)
        {
            _logger.LogWarning("[MOCK FAILURE GATEWAY] ConfirmWebhook called - simulate confirm failure.");
            return Task.FromResult(Result.Failure<string>(
                new Error(
                    "Payment.ServiceUnavailable",
                    "[MOCK] Khong the confirm webhook vi cong thanh toan dang loi.")));
        }

        public Task<Result<string>> RefundAsync(PaymentGatewayRefundRequestDto request, CancellationToken cancellationToken = default)
        {
            _logger.LogWarning(
                "[MOCK FAILURE GATEWAY] Refund called - simulate refund failure. OrderCode={OrderCode}",
                request.OrderCode);

            return Task.FromResult(Result.Failure<string>(
                new Error(
                    "Payment.ServiceUnavailable",
                    "[MOCK] Khong the refund vi cong thanh toan dang loi.")));
        }
    }
}
