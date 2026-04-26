using Domain.Common;
namespace Domain.Entities
{
    public class Registration : BaseEntity
    {
        public Guid UserId { get; set; }
        public Guid WorkshopId { get; set; }

        public RegistrationStatus Status { get; set; } = RegistrationStatus.Pending;
        public string? QrCode { get; set; }
        public string? QrToken { get; set; }
        public string? IdempotencyKey { get; set; }

        // Navigation
        public AppUser User { get; set; } = null!;
        public Workshop Workshop { get; set; } = null!;
        public Payment? Payment { get; set; }
        public Attendance? Attendance { get; set; }
    }
}
