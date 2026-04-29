namespace Application.Features.Registrations
{
    public sealed class MyRegistrationsResult
    {
        public List<MyRegistrationItem> Items { get; init; } = [];
    }

    public sealed class MyRegistrationItem
    {
        public Guid RegistrationId { get; init; }
        public Guid WorkshopId { get; init; }
        public string WorkshopTitle { get; init; } = string.Empty;
        public DateTime StartTime { get; init; }
        public string Status { get; init; } = string.Empty;
        public string? PaymentStatus { get; init; }
        public string QrStatus { get; init; } = string.Empty;
    }
}
