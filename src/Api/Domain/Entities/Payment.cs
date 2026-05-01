using Domain.Common;

namespace Domain.Entities
{

    public class Payment : BaseEntity
    {
        public Guid RegistrationId { get; private set; }
        public Guid UserId { get; private set; }

        public decimal Amount { get; private set; }
        public PaymentStatus Status { get; private set; } = PaymentStatus.Pending;
        public string? IdempotencyKey { get; private set; }
        public string? GatewayTransactionId { get; private set; }
        public string? GatewayResponse { get; private set; }
        public int RetryCount { get; private set; } = 0;

        public DateTime? PaidAt { get; private set; }
        public DateTime? ExpiredAt { get; private set; }

        // Navigation
        public Registration Registration { get; set; } = null!;
        public AppUser User { get; set; } = null!;

        private Payment() { }

        public static Payment Create(
            Guid registrationId,
            Guid userId,
            decimal amount,
            string idempotencyKey,
            DateTime? expiredAt = null)
        {
            return new Payment
            {
                RegistrationId = registrationId,
                UserId = userId,
                Amount = amount,
                IdempotencyKey = idempotencyKey,
                ExpiredAt = expiredAt,
                Status = PaymentStatus.Pending
            };
        }

        public void MarkPending(string gatewayTransactionId, string gatewayResponse, DateTime? expiredAt)
        {
            Status = PaymentStatus.Pending;
            GatewayTransactionId = gatewayTransactionId;
            GatewayResponse = gatewayResponse;
            ExpiredAt = expiredAt;
        }

        public void MarkCompleted(string gatewayTransactionId, string gatewayResponse, DateTime paidAt)
        {
            Status = PaymentStatus.Completed;
            GatewayTransactionId = gatewayTransactionId;
            GatewayResponse = gatewayResponse;
            PaidAt = paidAt;
        }

        public void MarkFailed(string gatewayResponse)
        {
            Status = PaymentStatus.Failed;
            GatewayResponse = gatewayResponse;
            RetryCount += 1;
        }

        public void MarkTimedOut(string gatewayResponse)
        {
            Status = PaymentStatus.Timeout;
            GatewayResponse = gatewayResponse;
            RetryCount += 1;
        }

        public void MarkRefunded(string gatewayResponse)
        {
            Status = PaymentStatus.Refunded;
            GatewayResponse = gatewayResponse;
        }
    }

}
