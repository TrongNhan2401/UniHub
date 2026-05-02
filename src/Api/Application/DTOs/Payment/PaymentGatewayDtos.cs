namespace Application.DTOs.Payment
{
    public class PaymentGatewayCreateLinkRequestDto
    {
        public long OrderCode { get; set; }
        public int Amount { get; set; }
        public string Description { get; set; } = string.Empty;
        public string ReturnUrl { get; set; } = string.Empty;
        public string CancelUrl { get; set; } = string.Empty;
    }

    public class PaymentGatewayCreateLinkResultDto
    {
        public string CheckoutUrl { get; set; } = string.Empty;
        public string? PaymentLinkId { get; set; }
        public string RawResponse { get; set; } = string.Empty;
    }

    public class PaymentGatewayWebhookVerifyResultDto
    {
        public long OrderCode { get; set; }
        public string? PaymentLinkId { get; set; }
        public string? Reference { get; set; }
        public string? Code { get; set; }
        public string RawResponse { get; set; } = string.Empty;
    }

    public class PaymentGatewayRefundRequestDto
    {
        public long OrderCode { get; set; }
        public decimal Amount { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}