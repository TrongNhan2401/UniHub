namespace Application.Features.Registrations
{
    public sealed class CancelRegistrationResult
    {
        public Guid RegistrationId { get; init; }
        public string Status { get; init; } = string.Empty;
    }
}
