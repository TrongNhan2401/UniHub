using Application.Abstractions;

namespace Infrastructure.Services
{
    public class MockPaymentGatewayService : IPaymentGatewayService
    {
        public Task<PaymentGatewayCheckoutResult> CreateCheckoutAsync(
            PaymentGatewayCheckoutRequest request,
            CancellationToken cancellationToken = default)
        {
            var gatewayTransactionId = $"MOCK-{request.PaymentId:N}";

            return Task.FromResult(new PaymentGatewayCheckoutResult
            {
                GatewayTransactionId = gatewayTransactionId,
                CheckoutUrl = $"https://mock-gateway.unihub.local/checkout?paymentId={request.PaymentId:D}&registrationId={request.RegistrationId:D}",
                RawResponse = $"{{\"provider\":\"mock\",\"paymentId\":\"{request.PaymentId:D}\",\"amount\":{request.Amount},\"currency\":\"{request.Currency}\"}}",
                ProviderName = "UniHub Mock Gateway",
                RequiresAdditionalFee = false
            });
        }

        public Task<PaymentGatewayRefundResult> RefundAsync(
            PaymentGatewayRefundRequest request,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new PaymentGatewayRefundResult
            {
                GatewayTransactionId = string.IsNullOrWhiteSpace(request.GatewayTransactionId)
                    ? $"MOCK-REFUND-{request.PaymentId:N}"
                    : request.GatewayTransactionId,
                RawResponse = $"{{\"provider\":\"mock\",\"paymentId\":\"{request.PaymentId:D}\",\"status\":\"refunded\",\"reason\":\"{request.Reason ?? string.Empty}\"}}"
            });
        }
    }
}