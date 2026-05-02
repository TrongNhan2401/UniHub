using Application.Abstractions;
using Application.DTOs.Payment;
using Application.Features.Interfaces;
using Domain;
using Domain.Entities;
using Domain.Shared;
using System.Globalization;
using System.Text.Json;

namespace Application.Features.Implementations
{
    public class PaymentService : IPaymentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPaymentGateway _paymentGateway;

        public PaymentService(IUnitOfWork unitOfWork, IPaymentGateway paymentGateway)
        {
            _unitOfWork = unitOfWork;
            _paymentGateway = paymentGateway;
        }

        public async Task<Result<CreateCheckoutResponseDto>> CreateCheckoutAsync(Guid userId, Guid registrationId, string? idempotencyKey)
        {
            var registration = await _unitOfWork.Registrations.GetByIdWithWorkshopAsync(registrationId);
            if (registration is null)
            {
                return Result.Failure<CreateCheckoutResponseDto>(new Error("Registration.NotFound", "Khong tim thay dang ky."));
            }

            if (registration.UserId != userId)
            {
                return Result.Failure<CreateCheckoutResponseDto>(new Error("Registration.Forbidden", "Ban khong co quyen thanh toan dang ky nay."));
            }

            if (registration.Workshop.IsFree)
            {
                return Result.Failure<CreateCheckoutResponseDto>(new Error("Payment.NotRequired", "Workshop mien phi, khong can thanh toan."));
            }

            if (registration.Status == RegistrationStatus.Cancelled)
            {
                return Result.Failure<CreateCheckoutResponseDto>(new Error("Registration.InvalidState", "Dang ky da bi huy."));
            }

            if (registration.Status == RegistrationStatus.Confirmed)
            {
                return Result.Failure<CreateCheckoutResponseDto>(new Error("Registration.InvalidState", "Dang ky da duoc xac nhan."));
            }

            if (!string.IsNullOrWhiteSpace(idempotencyKey))
            {
                var existingByIdempotency = await _unitOfWork.Payments.GetByUserAndIdempotencyKeyAsync(userId, idempotencyKey);
                if (existingByIdempotency is not null)
                {
                    return Result.Success(ToCheckoutDto(existingByIdempotency));
                }
            }

            var existingPayment = registration.Payment ?? await _unitOfWork.Payments.GetByRegistrationIdAsync(registrationId);
            if (existingPayment is not null)
            {
                if (existingPayment.Status == PaymentStatus.Completed)
                {
                    return Result.Failure<CreateCheckoutResponseDto>(new Error("Payment.AlreadyCompleted", "Thanh toan da hoan tat."));
                }

                if (existingPayment.Status == PaymentStatus.Pending)
                {
                    return Result.Success(ToCheckoutDto(existingPayment));
                }
            }

            var now = DateTime.UtcNow;
            var orderCode = GenerateOrderCode();
            var safeDescription = BuildSafeDescription(registrationId);
            var gatewayRequest = new PaymentGatewayCreateLinkRequestDto
            {
                OrderCode = orderCode,
                Amount = Convert.ToInt32(decimal.Round(registration.Workshop.Price, 0, MidpointRounding.AwayFromZero)),
                Description = safeDescription,
                ReturnUrl = $"http://localhost:5173/payment/result?registrationId={registrationId}",
                CancelUrl = $"http://localhost:5173/payment/cancel?registrationId={registrationId}"
            };

            var gatewayResult = await _paymentGateway.CreatePaymentLinkAsync(gatewayRequest);
            if (gatewayResult.IsFailure)
            {
                return Result.Failure<CreateCheckoutResponseDto>(gatewayResult.Error);
            }

            var payment = new Payment
            {
                RegistrationId = registration.Id,
                UserId = userId,
                Amount = registration.Workshop.Price,
                Status = PaymentStatus.Pending,
                IdempotencyKey = string.IsNullOrWhiteSpace(idempotencyKey) ? Guid.NewGuid().ToString("N") : idempotencyKey,
                GatewayTransactionId = orderCode.ToString(CultureInfo.InvariantCulture),
                GatewayResponse = gatewayResult.Value.RawResponse,
                ExpiredAt = now.AddMinutes(15)
            };

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                await _unitOfWork.Payments.AddAsync(payment);
                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }

            return Result.Success(ToCheckoutDto(payment, gatewayResult.Value.CheckoutUrl, gatewayResult.Value.PaymentLinkId, orderCode));
        }

        public async Task<Result<PaymentStatusDto>> GetByRegistrationAsync(Guid userId, Guid registrationId)
        {
            var registration = await _unitOfWork.Registrations.GetByIdWithWorkshopAsync(registrationId);
            if (registration is null)
            {
                return Result.Failure<PaymentStatusDto>(new Error("Registration.NotFound", "Khong tim thay dang ky."));
            }

            if (registration.UserId != userId)
            {
                return Result.Failure<PaymentStatusDto>(new Error("Registration.Forbidden", "Ban khong co quyen xem thanh toan nay."));
            }

            var payment = registration.Payment ?? await _unitOfWork.Payments.GetByRegistrationIdAsync(registrationId);
            if (payment is null)
            {
                return Result.Failure<PaymentStatusDto>(new Error("Payment.NotFound", "Chua co giao dich thanh toan cho dang ky nay."));
            }

            return Result.Success(ToStatusDto(payment));
        }

        public async Task<Result<bool>> HandlePayOsWebhookAsync(PayOsWebhookDto webhook)
        {
            var verified = await _paymentGateway.VerifyWebhookAsync(webhook);
            if (verified.IsFailure)
            {
                return Result.Failure<bool>(verified.Error);
            }

            var orderCode = verified.Value.OrderCode.ToString(CultureInfo.InvariantCulture);
            var payment = await _unitOfWork.Payments.GetByGatewayTransactionIdAsync(orderCode);
            if (payment is null)
            {
                return Result.Failure<bool>(new Error("Payment.NotFound", "Khong tim thay giao dich thanh toan."));
            }

            var registration = await _unitOfWork.Registrations.GetByIdWithWorkshopAsync(payment.RegistrationId);
            if (registration is null)
            {
                return Result.Failure<bool>(new Error("Registration.NotFound", "Khong tim thay dang ky lien quan."));
            }

            if (payment.Status is PaymentStatus.Completed or PaymentStatus.Failed or PaymentStatus.Timeout or PaymentStatus.Refunded)
            {
                return Result.Success(true);
            }

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                var isSuccess = webhook.Success && string.Equals(verified.Value.Code, "00", StringComparison.OrdinalIgnoreCase);
                payment.GatewayResponse = verified.Value.RawResponse;

                if (isSuccess)
                {
                    payment.Status = PaymentStatus.Completed;
                    payment.PaidAt = DateTime.UtcNow;

                    if (registration.Status == RegistrationStatus.Pending)
                    {
                        registration.Confirm($"REG-{registration.Id:N}");
                    }
                }
                else
                {
                    payment.Status = PaymentStatus.Failed;

                    if (registration.Status != RegistrationStatus.Cancelled)
                    {
                        registration.Cancel();
                        registration.Workshop.ReleaseSlot();
                    }
                }

                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }

            return Result.Success(true);
        }

        public async Task<Result<string>> ConfirmPayOsWebhookAsync(Guid actorUserId, string? webhookUrl, bool canConfirm)
        {
            if (!canConfirm)
            {
                return Result.Failure<string>(new Error("Payment.Forbidden", "Chi Organizer hoac Admin moi duoc phep cau hinh webhook."));
            }

            var result = await _paymentGateway.ConfirmWebhookAsync(webhookUrl);
            if (result.IsFailure)
            {
                return Result.Failure<string>(result.Error);
            }

            return Result.Success(result.Value);
        }

        public async Task<Result<PaymentStatusDto>> RefundAsync(Guid actorUserId, Guid paymentId, string? reason, bool canRefund)
        {
            if (!canRefund)
            {
                return Result.Failure<PaymentStatusDto>(new Error("Payment.Forbidden", "Chi Organizer moi duoc phep hoan tien."));
            }

            var payment = await _unitOfWork.Payments.GetByIdAsync(paymentId);
            if (payment is null)
            {
                return Result.Failure<PaymentStatusDto>(new Error("Payment.NotFound", "Khong tim thay giao dich thanh toan."));
            }

            if (payment.Status != PaymentStatus.Completed)
            {
                return Result.Failure<PaymentStatusDto>(new Error("Payment.InvalidState", "Chi giao dich da completed moi duoc refund."));
            }

            if (!long.TryParse(payment.GatewayTransactionId, out var orderCode))
            {
                return Result.Failure<PaymentStatusDto>(new Error("Payment.InvalidGatewayData", "Khong doc duoc order code de refund."));
            }

            var refundResult = await _paymentGateway.RefundAsync(new PaymentGatewayRefundRequestDto
            {
                OrderCode = orderCode,
                Amount = payment.Amount,
                Reason = string.IsNullOrWhiteSpace(reason) ? "Refund by organizer" : reason.Trim()
            });

            if (refundResult.IsFailure)
            {
                return Result.Failure<PaymentStatusDto>(refundResult.Error);
            }

            var registration = await _unitOfWork.Registrations.GetByIdWithWorkshopAsync(payment.RegistrationId);
            if (registration is null)
            {
                return Result.Failure<PaymentStatusDto>(new Error("Registration.NotFound", "Khong tim thay dang ky lien quan."));
            }

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                payment.Status = PaymentStatus.Refunded;
                payment.GatewayResponse = refundResult.Value;

                if (registration.Status != RegistrationStatus.Cancelled)
                {
                    registration.Cancel();
                    registration.Workshop.ReleaseSlot();
                }

                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }

            return Result.Success(ToStatusDto(payment));
        }

        private static CreateCheckoutResponseDto ToCheckoutDto(
            Payment payment,
            string? checkoutUrl = null,
            string? paymentLinkId = null,
            long? orderCode = null)
        {
            var derivedCheckoutUrl = checkoutUrl ?? TryReadJsonField(payment.GatewayResponse, "checkoutUrl", "checkout_url");
            var derivedPaymentLinkId = paymentLinkId ?? TryReadJsonField(payment.GatewayResponse, "paymentLinkId", "payment_link_id", "id");

            long parsedOrderCode = 0;
            if (orderCode.HasValue)
            {
                parsedOrderCode = orderCode.Value;
            }
            else if (!long.TryParse(payment.GatewayTransactionId, out parsedOrderCode))
            {
                parsedOrderCode = 0;
            }

            return new CreateCheckoutResponseDto
            {
                RegistrationId = payment.RegistrationId,
                PaymentId = payment.Id,
                PaymentStatus = MapPaymentStatus(payment.Status),
                Amount = payment.Amount,
                CheckoutUrl = derivedCheckoutUrl ?? string.Empty,
                PaymentLinkId = derivedPaymentLinkId,
                OrderCode = parsedOrderCode,
                ExpiresAt = payment.ExpiredAt
            };
        }

        private static PaymentStatusDto ToStatusDto(Payment payment)
        {
            return new PaymentStatusDto
            {
                RegistrationId = payment.RegistrationId,
                PaymentId = payment.Id,
                Status = MapPaymentStatus(payment.Status),
                Amount = payment.Amount,
                PaidAt = payment.PaidAt,
                ExpiredAt = payment.ExpiredAt,
                GatewayTransactionId = payment.GatewayTransactionId,
                CheckoutUrl = TryReadJsonField(payment.GatewayResponse, "checkoutUrl", "checkout_url")
            };
        }

        private static string MapPaymentStatus(PaymentStatus status)
        {
            return status switch
            {
                PaymentStatus.Pending => "PENDING",
                PaymentStatus.Completed => "COMPLETED",
                PaymentStatus.Failed => "FAILED",
                PaymentStatus.Refunded => "REFUNDED",
                PaymentStatus.Timeout => "TIMEOUT",
                _ => "PENDING"
            };
        }

        private static string BuildSafeDescription(Guid registrationId)
        {
            var text = $"REG-{registrationId:N}";
            return text.Length <= 25 ? text : text[..25];
        }

        private static long GenerateOrderCode()
        {
            var seconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var suffix = Random.Shared.Next(100, 999);
            return long.Parse($"{seconds}{suffix}", CultureInfo.InvariantCulture);
        }

        private static string? TryReadJsonField(string? json, params string[] candidates)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return null;
            }

            try
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                foreach (var key in candidates)
                {
                    if (root.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String)
                    {
                        return value.GetString();
                    }
                }

                if (root.TryGetProperty("data", out var dataElement) && dataElement.ValueKind == JsonValueKind.Object)
                {
                    foreach (var key in candidates)
                    {
                        if (dataElement.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String)
                        {
                            return value.GetString();
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
    }
}