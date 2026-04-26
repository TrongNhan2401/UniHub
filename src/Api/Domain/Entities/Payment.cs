using Domain.Common;

namespace Domain.Entities
{

    public class Payment : BaseEntity
    {
        public Guid RegistrationId { get; set; }
        public Guid UserId { get; set; }

        public decimal Amount { get; set; }
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
        public string? IdempotencyKey { get; set; }
        public string? GatewayTransactionId { get; set; }
        public string? GatewayResponse { get; set; }
        public int RetryCount { get; set; } = 0;

        public DateTime? PaidAt { get; set; }
        public DateTime? ExpiredAt { get; set; }

        // Navigation
        public Registration Registration { get; set; } = null!;
        public AppUser User { get; set; } = null!;
    }

}
