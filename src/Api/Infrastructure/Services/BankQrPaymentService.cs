using Application.Abstractions;
using Application.Features.Payments;
using Microsoft.Extensions.Configuration;
using System.Globalization;
using System.Text.Json;

namespace Infrastructure.Services
{
    public sealed class BankQrPaymentService : IPaymentService
    {
        private readonly IConfiguration _configuration;

        public BankQrPaymentService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public Task<CreatePaymentCheckoutResult> CreateCheckoutAsync(
            CreatePaymentCheckoutCommand command,
            CancellationToken ct = default)
        {
            var bankId = _configuration["Payment:BankQr:BankId"];
            var accountNo = _configuration["Payment:BankQr:AccountNo"];
            var accountName = _configuration["Payment:BankQr:AccountName"];

            if (string.IsNullOrWhiteSpace(bankId)
                || string.IsNullOrWhiteSpace(accountNo)
                || string.IsNullOrWhiteSpace(accountName))
            {
                throw new InvalidOperationException("Missing Payment:BankQr settings (BankId, AccountNo, AccountName).");
            }

            var amountText = decimal.Round(command.Amount, 0, MidpointRounding.AwayFromZero)
                .ToString("0", CultureInfo.InvariantCulture);

            var transferContent = command.OrderCode;
            var encodedContent = Uri.EscapeDataString(transferContent);
            var encodedAccountName = Uri.EscapeDataString(accountName.Trim());

            // URL QR chuyen khoan dong theo chuan VietQR.
            var checkoutUrl = $"https://img.vietqr.io/image/{bankId.Trim()}-{accountNo.Trim()}-compact2.png?amount={amountText}&addInfo={encodedContent}&accountName={encodedAccountName}";

            var rawResponse = JsonSerializer.Serialize(new
            {
                provider = "BANK_QR",
                bankId = bankId.Trim(),
                accountNo = accountNo.Trim(),
                accountName = accountName.Trim(),
                amount = amountText,
                content = transferContent
            });

            var result = new CreatePaymentCheckoutResult
            {
                CheckoutUrl = checkoutUrl,
                ProviderTransactionId = command.OrderCode,
                RawResponse = rawResponse
            };

            return Task.FromResult(result);
        }
    }
}
