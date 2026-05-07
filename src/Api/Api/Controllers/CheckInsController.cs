using Application.DTOs.CheckIn;
using Application.Features.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CheckInsController : ControllerBase
    {
        private readonly ICheckInService _checkInService;

        public CheckInsController(ICheckInService checkInService)
        {
            _checkInService = checkInService;
        }

        /// <summary>
        /// Check-in sinh viên bằng QR code (online).
        /// Staff quét QR và gọi endpoint này để ghi nhận attendance.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CheckIn([FromBody] CheckInRequestDto request)
        {
            if (!TryGetCurrentUserId(out var staffUserId))
            {
                return ProblemResponse(StatusCodes.Status401Unauthorized, "Chua xac thuc.", "Token khong hop le.");
            }

            var result = await _checkInService.CheckInAsync(request.QrCode, staffUserId);

            if (result.IsFailure)
            {
                return result.Error.Code switch
                {
                    "CheckIn.RegistrationNotFound" => ProblemResponse(StatusCodes.Status404NotFound, "Khong tim thay tai nguyen.", result.Error.Message),
                    "CheckIn.RegistrationNotConfirmed" => ProblemResponse(StatusCodes.Status409Conflict, "Xung dot du lieu.", result.Error.Message),
                    "CheckIn.AlreadyCheckedIn" => ProblemResponse(StatusCodes.Status409Conflict, "Xung dot du lieu.", result.Error.Message),
                    "CheckIn.InvalidQrCode" => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message),
                    _ => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message)
                };
            }

            return StatusCode(StatusCodes.Status201Created, result.Value);
        }

        /// <summary>
        /// Lấy danh sách attendance của một workshop.
        /// Dùng cho staff xem tổng hợp check-in.
        /// </summary>
        [HttpGet("workshops/{workshopId:guid}")]
        public async Task<IActionResult> GetByWorkshop(Guid workshopId)
        {
            if (!TryGetCurrentUserId(out _))
            {
                return ProblemResponse(StatusCodes.Status401Unauthorized, "Chua xac thuc.", "Token khong hop le.");
            }

            var result = await _checkInService.GetAttendanceByWorkshopAsync(workshopId);

            if (result.IsFailure)
            {
                return ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message);
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
