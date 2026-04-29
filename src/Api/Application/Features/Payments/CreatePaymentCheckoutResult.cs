namespace Application.Features.Payments
{
    public sealed class CreatePaymentCheckoutResult
    {
        public string CheckoutUrl { get; init; } = string.Empty;
        public string? ProviderTransactionId { get; init; }
        public string RawResponse { get; init; } = string.Empty;
    }
}
