namespace Application.DTOs.Payment
{
    public class PaymentCheckoutDto
    {
        public PaymentDto Payment { get; set; } = new();
        public string CheckoutUrl { get; set; } = string.Empty;
        public string ProviderName { get; set; } = string.Empty;
        public bool IsSimulator { get; set; }
        public bool RequiresAdditionalFee { get; set; }
    }
}