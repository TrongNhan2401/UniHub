using Application.Abstractions;
using Domain;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IJwtTokenService _jwtTokenService;

        public AuthController(UserManager<AppUser> userManager, IJwtTokenService jwtTokenService)
        {
            _userManager = userManager;
            _jwtTokenService = jwtTokenService;
        }

        [HttpPost("signup")]
        [AllowAnonymous]
        public async Task<IActionResult> SignUp([FromBody] SignUpRequest request)
        {
            var roleText = string.IsNullOrWhiteSpace(request.Role)
                ? "STUDENT"
                : request.Role.Trim().ToUpperInvariant();

            if (!TryMapRole(roleText, out var roleEnum))
            {
                return ProblemResponse(
                    StatusCodes.Status400BadRequest,
                    "Yeu cau khong hop le.",
                    "Role khong hop le.",
                    new[] { "Gia tri role phai la STUDENT, ORGANIZER hoac CHECKIN_STAFF." });
            }

            if (await _userManager.FindByEmailAsync(request.Email) is not null)
            {
                return ProblemResponse(
                    StatusCodes.Status409Conflict,
                    "Xung dot du lieu.",
                    "Email da ton tai.");
            }

            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = request.Email.Trim(),
                UserName = request.Email.Trim(),
                FullName = request.FullName.Trim(),
                StudentId = request.StudentId?.Trim() ?? string.Empty,
                Role = roleEnum
            };

            var createResult = await _userManager.CreateAsync(user, request.Password);
            if (!createResult.Succeeded)
            {
                return ProblemResponse(
                    StatusCodes.Status400BadRequest,
                    "Yeu cau khong hop le.",
                    "Tao tai khoan that bai.",
                    createResult.Errors.Select(e => e.Description));
            }

            var addRoleResult = await _userManager.AddToRoleAsync(user, roleText);
            if (!addRoleResult.Succeeded)
            {
                await _userManager.DeleteAsync(user);
                return ProblemResponse(
                    StatusCodes.Status400BadRequest,
                    "Yeu cau khong hop le.",
                    "Gan role that bai.",
                    addRoleResult.Errors.Select(e => e.Description));
            }

            return Ok(new
            {
                message = "Dang ky thanh cong.",
                user = new
                {
                    id = user.Id,
                    email = user.Email,
                    fullName = user.FullName,
                    studentId = user.StudentId,
                    role = roleText
                }
            });
        }

        [HttpPost("signin")]
        [AllowAnonymous]
        public async Task<IActionResult> SignIn([FromBody] SignInRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email.Trim());
            if (user is null)
            {
                return ProblemResponse(
                    StatusCodes.Status401Unauthorized,
                    "Chua xac thuc.",
                    "Email hoac mat khau khong dung.");
            }

            var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
            if (!isPasswordValid)
            {
                return ProblemResponse(
                    StatusCodes.Status401Unauthorized,
                    "Chua xac thuc.",
                    "Email hoac mat khau khong dung.");
            }

            var roles = await _userManager.GetRolesAsync(user);
            var identityRole = roles.FirstOrDefault() ?? MapRoleText(user.Role);
            var accessToken = _jwtTokenService.GenerateToken(user);

            return Ok(new
            {
                accessToken,
                tokenType = "Bearer",
                user = new
                {
                    id = user.Id,
                    email = user.Email,
                    fullName = user.FullName,
                    studentId = user.StudentId,
                    role = identityRole
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
                return ProblemResponse(
                    StatusCodes.Status401Unauthorized,
                    "Chua xac thuc.",
                    "Token khong hop le.");
            }

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user is null)
            {
                return ProblemResponse(
                    StatusCodes.Status404NotFound,
                    "Khong tim thay tai nguyen.",
                    "Khong tim thay nguoi dung.");
            }

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                id = user.Id,
                email = user.Email,
                fullName = user.FullName,
                studentId = user.StudentId,
                role = roles.FirstOrDefault() ?? MapRoleText(user.Role),
                claims = new
                {
                    sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub),
                    email = User.FindFirstValue(JwtRegisteredClaimNames.Email),
                    name = User.FindFirstValue("name") ?? User.FindFirstValue(ClaimTypes.Name),
                    role = User.FindFirstValue("role") ?? User.FindFirstValue(ClaimTypes.Role)
                }
            });
        }

        private static bool TryMapRole(string roleText, out UserRole role)
        {
            role = roleText switch
            {
                "STUDENT" => UserRole.Student,
                "ORGANIZER" => UserRole.Organizer,
                "CHECKIN_STAFF" => UserRole.CheckInStaff,
                _ => UserRole.Student
            };

            return roleText is "STUDENT" or "ORGANIZER" or "CHECKIN_STAFF";
        }

        private static string MapRoleText(UserRole role) => role switch
        {
            UserRole.Student => "STUDENT",
            UserRole.Organizer => "ORGANIZER",
            UserRole.CheckInStaff => "CHECKIN_STAFF",
            _ => "STUDENT"
        };

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
            {
                problem.Extensions["errors"] = errors.ToArray();
            }

            return StatusCode(statusCode, problem);
        }
    }

    public sealed class SignUpRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(8)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [MaxLength(120)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(30)]
        public string? StudentId { get; set; }

        [MaxLength(30)]
        public string? Role { get; set; }
    }

    public sealed class SignInRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }
}
