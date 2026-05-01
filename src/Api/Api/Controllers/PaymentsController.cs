using Application.DTOs.Payment;
using Application.Features.Interfaces;
using Domain.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentsController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpPost("registration/{registrationId:guid}")]
        public async Task<IActionResult> Initiate(Guid registrationId)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return ProblemResponse(StatusCodes.Status401Unauthorized, "Chua xac thuc.", "Token khong hop le.");
            }

            var result = await _paymentService.InitiateAsync(registrationId, userId, IsOrganizer());
            if (result.IsFailure)
            {
                return MapFailure(result.Error);
            }

            return Ok(result.Value);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return ProblemResponse(StatusCodes.Status401Unauthorized, "Chua xac thuc.", "Token khong hop le.");
            }

            var result = await _paymentService.GetByIdAsync(id, userId, IsOrganizer());
            if (result.IsFailure)
            {
                return MapFailure(result.Error);
            }

            return Ok(result.Value);
        }

        [AllowAnonymous]
        [HttpPost("webhook")]
        public async Task<IActionResult> Webhook([FromBody] PaymentWebhookRequestDto request)
        {
            var result = await _paymentService.HandleWebhookAsync(request);
            if (result.IsFailure)
            {
                return MapFailure(result.Error);
            }

            return Ok(result.Value);
        }

        [HttpPost("{id:guid}/refund")]
        [Authorize(Roles = "ORGANIZER")]
        public async Task<IActionResult> Refund(Guid id, [FromBody] RefundPaymentRequestDto? request)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return ProblemResponse(StatusCodes.Status401Unauthorized, "Chua xac thuc.", "Token khong hop le.");
            }

            var result = await _paymentService.RefundAsync(id, userId, IsOrganizer(), request?.Reason);
            if (result.IsFailure)
            {
                return MapFailure(result.Error);
            }

            return Ok(result.Value);
        }

        private bool TryGetCurrentUserId(out Guid userId)
        {
            var userIdValue = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

            return Guid.TryParse(userIdValue, out userId);
        }

        private bool IsOrganizer()
        {
            var role = User.FindFirstValue("role") ?? User.FindFirstValue(ClaimTypes.Role);
            return string.Equals(role, "ORGANIZER", StringComparison.OrdinalIgnoreCase);
        }

        private IActionResult MapFailure(Error error)
        {
            return error.Code switch
            {
                "Payment.NotFound" => ProblemResponse(StatusCodes.Status404NotFound, "Khong tim thay tai nguyen.", error.Message),
                "Registration.NotFound" => ProblemResponse(StatusCodes.Status404NotFound, "Khong tim thay tai nguyen.", error.Message),
                "Payment.Forbidden" => ProblemResponse(StatusCodes.Status403Forbidden, "Khong co quyen truy cap.", error.Message),
                "Payment.AlreadyCompleted" => ProblemResponse(StatusCodes.Status409Conflict, "Xung dot du lieu.", error.Message),
                _ => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", error.Message)
            };
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