namespace Application.Features.Registrations
{
    public sealed class CreateRegistrationCommand
    {
        public Guid UserId { get; init; }
        public Guid WorkshopId { get; init; }
        public string IdempotencyKey { get; init; } = string.Empty;
    }
}
