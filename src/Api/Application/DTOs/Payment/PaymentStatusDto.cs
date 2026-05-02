using System.Text.Json.Serialization;

namespace Application.DTOs.Payment
{
    public class PaymentStatusDto
    {
        [JsonPropertyName("registration_id")]
        public Guid RegistrationId { get; set; }

        [JsonPropertyName("payment_id")]
        public Guid PaymentId { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("paid_at")]
        public DateTime? PaidAt { get; set; }

        [JsonPropertyName("expired_at")]
        public DateTime? ExpiredAt { get; set; }

        [JsonPropertyName("gateway_transaction_id")]
        public string? GatewayTransactionId { get; set; }

        [JsonPropertyName("checkout_url")]
        public string? CheckoutUrl { get; set; }
    }
}