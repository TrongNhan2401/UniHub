using Domain.Common;

namespace Domain.Entities
{

    public class Attendance : BaseEntity
    {
        public Guid RegistrationId { get; private set; }
        public Guid UserId { get; private set; }
        public Guid WorkshopId { get; private set; }

        public AttendanceStatus Status { get; private set; } = AttendanceStatus.CheckedIn;
        public DateTime CheckedInAt { get; private set; }

        public bool IsSyncedFromOffline { get; private set; } = false;
        public string? OfflineDeviceId { get; private set; }

        // Navigation
        public Registration Registration { get; private set; } = null!;
        public AppUser User { get; private set; } = null!;
        public Workshop Workshop { get; private set; } = null!;

        private Attendance() { }

        public Attendance(Guid registrationId, Guid userId, Guid workshopId, DateTime checkedInAt, string? offlineDeviceId = null)
        {
            RegistrationId = registrationId;
            UserId = userId;
            WorkshopId = workshopId;
            CheckedInAt = checkedInAt;
            OfflineDeviceId = offlineDeviceId;
            IsSyncedFromOffline = !string.IsNullOrEmpty(offlineDeviceId);
            Status = AttendanceStatus.CheckedIn;
        }

        public void MarkAsSynced(string deviceId)
        {
            IsSyncedFromOffline = true;
            OfflineDeviceId = deviceId;
        }
    }
}
