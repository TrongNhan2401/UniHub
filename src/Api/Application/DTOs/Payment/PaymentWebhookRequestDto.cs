namespace Application.DTOs.Payment
{
    public class PaymentWebhookRequestDto
    {
        public Guid? PaymentId { get; set; }
        public string? GatewayTransactionId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Message { get; set; }
    }
}