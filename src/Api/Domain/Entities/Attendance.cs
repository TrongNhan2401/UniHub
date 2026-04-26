using Domain.Common;

namespace Domain.Entities
{

    public class Attendance : BaseEntity
    {
        public Guid RegistrationId { get; set; }
        public Guid UserId { get; set; }
        public Guid WorkshopId { get; set; }

        public AttendanceStatus Status { get; set; } = AttendanceStatus.CheckedIn;
        public DateTime CheckedInAt { get; set; }

        public bool IsSyncedFromOffline { get; set; } = false;
        public string? OfflineDeviceId { get; set; }

        // Navigation
        public Registration Registration { get; set; } = null!;
        public AppUser User { get; set; } = null!;
        public Workshop Workshop { get; set; } = null!;
    }

}
