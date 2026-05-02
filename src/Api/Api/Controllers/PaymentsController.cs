using Application.DTOs.Payment;
using Application.Features.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/payments")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentsController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpPost("registrations/{registrationId:guid}/checkout")]
        public async Task<IActionResult> CreateCheckout(Guid registrationId)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return ProblemResponse(StatusCodes.Status401Unauthorized, "Chua xac thuc.", "Token khong hop le.");
            }

            var idempotencyKey = Request.Headers["Idempotency-Key"].ToString();
            var result = await _paymentService.CreateCheckoutAsync(userId, registrationId, idempotencyKey);

            if (result.IsFailure)
            {
                return result.Error.Code switch
                {
                    "Registration.NotFound" => ProblemResponse(StatusCodes.Status404NotFound, "Khong tim thay tai nguyen.", result.Error.Message),
                    "Registration.Forbidden" => ProblemResponse(StatusCodes.Status403Forbidden, "Khong co quyen truy cap.", result.Error.Message),
                    "Payment.NotRequired" => ProblemResponse(StatusCodes.Status409Conflict, "Xung dot du lieu.", result.Error.Message),
                    "Payment.AlreadyCompleted" => ProblemResponse(StatusCodes.Status409Conflict, "Xung dot du lieu.", result.Error.Message),
                    "Payment.GatewayUnavailable" => ProblemResponse(StatusCodes.Status503ServiceUnavailable, "Dich vu tam thoi gian doan.", result.Error.Message),
                    _ => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message)
                };
            }

            return Ok(result.Value);
        }

        [HttpGet("registrations/{registrationId:guid}")]
        public async Task<IActionResult> GetByRegistration(Guid registrationId)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return ProblemResponse(StatusCodes.Status401Unauthorized, "Chua xac thuc.", "Token khong hop le.");
            }

            var result = await _paymentService.GetByRegistrationAsync(userId, registrationId);
            if (result.IsFailure)
            {
                return result.Error.Code switch
                {
                    "Registration.NotFound" => ProblemResponse(StatusCodes.Status404NotFound, "Khong tim thay tai nguyen.", result.Error.Message),
                    "Payment.NotFound" => ProblemResponse(StatusCodes.Status404NotFound, "Khong tim thay tai nguyen.", result.Error.Message),
                    "Registration.Forbidden" => ProblemResponse(StatusCodes.Status403Forbidden, "Khong co quyen truy cap.", result.Error.Message),
                    _ => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message)
                };
            }

            return Ok(result.Value);
        }

        [AllowAnonymous]
        [HttpPost("webhook/payos")]
        public async Task<IActionResult> PayOsWebhook([FromBody] PayOsWebhookDto webhook)
        {
            var result = await _paymentService.HandlePayOsWebhookAsync(webhook);
            if (result.IsFailure)
            {
                if (result.Error.Code == "Payment.NotFound")
                {
                    // Ack 200 to prevent webhook provider from retrying forever for unknown records.
                    return Ok(new { ok = true, acknowledged = true });
                }

                return ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message);
            }

            return Ok(new { ok = true });
        }

        [HttpPost("webhook/payos/confirm")]
        public async Task<IActionResult> ConfirmWebhook([FromBody] ConfirmWebhookRequestDto request)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return ProblemResponse(StatusCodes.Status401Unauthorized, "Chua xac thuc.", "Token khong hop le.");
            }

            var canConfirm = User.IsInRole("ORGANIZER") || User.IsInRole("ADMIN");
            var result = await _paymentService.ConfirmPayOsWebhookAsync(userId, request?.WebhookUrl, canConfirm);
            if (result.IsFailure)
            {
                return result.Error.Code switch
                {
                    "Payment.Forbidden" => ProblemResponse(StatusCodes.Status403Forbidden, "Khong co quyen truy cap.", result.Error.Message),
                    "Payment.InvalidWebhookUrl" => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message),
                    "Payment.WebhookConfirmFailed" => ProblemResponse(StatusCodes.Status502BadGateway, "Loi cong thanh toan.", result.Error.Message),
                    _ => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message)
                };
            }

            return Ok(new
            {
                message = "Confirm webhook PayOS thanh cong.",
                provider = "PayOS",
                result = result.Value
            });
        }

        [HttpPost("{paymentId:guid}/refund")]
        public async Task<IActionResult> Refund(Guid paymentId, [FromBody] RefundPaymentRequestDto request)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return ProblemResponse(StatusCodes.Status401Unauthorized, "Chua xac thuc.", "Token khong hop le.");
            }

            var canRefund = User.IsInRole("ORGANIZER") || User.IsInRole("ADMIN");
            var result = await _paymentService.RefundAsync(userId, paymentId, request?.Reason, canRefund);
            if (result.IsFailure)
            {
                return result.Error.Code switch
                {
                    "Payment.NotFound" => ProblemResponse(StatusCodes.Status404NotFound, "Khong tim thay tai nguyen.", result.Error.Message),
                    "Payment.Forbidden" => ProblemResponse(StatusCodes.Status403Forbidden, "Khong co quyen truy cap.", result.Error.Message),
                    "Payment.RefundFailed" => ProblemResponse(StatusCodes.Status502BadGateway, "Loi cong thanh toan.", result.Error.Message),
                    _ => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message)
                };
            }

            return Ok(result.Value);
        }

        private bool TryGetCurrentUserId(out Guid userId)
        {
            var userIdValue = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

            return Guid.TryParse(userIdValue, out userId);
        }

        private ObjectResult ProblemResponse(int statusCode, string title, string detail)
        {
            var problem = new ProblemDetails
            {
                Status = statusCode,
                Title = title,
                Detail = detail,
                Type = $"https://httpstatuses.com/{statusCode}"
            };
            problem.Extensions["traceId"] = HttpContext.TraceIdentifier;

            return StatusCode(statusCode, problem);
        }
    }
}