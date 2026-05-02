using System.Text.Json.Serialization;

namespace Application.DTOs.Payment
{
    public class RefundPaymentRequestDto
    {
        [JsonPropertyName("reason")]
        public string? Reason { get; set; }
    }
}