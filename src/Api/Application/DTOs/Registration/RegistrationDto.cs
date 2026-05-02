using System.Text.Json.Serialization;

namespace Application.DTOs.Registration
{
    public class RegistrationDto
    {
        public Guid Id { get; set; }

        [JsonPropertyName("workshop_id")]
        public Guid WorkshopId { get; set; }

        [JsonPropertyName("workshop_title")]
        public string WorkshopTitle { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("payment_status")]
        public string PaymentStatus { get; set; } = string.Empty;

        [JsonPropertyName("qr_code")]
        public string? QrCode { get; set; }

        [JsonPropertyName("polling_url")]
        public string PollingUrl { get; set; } = string.Empty;

        [JsonPropertyName("registered_at")]
        public DateTime RegisteredAt { get; set; }
    }
}
