using Application.Features.Auth;
using Application.Features.Interfaces;
using Application.Abstractions;
using Domain;
using Domain.Entities;
using Domain.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        // Injected only for dev-pipeline endpoints (dev-only utilities)
        private readonly IHostEnvironment _environment;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;

        public AuthController(
            IAuthService authService,
            IHostEnvironment environment,
            IJwtTokenService jwtTokenService,
            RoleManager<IdentityRole<Guid>> roleManager)
        {
            _authService = authService;
            _environment = environment;
            _jwtTokenService = jwtTokenService;
            _roleManager = roleManager;
        }

        // ── Auth endpoints ────────────────────────────────────────────────────

        [HttpPost("signup")]
        [AllowAnonymous]
        public async Task<IActionResult> SignUp([FromBody] SignUpRequest request)
        {
            var result = await _authService.SignUpAsync(request);

            if (result.IsFailure)
            {
                return result.Error.Code switch
                {
                    "Auth.EmailExists" => ProblemResponse(StatusCodes.Status409Conflict, "Xung dot du lieu.", result.Error.Message),
                    _ => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message)
                };
            }

            var data = result.Value;
            return Ok(new
            {
                message = "Dang ky thanh cong.",
                user = new
                {
                    id = data.Id,
                    email = data.Email,
                    fullName = data.FullName,
                    studentId = data.StudentId,
                    role = data.Role
                }
            });
        }

        [HttpPost("signin")]
        [AllowAnonymous]
        public async Task<IActionResult> SignIn([FromBody] SignInRequest request)
        {
            var result = await _authService.SignInAsync(request);

            if (result.IsFailure)
            {
                return ProblemResponse(StatusCodes.Status401Unauthorized, "Chua xac thuc.", result.Error.Message);
            }

            var data = result.Value;
            return Ok(new
            {
                accessToken = data.AccessToken,
                tokenType = data.TokenType,
                user = new
                {
                    id = data.UserId,
                    email = data.Email,
                    fullName = data.FullName,
                    studentId = data.StudentId,
                    role = data.Role
                }
            });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var userIdValue = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdValue, out var userId))
            {
                return ProblemResponse(StatusCodes.Status401Unauthorized, "Chua xac thuc.", "Token khong hop le.");
            }

            var result = await _authService.GetMeAsync(userId);

            if (result.IsFailure)
            {
                return ProblemResponse(StatusCodes.Status404NotFound, "Khong tim thay tai nguyen.", result.Error.Message);
            }

            var data = result.Value;
            return Ok(new
            {
                id = data.Id,
                email = data.Email,
                fullName = data.FullName,
                studentId = data.StudentId,
                role = data.Role,
                claims = new
                {
                    sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub),
                    email = User.FindFirstValue(JwtRegisteredClaimNames.Email),
                    name = User.FindFirstValue("name") ?? User.FindFirstValue(ClaimTypes.Name),
                    role = User.FindFirstValue("role") ?? User.FindFirstValue(ClaimTypes.Role)
                }
            });
        }

        // ── Dev-pipeline endpoints (merged from AuthPipelineController) ───────

        [HttpPost("/api/auth-pipeline/dev-token")]
        [AllowAnonymous]
        public IActionResult IssueDevelopmentToken()
        {
            if (!_environment.IsDevelopment())
            {
                return NotFound();
            }

            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "student@unihub.local",
                UserName = "student.dev",
                FullName = "Sinh vien test",
                Role = UserRole.Student
            };

            var accessToken = _jwtTokenService.GenerateToken(user);

            return Ok(new
            {
                accessToken,
                tokenType = "Bearer",
                claims = new
                {
                    sub = user.Id,
                    email = user.Email,
                    name = user.FullName,
                    role = "STUDENT"
                }
            });
        }

        [HttpGet("/api/auth-pipeline/secure")]
        [Authorize]
        public IActionResult GetSecureProbe()
        {
            return Ok(new
            {
                message = "JWT authentication pipeline hoat dong.",
                claims = new
                {
                    sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier),
                    email = User.FindFirstValue(JwtRegisteredClaimNames.Email),
                    name = User.FindFirstValue("name") ?? User.FindFirstValue(ClaimTypes.Name),
                    role = User.FindFirstValue("role") ?? User.FindFirstValue(ClaimTypes.Role)
                }
            });
        }

        [HttpGet("/api/auth-pipeline/dev-roles")]
        [AllowAnonymous]
        public IActionResult GetSeededRoles()
        {
            if (!_environment.IsDevelopment())
            {
                return NotFound();
            }

            var roles = _roleManager.Roles
                .Select(r => r.Name)
                .Where(r => !string.IsNullOrWhiteSpace(r))
                .OrderBy(r => r)
                .ToArray();

            return Ok(new
            {
                count = roles.Length,
                roles
            });
        }

        // ── Helpers ───────────────────────────────────────────────────────────

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
