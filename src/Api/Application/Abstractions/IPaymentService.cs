namespace Application.Abstractions
{
    public interface IPaymentGatewayService
    {
        Task<PaymentGatewayCheckoutResult> CreateCheckoutAsync(
            PaymentGatewayCheckoutRequest request,
            CancellationToken cancellationToken = default);

        Task<PaymentGatewayRefundResult> RefundAsync(
            PaymentGatewayRefundRequest request,
            CancellationToken cancellationToken = default);
    }

    public sealed class PaymentGatewayCheckoutRequest
    {
        public Guid PaymentId { get; init; }
        public Guid RegistrationId { get; init; }
        public decimal Amount { get; init; }
        public string Currency { get; init; } = "VND";
        public string CustomerEmail { get; init; } = string.Empty;
        public string IdempotencyKey { get; init; } = string.Empty;
    }

    public sealed class PaymentGatewayCheckoutResult
    {
        public string GatewayTransactionId { get; init; } = string.Empty;
        public string CheckoutUrl { get; init; } = string.Empty;
        public string RawResponse { get; init; } = string.Empty;
        public string ProviderName { get; init; } = "MockGateway";
        public bool RequiresAdditionalFee { get; init; }
    }

    public sealed class PaymentGatewayRefundRequest
    {
        public Guid PaymentId { get; init; }
        public string GatewayTransactionId { get; init; } = string.Empty;
        public decimal Amount { get; init; }
        public string? Reason { get; init; }
    }

    public sealed class PaymentGatewayRefundResult
    {
        public string GatewayTransactionId { get; init; } = string.Empty;
        public string RawResponse { get; init; } = string.Empty;
    }
}
