namespace Application.DTOs.Payment
{
    public class PaymentDto
    {
        public Guid Id { get; set; }
        public Guid RegistrationId { get; set; }
        public Guid UserId { get; set; }
        public Guid WorkshopId { get; set; }
        public string WorkshopTitle { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string RegistrationStatus { get; set; } = string.Empty;
        public string? GatewayTransactionId { get; set; }
        public string? GatewayResponse { get; set; }
        public int RetryCount { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime? ExpiredAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}