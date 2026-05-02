using System.Text.Json.Serialization;

namespace Application.DTOs.Payment
{
    public class CreateCheckoutResponseDto
    {
        [JsonPropertyName("registration_id")]
        public Guid RegistrationId { get; set; }

        [JsonPropertyName("payment_id")]
        public Guid PaymentId { get; set; }

        [JsonPropertyName("payment_status")]
        public string PaymentStatus { get; set; } = string.Empty;

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("checkout_url")]
        public string CheckoutUrl { get; set; } = string.Empty;

        [JsonPropertyName("payment_link_id")]
        public string? PaymentLinkId { get; set; }

        [JsonPropertyName("order_code")]
        public long OrderCode { get; set; }

        [JsonPropertyName("expires_at")]
        public DateTime? ExpiresAt { get; set; }
    }
}