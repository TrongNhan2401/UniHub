using Domain.Common;
namespace Domain.Entities
{
    public class Registration : BaseEntity
    {
        public Guid UserId { get; private set; }
        public Guid WorkshopId { get; private set; }

        public RegistrationStatus Status { get; private set; } = RegistrationStatus.Pending;
        public string? QrCode { get; private set; }
        public string? QrToken { get; private set; }
        public string? IdempotencyKey { get; private set; }

        // Navigation
        public AppUser User { get; private set; } = null!;
        public Workshop Workshop { get; private set; } = null!;
        public Payment? Payment { get; private set; }
        public Attendance? Attendance { get; private set; }

        private Registration() { }

        public Registration(Guid userId, Guid workshopId, string? idempotencyKey = null)
        {
            UserId = userId;
            WorkshopId = workshopId;
            IdempotencyKey = idempotencyKey;
        }

        public void MarkPending()
        {
            Status = RegistrationStatus.Pending;
        }

        public void Confirm(string qrCode, string qrToken)
        {
            Status = RegistrationStatus.Confirmed;
            QrCode = qrCode;
            QrToken = qrToken;
        }

        public void Cancel()
        {
            Status = RegistrationStatus.Cancelled;
        }

        public void RegenerateQr(string qrCode, string qrToken)
        {
            QrCode = qrCode;
            QrToken = qrToken;
        }
    }
}
