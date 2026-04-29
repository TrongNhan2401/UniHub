namespace Application.Features.Payments
{
    public sealed class CreatePaymentCheckoutCommand
    {
        public Guid PaymentId { get; init; }
        public Guid RegistrationId { get; init; }
        public Guid UserId { get; init; }
        public decimal Amount { get; init; }
        public string OrderCode { get; init; } = string.Empty;
        public string Description { get; init; } = string.Empty;
    }
}
