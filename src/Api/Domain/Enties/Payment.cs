using Domain.Common;

namespace Domain.Enties
{

    public class Payment : BaseEntity
    {
        public Guid RegistrationId { get; set; }
        public Guid UserId { get; set; }
        public decimal Amount { get; set; }
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
        public string? IdempotencyKey { get; set; }       // chống double charge
        public string? GatewayTransactionId { get; set; } // ID từ payment gateway
        public string? GatewayResponse { get; set; }      // raw response JSON
        public int RetryCount { get; set; } = 0;
        public DateTime? PaidAt { get; set; }
        public DateTime? ExpiredAt { get; set; }

        // Navigation
        public Registration Registration { get; set; } = null!;
    }

}
