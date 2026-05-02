using Domain.Common;
namespace Domain.Entities
{
    /// <summary>
    /// Registration Entity - Đại diện cho việc đăng ký của 1 user cho 1 workshop.
    /// 
    /// Status flow:
    /// - Tạo mới → Pending (nếu workshop có phí) hoặc Confirmed (nếu miễn phí)
    /// - Khi payment done → Confirm() (chuyển từ Pending → Confirmed)
    /// - Khi user huỷ hoặc admin cancel → Cancel() (chuyển → Cancelled)
    /// 
    /// Race condition & Duplicate handling:
    /// - IdempotencyKey: Tránh duplicate từ client retry
    /// - Pessimistic lock (SELECT FOR UPDATE): Tránh race condition slot
    /// - GetByUserAndWorkshopAsync: Tránh user đăng ký 2 lần
    /// </summary>
    public class Registration : BaseEntity
    {
        public Guid UserId { get; private set; }
        public Guid WorkshopId { get; private set; }

        /// <summary>Trạng thái: Pending | Confirmed | Cancelled | WaitListed</summary>
        public RegistrationStatus Status { get; private set; } = RegistrationStatus.Pending;

        /// <summary>QR code dạng "REG-<id:N>" (32 hex) cho mobile check-in. Null nếu chưa confirmed.</summary>
        public string? QrCode { get; private set; }

        public string? QrToken { get; private set; }

        /// <summary>Idempotency key từ client header. Dùng để detect + prevent duplicate requests.</summary>
        public string? IdempotencyKey { get; private set; }

        // Navigation
        public AppUser User { get; private set; } = null!;
        public Workshop Workshop { get; private set; } = null!;
        public Payment? Payment { get; private set; }
        public Attendance? Attendance { get; private set; }

        /// <summary>EF Core constructor (private)</summary>
        private Registration() { }

        /// <summary>
        /// Constructor: Tạo registration mới với status = Pending (mặc định).
        /// idempotencyKey dùng để tránh duplicate khi client retry request.
        /// </summary>
        public Registration(Guid userId, Guid workshopId, string? idempotencyKey = null)
        {
            UserId = userId;
            WorkshopId = workshopId;
            IdempotencyKey = idempotencyKey;  // Lưu để check idempotency lần sau
            // Status = RegistrationStatus.Pending (set by property initializer)
        }

        /// <summary>
        /// [STATUS TRANSITION] Xác nhận registration (Pending → Confirmed).
        /// Dùng khi workshop miễn phí (confirm ngay) hoặc payment completed.
        /// </summary>
        public void Confirm(string? qrCode = null)
        {
            Status = RegistrationStatus.Confirmed;
            QrCode = qrCode;  // QR code dạng "REG-<id:N>" cho mobile check-in
        }

        /// <summary>
        /// [STATUS TRANSITION] Huỷ registration (Confirmed/Pending → Cancelled).
        /// Dùng khi user huỷ đăng ký hoặc admin cancel.
        /// Workshop.ReleaseSlot() phải gọi cùng (trong transaction).
        /// </summary>
        public void Cancel()
        {
            Status = RegistrationStatus.Cancelled;
        }

        public void SetQrCode(string qrCode)
        {
            QrCode = qrCode;
        }
    }
}
