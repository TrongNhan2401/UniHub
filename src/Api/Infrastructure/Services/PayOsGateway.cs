using Application.Abstractions;
using Application.DTOs.Payment;
using Domain.Shared;
using Infrastructure.Options;
using Microsoft.Extensions.Options;
using PayOS;
using PayOS.Models;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;
using System;
using System.Text.Json;

namespace Infrastructure.Services
{
    public class PayOsGateway : IPaymentGateway
    {
        private readonly PayOSClient _client;
        private readonly PayOsSettings _settings;

        public PayOsGateway(IOptions<PayOsSettings> settings)
        {
            _settings = settings.Value;

            _client = new PayOSClient(new PayOSOptions
            {
                ClientId = _settings.ClientId,
                ApiKey = _settings.ApiKey,
                ChecksumKey = _settings.ChecksumKey
            });
        }

        public async Task<Result<PaymentGatewayCreateLinkResultDto>> CreatePaymentLinkAsync(
            PaymentGatewayCreateLinkRequestDto request,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var response = await _client.PaymentRequests.CreateAsync(new CreatePaymentLinkRequest
                {
                    OrderCode = request.OrderCode,
                    Amount = request.Amount,
                    Description = request.Description,
                    ReturnUrl = string.IsNullOrWhiteSpace(request.ReturnUrl) ? _settings.ReturnUrl : request.ReturnUrl,
                    CancelUrl = string.IsNullOrWhiteSpace(request.CancelUrl) ? _settings.CancelUrl : request.CancelUrl
                }, new RequestOptions<CreatePaymentLinkRequest>
                {
                    CancellationToken = cancellationToken
                });

                var raw = JsonSerializer.Serialize(response);
                var checkoutUrl = ExtractString(raw, "checkoutUrl", "checkout_url");
                var paymentLinkId = ExtractString(raw, "paymentLinkId", "payment_link_id", "id");

                if (string.IsNullOrWhiteSpace(checkoutUrl))
                {
                    return Result.Failure<PaymentGatewayCreateLinkResultDto>(new Error("Payment.GatewayInvalidResponse", "PayOS tra ve du lieu khong hop le (thieu checkoutUrl)."));
                }

                return Result.Success(new PaymentGatewayCreateLinkResultDto
                {
                    CheckoutUrl = checkoutUrl,
                    PaymentLinkId = paymentLinkId,
                    RawResponse = raw
                });
            }
            catch (Exception ex)
            {
                return Result.Failure<PaymentGatewayCreateLinkResultDto>(new Error("Payment.GatewayUnavailable", $"Khong the tao link thanh toan PayOS: {ex.Message}"));
            }
        }

        public async Task<Result<PaymentGatewayWebhookVerifyResultDto>> VerifyWebhookAsync(PayOsWebhookDto webhook, CancellationToken cancellationToken = default)
        {
            try
            {
                var verified = await _client.Webhooks.VerifyAsync(new Webhook
                {
                    Code = webhook.Code ?? string.Empty,
                    Description = webhook.Description ?? webhook.Desc ?? string.Empty,
                    Success = webhook.Success,
                    Signature = webhook.Signature ?? string.Empty,
                    Data = new WebhookData
                    {
                        OrderCode = webhook.Data.OrderCode,
                        Amount = webhook.Data.Amount,
                        Description = webhook.Data.Description ?? string.Empty,
                        AccountNumber = webhook.Data.AccountNumber ?? string.Empty,
                        Reference = webhook.Data.Reference ?? string.Empty,
                        TransactionDateTime = webhook.Data.TransactionDateTime ?? string.Empty,
                        Currency = webhook.Data.Currency ?? "VND",
                        PaymentLinkId = webhook.Data.PaymentLinkId ?? string.Empty,
                        Code = webhook.Data.Code ?? string.Empty,
                        Description2 = webhook.Data.Desc ?? string.Empty,
                        CounterAccountBankId = webhook.Data.CounterAccountBankId,
                        CounterAccountBankName = webhook.Data.CounterAccountBankName,
                        CounterAccountName = webhook.Data.CounterAccountName,
                        CounterAccountNumber = webhook.Data.CounterAccountNumber,
                        VirtualAccountName = webhook.Data.VirtualAccountName,
                        VirtualAccountNumber = webhook.Data.VirtualAccountNumber
                    }
                });

                var raw = JsonSerializer.Serialize(verified);
                var orderCodeRaw = ExtractString(raw, "orderCode", "order_code")
                    ?? webhook.Data.OrderCode.ToString();
                _ = long.TryParse(orderCodeRaw, out var orderCode);

                return Result.Success(new PaymentGatewayWebhookVerifyResultDto
                {
                    OrderCode = orderCode,
                    PaymentLinkId = ExtractString(raw, "paymentLinkId", "payment_link_id") ?? webhook.Data.PaymentLinkId,
                    Reference = ExtractString(raw, "reference") ?? webhook.Data.Reference,
                    Code = ExtractString(raw, "code") ?? webhook.Data.Code ?? webhook.Code,
                    RawResponse = raw
                });
            }
            catch (Exception ex)
            {
                // Fallback verification for real-world payload variants where SDK strict model mapping can fail.
                // We still verify signature cryptographically from webhook data before accepting.
                var computedSignature = _client.Crypto.CreateSignatureFromObject(webhook.Data, _settings.ChecksumKey);
                var incomingSignature = webhook.Signature ?? string.Empty;

                if (!string.IsNullOrWhiteSpace(incomingSignature)
                    && string.Equals(computedSignature, incomingSignature, StringComparison.OrdinalIgnoreCase))
                {
                    return Result.Success(new PaymentGatewayWebhookVerifyResultDto
                    {
                        OrderCode = webhook.Data.OrderCode,
                        PaymentLinkId = webhook.Data.PaymentLinkId,
                        Reference = webhook.Data.Reference,
                        Code = webhook.Data.Code ?? webhook.Code,
                        RawResponse = JsonSerializer.Serialize(webhook)
                    });
                }

                return Result.Failure<PaymentGatewayWebhookVerifyResultDto>(new Error("Payment.InvalidWebhookSignature", $"Webhook PayOS khong hop le: {ex.Message}"));
            }
        }

        public async Task<Result<string>> ConfirmWebhookAsync(string? webhookUrl, CancellationToken cancellationToken = default)
        {
            var targetUrl = string.IsNullOrWhiteSpace(webhookUrl)
                ? _settings.WebhookUrl
                : webhookUrl.Trim();

            if (string.IsNullOrWhiteSpace(targetUrl))
            {
                return Result.Failure<string>(new Error("Payment.InvalidWebhookUrl", "Webhook URL khong duoc de trong."));
            }

            try
            {
                var response = await _client.Webhooks.ConfirmAsync(
                    targetUrl,
                    new RequestOptions<ConfirmWebhookRequest>
                    {
                        CancellationToken = cancellationToken
                    });

                return Result.Success(JsonSerializer.Serialize(response));
            }
            catch (Exception ex)
            {
                return Result.Failure<string>(new Error("Payment.WebhookConfirmFailed", $"Khong the confirm webhook PayOS: {ex.Message}"));
            }
        }

        public async Task<Result<string>> RefundAsync(PaymentGatewayRefundRequestDto request, CancellationToken cancellationToken = default)
        {
            try
            {
                // SDK payOS hien tai chua co API refund typed trong tai lieu de bai.
                // Su dung direct API call de goi endpoint refund cua merchant API.
                var response = await _client.PostAsync<object, object>(
                    $"/v2/payment-requests/{request.OrderCode}/refund",
                    new RequestOptions<object>
                    {
                        Body = new
                        {
                            amount = Convert.ToInt32(decimal.Round(request.Amount, 0, MidpointRounding.AwayFromZero)),
                            reason = request.Reason
                        },
                        CancellationToken = cancellationToken
                    });

                return Result.Success(JsonSerializer.Serialize(response));
            }
            catch (Exception ex)
            {
                return Result.Failure<string>(new Error("Payment.RefundFailed", $"Khong the refund qua PayOS: {ex.Message}"));
            }
        }

        private static string? ExtractString(string rawJson, params string[] keys)
        {
            try
            {
                using var doc = JsonDocument.Parse(rawJson);
                var root = doc.RootElement;

                foreach (var key in keys)
                {
                    if (TryReadValue(root, key, out var value))
                    {
                        return value;
                    }
                }

                if (root.TryGetProperty("data", out var dataElement))
                {
                    foreach (var key in keys)
                    {
                        if (TryReadValue(dataElement, key, out var value))
                        {
                            return value;
                        }
                    }
                }
            }
            catch
            {
                return null;
            }

            return null;
        }

        private static bool TryReadValue(JsonElement element, string key, out string? value)
        {
            value = null;
            if (!element.TryGetProperty(key, out var child))
            {
                return false;
            }

            value = child.ValueKind switch
            {
                JsonValueKind.String => child.GetString(),
                JsonValueKind.Number => child.GetRawText(),
                _ => null
            };

            return !string.IsNullOrWhiteSpace(value);
        }
    }
}