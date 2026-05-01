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
        public async Task<IActionResult> Create(
            [FromBody] CreateRegistrationRequestDto request,
            [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return ProblemResponse(StatusCodes.Status401Unauthorized, "Chua xac thuc.", "Token khong hop le.");
            }

            var result = await _registrationService.CreateAsync(userId, request, idempotencyKey);

            if (result.IsFailure)
            {
                return MapFailure(result.Error);
            }

            var statusCode = result.Value.IsFreeWorkshop
                ? StatusCodes.Status201Created
                : StatusCodes.Status202Accepted;

            return StatusCode(statusCode, result.Value);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return ProblemResponse(StatusCodes.Status401Unauthorized, "Chua xac thuc.", "Token khong hop le.");
            }

            var result = await _registrationService.GetByIdAsync(id, userId, IsOrganizer());

            if (result.IsFailure)
            {
                return MapFailure(result.Error);
            }

            return Ok(result.Value);
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMine()
        {
            if (!TryGetCurrentUserId(out var userId))
            {
                return ProblemResponse(StatusCodes.Status401Unauthorized, "Chua xac thuc.", "Token khong hop le.");
            }

            var result = await _registrationService.GetMineAsync(userId);

            if (result.IsFailure)
            {
                return MapFailure(result.Error);
            }

            return Ok(result.Value);
        }

        [HttpGet]
        [Authorize(Roles = "ORGANIZER")]
        public async Task<IActionResult> GetPaged(
            [FromQuery] Guid? workshopId = null,
            [FromQuery] string? status = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await _registrationService.GetPagedAsync(workshopId, status, pageNumber, pageSize);

            if (result.IsFailure)
            {
                return MapFailure(result.Error);
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

            var result = await _registrationService.CancelAsync(id, userId, IsOrganizer());

            if (result.IsFailure)
            {
                return MapFailure(result.Error);
            }

            return NoContent();
        }

        [HttpGet("export")]
        [Authorize(Roles = "ORGANIZER")]
        public async Task<IActionResult> ExportCsv([FromQuery] Guid workshopId)
        {
            var result = await _registrationService.ExportCsvAsync(workshopId);

            if (result.IsFailure)
            {
                return MapFailure(result.Error);
            }

            return File(result.Value.Content, result.Value.ContentType, result.Value.FileName);
        }

        [HttpPost("{id:guid}/qr/regenerate")]
        [Authorize(Roles = "ORGANIZER")]
        public async Task<IActionResult> RegenerateQr(Guid id)
        {
            var result = await _registrationService.RegenerateQrAsync(id);

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
                "Registration.NotFound" => ProblemResponse(StatusCodes.Status404NotFound, "Khong tim thay tai nguyen.", error.Message),
                "Workshop.NotFound" => ProblemResponse(StatusCodes.Status404NotFound, "Khong tim thay tai nguyen.", error.Message),
                "Registration.Forbidden" => ProblemResponse(StatusCodes.Status403Forbidden, "Khong co quyen truy cap.", error.Message),
                "Registration.AlreadyExists" => ProblemResponse(StatusCodes.Status409Conflict, "Xung dot du lieu.", error.Message),
                "Registration.NoSlots" => ProblemResponse(StatusCodes.Status409Conflict, "Xung dot du lieu.", error.Message),
                "Registration.AlreadyCancelled" => ProblemResponse(StatusCodes.Status409Conflict, "Xung dot du lieu.", error.Message),
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