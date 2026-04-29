namespace Application.Features.Registrations
{
    public sealed class ConfirmPaymentResult
    {
        public Guid RegistrationId { get; init; }
        public Guid PaymentId { get; init; }
        public string RegistrationStatus { get; init; } = string.Empty;
        public string PaymentStatus { get; init; } = string.Empty;
        public DateTime PaidAt { get; init; }
    }
}
