namespace Application.Features.Registrations
{
    public sealed class CreateRegistrationResult
    {
        public Guid RegistrationId { get; init; }
        public Guid WorkshopId { get; init; }
        public string Status { get; init; } = string.Empty;
        public RegistrationPaymentResult? Payment { get; init; }
        public RegistrationQrResult? Qr { get; init; }
    }

    public sealed class RegistrationPaymentResult
    {
        public Guid PaymentId { get; init; }
        public string Status { get; init; } = string.Empty;
        public string? CheckoutUrl { get; init; }
    }

    public sealed class RegistrationQrResult
    {
        public string Status { get; init; } = string.Empty;
    }
}
