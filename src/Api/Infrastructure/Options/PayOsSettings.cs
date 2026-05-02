namespace Infrastructure.Options
{
    public class PayOsSettings
    {
        public string ClientId { get; set; } = string.Empty;
        public string ApiKey { get; set; } = string.Empty;
        public string ChecksumKey { get; set; } = string.Empty;
        public string ReturnUrl { get; set; } = "http://localhost:5173/payment/result";
        public string CancelUrl { get; set; } = "http://localhost:5173/payment/cancel";
        public string? WebhookUrl { get; set; }
    }
}