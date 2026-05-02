using Application.DTOs.Registration;
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
    public class RegistrationsController : ControllerBase
    {
        private readonly IRegistrationService _registrationService;

        public RegistrationsController(IRegistrationService registrationService)
        {
            _registrationService = registrationService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateRegistrationRequestDto request)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return ProblemResponse(StatusCodes.Status401Unauthorized, "Chua xac thuc.", "Token khong hop le.");
            }

            var idempotencyKey = Request.Headers["Idempotency-Key"].ToString();
            var result = await _registrationService.CreateAsync(userId, request, idempotencyKey);

            if (result.IsFailure)
            {
                return result.Error.Code switch
                {
                    "Registration.NoSlots" => ProblemResponse(StatusCodes.Status409Conflict, "Xung dot du lieu.", result.Error.Message),
                    "Registration.AlreadyRegistered" => ProblemResponse(StatusCodes.Status409Conflict, "Xung dot du lieu.", result.Error.Message),
                    "Workshop.NotFound" => ProblemResponse(StatusCodes.Status404NotFound, "Khong tim thay tai nguyen.", result.Error.Message),
                    _ => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message)
                };
            }

            var data = result.Value;
            if (data.PaymentStatus == "NOT_REQUIRED")
            {
                return StatusCode(StatusCodes.Status201Created, data);
            }

            return Accepted(data);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return ProblemResponse(StatusCodes.Status401Unauthorized, "Chua xac thuc.", "Token khong hop le.");
            }

            var result = await _registrationService.GetByIdAsync(userId, id);
            if (result.IsFailure)
            {
                return result.Error.Code switch
                {
                    "Registration.NotFound" => ProblemResponse(StatusCodes.Status404NotFound, "Khong tim thay tai nguyen.", result.Error.Message),
                    "Registration.Forbidden" => ProblemResponse(StatusCodes.Status403Forbidden, "Khong co quyen truy cap.", result.Error.Message),
                    _ => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message)
                };
            }

            return Ok(result.Value);
        }

        [HttpGet("mine")]
        public async Task<IActionResult> GetMine()
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return ProblemResponse(StatusCodes.Status401Unauthorized, "Chua xac thuc.", "Token khong hop le.");
            }

            var result = await _registrationService.GetMineAsync(userId);
            if (result.IsFailure)
            {
                return ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message);
            }

            return Ok(result.Value);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Cancel(Guid id)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return ProblemResponse(StatusCodes.Status401Unauthorized, "Chua xac thuc.", "Token khong hop le.");
            }

            var result = await _registrationService.CancelAsync(userId, id);
            if (result.IsFailure)
            {
                return result.Error.Code switch
                {
                    "Registration.NotFound" => ProblemResponse(StatusCodes.Status404NotFound, "Khong tim thay tai nguyen.", result.Error.Message),
                    "Registration.Forbidden" => ProblemResponse(StatusCodes.Status403Forbidden, "Khong co quyen truy cap.", result.Error.Message),
                    _ => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message)
                };
            }

            return NoContent();
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
