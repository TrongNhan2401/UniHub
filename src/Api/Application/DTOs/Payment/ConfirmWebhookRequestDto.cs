using System.Text.Json.Serialization;

namespace Application.DTOs.Payment
{
    public class ConfirmWebhookRequestDto
    {
        [JsonPropertyName("webhook_url")]
        public string? WebhookUrl { get; set; }
    }
}