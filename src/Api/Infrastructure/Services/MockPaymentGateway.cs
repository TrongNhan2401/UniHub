using Application.Abstractions;
using Application.DTOs.Payment;
using Domain.Shared;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services
{
    /// <summary>
    /// Mock Payment Gateway — dùng để test local mà không gọi PayOS thật.
    /// Kích hoạt bằng cách đặt "Payment:UseMock": true trong appsettings.Development.json
    /// </summary>
    public class MockPaymentGateway : IPaymentGateway
    {
        private readonly ILogger<MockPaymentGateway> _logger;

        public MockPaymentGateway(ILogger<MockPaymentGateway> logger)
        {
            _logger = logger;
        }

        public Task<Result<PaymentGatewayCreateLinkResultDto>> CreatePaymentLinkAsync(
            PaymentGatewayCreateLinkRequestDto request,
            CancellationToken cancellationToken = default)
        {
            _logger.LogWarning("[MOCK GATEWAY] CreatePaymentLink called — không gọi PayOS thật. OrderCode={OrderCode}", request.OrderCode);

            // Trả về URL giả, trỏ thẳng đến PaymentResultPage với kết quả thành công
            var fakeCheckoutUrl = $"{request.ReturnUrl}&code=00&status=PAID&orderCode={request.OrderCode}&cancel=false";

            var result = new PaymentGatewayCreateLinkResultDto
            {
                CheckoutUrl = fakeCheckoutUrl,
                PaymentLinkId = $"mock-link-{request.OrderCode}",
                RawResponse = "{\"mock\":true}"
            };

            return Task.FromResult(Result<PaymentGatewayCreateLinkResultDto>.Success(result));
        }

        public Task<Result<PaymentGatewayWebhookVerifyResultDto>> VerifyWebhookAsync(
            PayOsWebhookDto webhook,
            CancellationToken cancellationToken = default)
        {
            _logger.LogWarning("[MOCK GATEWAY] VerifyWebhook called — bỏ qua kiểm tra chữ ký. OrderCode={OrderCode}", webhook.Data?.OrderCode);

            // Luôn xác nhận webhook thành công khi dùng mock
            var result = new PaymentGatewayWebhookVerifyResultDto
            {
                OrderCode = webhook.Data?.OrderCode ?? 0,
                PaymentLinkId = webhook.Data?.PaymentLinkId ?? "mock-link",
                Reference = webhook.Data?.Reference ?? "mock-ref",
                Code = "00",
                RawResponse = "{\"mock\":true}"
            };

            return Task.FromResult(Result<PaymentGatewayWebhookVerifyResultDto>.Success(result));
        }

        public Task<Result<string>> ConfirmWebhookAsync(string? webhookUrl, CancellationToken cancellationToken = default)
        {
            _logger.LogWarning("[MOCK GATEWAY] ConfirmWebhook called — bỏ qua, không gọi PayOS thật.");
            return Task.FromResult(Result<string>.Success("mock-confirmed"));
        }

        public Task<Result<string>> RefundAsync(PaymentGatewayRefundRequestDto request, CancellationToken cancellationToken = default)
        {
            _logger.LogWarning("[MOCK GATEWAY] Refund called — OrderCode={OrderCode}, Amount={Amount}. Không gọi PayOS thật.", request.OrderCode, request.Amount);
            return Task.FromResult(Result<string>.Success("mock-refunded"));
        }
    }
}
