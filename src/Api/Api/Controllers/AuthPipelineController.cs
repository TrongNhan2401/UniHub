using Application.Abstractions;
using Domain;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/auth-pipeline")]
    public class AuthPipelineController : ControllerBase
    {
        private readonly IHostEnvironment _environment;
        private readonly IJwtTokenService _jwtTokenService;

        public AuthPipelineController(IHostEnvironment environment, IJwtTokenService jwtTokenService)
        {
            _environment = environment;
            _jwtTokenService = jwtTokenService;
        }

        [HttpPost("dev-token")]
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

        [HttpGet("secure")]
        [Authorize]
        public IActionResult GetSecureProbe()
        {
            var response = new
            {
                message = "JWT authentication pipeline hoạt động.",
                claims = new
                {
                    sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier),
                    email = User.FindFirstValue(JwtRegisteredClaimNames.Email),
                    name = User.FindFirstValue("name") ?? User.FindFirstValue(ClaimTypes.Name),
                    role = User.FindFirstValue("role") ?? User.FindFirstValue(ClaimTypes.Role)
                }
            };

            return Ok(response);
        }
    }
}