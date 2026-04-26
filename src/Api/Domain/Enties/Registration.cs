using Domain.Common;
namespace Domain.Enties
{
    public class Registration : BaseEntity
    {
        public Guid UserId { get; set; }
        public Guid WorkshopId { get; set; }
        public RegistrationStatus Status { get; set; } = RegistrationStatus.Pending;
        public string? QrCode { get; set; }          // base64 or URL
        public string? QrToken { get; set; }          // unique token embedded in QR
        public string? IdempotencyKey { get; set; }   // chống đăng ký 2 lần

        // Navigation
        public AppUser User { get; set; } = null!;
        public Workshop Workshop { get; set; } = null!;
        public Payment? Payment { get; set; }
        public Attendance? Attendance { get; set; }
    }

}
