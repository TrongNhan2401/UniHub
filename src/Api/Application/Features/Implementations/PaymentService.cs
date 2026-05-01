using Application.Abstractions;
using Application.DTOs.Payment;
using Application.Features.Interfaces;
using Domain;
using Domain.Entities;
using Domain.Shared;

namespace Application.Features.Implementations
{
    public class PaymentService : IPaymentService
    {
        private readonly IPaymentGatewayService _paymentGatewayService;
        private readonly IUnitOfWork _unitOfWork;

        public PaymentService(IUnitOfWork unitOfWork, IPaymentGatewayService paymentGatewayService)
        {
            _unitOfWork = unitOfWork;
            _paymentGatewayService = paymentGatewayService;
        }

        public async Task<Result<PaymentCheckoutDto>> InitiateAsync(Guid registrationId, Guid currentUserId, bool isOrganizer)
        {
            var registration = await _unitOfWork.Registrations.GetByIdAsync(registrationId, asNoTracking: false);
            if (registration is null)
            {
                return Result.Failure<PaymentCheckoutDto>(new Error("Registration.NotFound", "Khong tim thay dang ky."));
            }

            if (!isOrganizer && registration.UserId != currentUserId)
            {
                return Result.Failure<PaymentCheckoutDto>(new Error("Payment.Forbidden", "Ban khong co quyen thao tac thanh toan nay."));
            }

            if (registration.Workshop.IsFree)
            {
                return Result.Failure<PaymentCheckoutDto>(new Error("Payment.NotRequired", "Workshop mien phi khong can thanh toan."));
            }

            if (registration.Status == RegistrationStatus.Cancelled)
            {
                return Result.Failure<PaymentCheckoutDto>(new Error("Payment.InvalidStatus", "Dang ky da bi huy, khong the thanh toan."));
            }

            var payment = registration.Payment ?? await _unitOfWork.Payments.GetByRegistrationIdAsync(registrationId, asNoTracking: false);

            if (payment is null)
            {
                payment = Payment.Create(
                    registration.Id,
                    registration.UserId,
                    registration.Workshop.Price,
                    Guid.NewGuid().ToString("N"),
                    DateTime.UtcNow.AddMinutes(15));

                await _unitOfWork.Payments.AddAsync(payment);
                await _unitOfWork.SaveChangesAsync();

                payment = await _unitOfWork.Payments.GetByRegistrationIdAsync(registrationId, asNoTracking: false);
            }

            if (payment is null)
            {
                return Result.Failure<PaymentCheckoutDto>(new Error("Payment.NotFound", "Khong tao duoc phien thanh toan."));
            }

            if (payment.Status == PaymentStatus.Completed)
            {
                return Result.Failure<PaymentCheckoutDto>(new Error("Payment.AlreadyCompleted", "Thanh toan nay da hoan tat."));
            }

            if (payment.Status == PaymentStatus.Refunded)
            {
                return Result.Failure<PaymentCheckoutDto>(new Error("Payment.InvalidStatus", "Thanh toan da duoc hoan tien."));
            }

            var checkout = await _paymentGatewayService.CreateCheckoutAsync(new PaymentGatewayCheckoutRequest
            {
                PaymentId = payment.Id,
                RegistrationId = registration.Id,
                Amount = payment.Amount,
                CustomerEmail = registration.User.Email ?? string.Empty,
                IdempotencyKey = payment.IdempotencyKey ?? Guid.NewGuid().ToString("N")
            });

            payment.MarkPending(checkout.GatewayTransactionId, checkout.RawResponse, DateTime.UtcNow.AddMinutes(15));
            await _unitOfWork.SaveChangesAsync();

            var refreshed = await _unitOfWork.Payments.GetByIdAsync(payment.Id);
            if (refreshed is null)
            {
                return Result.Failure<PaymentCheckoutDto>(new Error("Payment.NotFound", "Khong tim thay thanh toan sau khi khoi tao."));
            }

            return Result.Success(new PaymentCheckoutDto
            {
                Payment = ToDto(refreshed),
                CheckoutUrl = checkout.CheckoutUrl,
                ProviderName = checkout.ProviderName,
                IsSimulator = true,
                RequiresAdditionalFee = checkout.RequiresAdditionalFee
            });
        }

        public async Task<Result<PaymentDto>> GetByIdAsync(Guid paymentId, Guid currentUserId, bool isOrganizer)
        {
            var payment = await _unitOfWork.Payments.GetByIdAsync(paymentId);
            if (payment is null)
            {
                return Result.Failure<PaymentDto>(new Error("Payment.NotFound", "Khong tim thay thanh toan."));
            }

            if (!isOrganizer && payment.UserId != currentUserId)
            {
                return Result.Failure<PaymentDto>(new Error("Payment.Forbidden", "Ban khong co quyen xem thanh toan nay."));
            }

            return Result.Success(ToDto(payment));
        }

        public async Task<Result<PaymentDto>> HandleWebhookAsync(PaymentWebhookRequestDto request)
        {
            if (request.PaymentId is null && string.IsNullOrWhiteSpace(request.GatewayTransactionId))
            {
                return Result.Failure<PaymentDto>(new Error("Payment.InvalidRequest", "Can cung cap paymentId hoac gatewayTransactionId."));
            }

            if (!Enum.TryParse<PaymentStatus>(request.Status, true, out var webhookStatus))
            {
                return Result.Failure<PaymentDto>(new Error("Payment.InvalidStatus", "Gia tri status webhook khong hop le."));
            }

            var payment = request.PaymentId.HasValue
                ? await _unitOfWork.Payments.GetByIdAsync(request.PaymentId.Value, asNoTracking: false)
                : await _unitOfWork.Payments.GetByGatewayTransactionIdAsync(request.GatewayTransactionId!, asNoTracking: false);

            if (payment is null)
            {
                return Result.Failure<PaymentDto>(new Error("Payment.NotFound", "Khong tim thay thanh toan de cap nhat."));
            }

            if (webhookStatus == PaymentStatus.Refunded)
            {
                return Result.Failure<PaymentDto>(new Error("Payment.InvalidStatus", "Webhook nay khong dung cho hoan tien."));
            }

            var gatewayTransactionId = string.IsNullOrWhiteSpace(request.GatewayTransactionId)
                ? payment.GatewayTransactionId ?? string.Empty
                : request.GatewayTransactionId.Trim();

            await _unitOfWork.BeginTransactionAsync();

            try
            {
                switch (webhookStatus)
                {
                    case PaymentStatus.Completed:
                        payment.MarkCompleted(gatewayTransactionId, request.Message ?? "Payment completed.", DateTime.UtcNow);

                        if (payment.Registration.Status != RegistrationStatus.Confirmed)
                        {
                            payment.Registration.Confirm(
                                GenerateQrCode(payment.Registration.Id),
                                GenerateQrToken());
                        }
                        break;

                    case PaymentStatus.Failed:
                        payment.MarkFailed(request.Message ?? "Payment failed.");
                        break;

                    case PaymentStatus.Timeout:
                        payment.MarkTimedOut(request.Message ?? "Payment timeout.");
                        break;

                    default:
                        await _unitOfWork.RollbackTransactionAsync();
                        return Result.Failure<PaymentDto>(new Error("Payment.InvalidStatus", "Webhook chi ho tro Completed, Failed, Timeout."));
                }

                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return Result.Failure<PaymentDto>(new Error("Payment.WebhookFailed", ex.Message));
            }

            var refreshed = await _unitOfWork.Payments.GetByIdAsync(payment.Id);
            if (refreshed is null)
            {
                return Result.Failure<PaymentDto>(new Error("Payment.NotFound", "Khong tim thay thanh toan sau webhook."));
            }

            return Result.Success(ToDto(refreshed));
        }

        public async Task<Result<PaymentDto>> RefundAsync(Guid paymentId, Guid currentUserId, bool isOrganizer, string? reason)
        {
            if (!isOrganizer)
            {
                return Result.Failure<PaymentDto>(new Error("Payment.Forbidden", "Chi organizer moi duoc hoan tien."));
            }

            var payment = await _unitOfWork.Payments.GetByIdAsync(paymentId, asNoTracking: false);
            if (payment is null)
            {
                return Result.Failure<PaymentDto>(new Error("Payment.NotFound", "Khong tim thay thanh toan."));
            }

            if (payment.Status != PaymentStatus.Completed)
            {
                return Result.Failure<PaymentDto>(new Error("Payment.InvalidStatus", "Chi co the hoan tien cho thanh toan da hoan tat."));
            }

            var refund = await _paymentGatewayService.RefundAsync(new PaymentGatewayRefundRequest
            {
                PaymentId = payment.Id,
                GatewayTransactionId = payment.GatewayTransactionId ?? string.Empty,
                Amount = payment.Amount,
                Reason = reason
            });

            await _unitOfWork.BeginTransactionAsync();

            try
            {
                payment.MarkRefunded(refund.RawResponse);

                if (payment.Registration.Status != RegistrationStatus.Cancelled)
                {
                    payment.Registration.Cancel();
                    await _unitOfWork.Workshops.TryReleaseSlotAsync(payment.Registration.WorkshopId);
                }

                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return Result.Failure<PaymentDto>(new Error("Payment.RefundFailed", ex.Message));
            }

            var refreshed = await _unitOfWork.Payments.GetByIdAsync(payment.Id);
            if (refreshed is null)
            {
                return Result.Failure<PaymentDto>(new Error("Payment.NotFound", "Khong tim thay thanh toan sau khi hoan tien."));
            }

            return Result.Success(ToDto(refreshed));
        }

        private static PaymentDto ToDto(Payment payment)
        {
            return new PaymentDto
            {
                Id = payment.Id,
                RegistrationId = payment.RegistrationId,
                UserId = payment.UserId,
                WorkshopId = payment.Registration.WorkshopId,
                WorkshopTitle = payment.Registration.Workshop.Title,
                Amount = payment.Amount,
                Status = payment.Status.ToString().ToUpperInvariant(),
                RegistrationStatus = payment.Registration.Status.ToString().ToUpperInvariant(),
                GatewayTransactionId = payment.GatewayTransactionId,
                GatewayResponse = payment.GatewayResponse,
                RetryCount = payment.RetryCount,
                PaidAt = payment.PaidAt,
                ExpiredAt = payment.ExpiredAt,
                CreatedAt = payment.CreatedAt
            };
        }

        private static string GenerateQrCode(Guid registrationId)
        {
            return $"REG-{registrationId:N}";
        }

        private static string GenerateQrToken()
        {
            return Convert.ToBase64String(Guid.NewGuid().ToByteArray())
                .Replace("+", string.Empty)
                .Replace("/", string.Empty)
                .Replace("=", string.Empty);
        }
    }
}