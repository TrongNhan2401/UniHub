namespace Application.DTOs.CheckIn
{
    public class CheckInResultDto
    {
        public Guid AttendanceId { get; set; }
        public Guid RegistrationId { get; set; }
        public Guid WorkshopId { get; set; }
        public Guid UserId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentId { get; set; } = string.Empty;
        public DateTime CheckedInAt { get; set; }
        public bool IsSyncedFromOffline { get; set; }
        public string? OfflineDeviceId { get; set; }
        public bool IsDuplicate { get; set; }
    }
}