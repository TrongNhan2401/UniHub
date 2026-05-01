namespace Application.DTOs.CheckIn
{
    public class CheckInRequestDto
    {
        public Guid RegistrationId { get; set; }
        public Guid WorkshopId { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public DateTime? CheckedInAt { get; set; }
        public string? SyncKey { get; set; }
    }
}