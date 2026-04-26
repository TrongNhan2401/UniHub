using Domain.Common;

namespace Domain.Enties
{

    public class Attendance : BaseEntity
    {
        public Guid RegistrationId { get; set; }
        public Guid UserId { get; set; }
        public Guid WorkshopId { get; set; }
        public AttendanceStatus Status { get; set; } = AttendanceStatus.CheckedIn;
        public DateTime CheckedInAt { get; set; }
        public bool IsSyncedFromOffline { get; set; } = false;   // offline sync flag
        public string? OfflineDeviceId { get; set; }

        // Navigation
        public Registration Registration { get; set; } = null!;
    }

}
