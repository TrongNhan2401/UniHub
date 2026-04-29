using Application.Abstractions;
using Application.Features.Registrations;
using Domain.Shared;
using Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/registrations")]
    [Authorize(Policy = AppPolicies.RegistrationCreate)]
    public class RegistrationsController : ControllerBase
    {
        private readonly IRegistrationService _registrationService;

        public RegistrationsController(IRegistrationService registrationService)
        {
            _registrationService = registrationService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateRegistration(
            [FromBody] CreateRegistrationRequest request,
            CancellationToken ct)
        {
            var errors = ValidateRequest(request);
            if (errors.Count > 0)
            {
                return ProblemResponse(
                    StatusCodes.Status400BadRequest,
                    "Yeu cau khong hop le.",
                    "Noi dung request khong hop le.",
                    errors);
            }

            var idempotencyKey = Request.Headers["Idempotency-Key"].FirstOrDefault()?.Trim();
            if (string.IsNullOrWhiteSpace(idempotencyKey))
            {
                return ProblemResponse(
                    StatusCodes.Status400BadRequest,
                    "Yeu cau khong hop le.",
                    "Header Idempotency-Key la bat buoc.");
            }

            var userIdValue = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdValue, out var userId))
            {
                return ProblemResponse(
                    StatusCodes.Status401Unauthorized,
                    "Chua xac thuc.",
                    "Token khong hop le.");
            }

            var command = new CreateRegistrationCommand
            {
                UserId = userId,
                WorkshopId = request.WorkshopId,
                IdempotencyKey = idempotencyKey
            };

            try
            {
                var result = await _registrationService.CreateAsync(command, ct);
                return StatusCode(StatusCodes.Status201Created, result);
            }
            catch (RegistrationDomainException ex)
            {
                return ProblemResponse(ex.StatusCode, ex.Title, ex.Detail);
            }
        }

        private static List<string> ValidateRequest(CreateRegistrationRequest request)
        {
            var errors = new List<string>();

            if (request.WorkshopId == Guid.Empty)
                errors.Add("Gia tri workshopId khong hop le.");

            return errors;
        }

        private ObjectResult ProblemResponse(int statusCode, string title, string detail, IEnumerable<string>? errors = null)
        {
            var problem = new ProblemDetails
            {
                Status = statusCode,
                Title = title,
                Detail = detail,
                Type = $"https://httpstatuses.com/{statusCode}"
            };

            problem.Extensions["traceId"] = HttpContext.TraceIdentifier;

            if (errors is not null)
                problem.Extensions["errors"] = errors.ToArray();

            return StatusCode(statusCode, problem);
        }
    }

    public sealed class CreateRegistrationRequest
    {
        public Guid WorkshopId { get; set; }
    }
}
