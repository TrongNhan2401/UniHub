using Application.DTOs.CheckIn;
using Application.Features.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [EnableRateLimiting("ApiByToken")]
    public class CheckInsController : ControllerBase
    {
        private readonly ICheckInService _checkInService;

        public CheckInsController(ICheckInService checkInService)
        {
            _checkInService = checkInService;
        }

        /// <summary>
        /// Đăng ký tài khoản staff check-in mới.
        /// </summary>
        [AllowAnonymous]
        [HttpPost("signup-staff")]
        public async Task<IActionResult> RegisterCheckinStaff([FromBody] CreateCheckinStaffRequestDto request)
        {
            var result = await _checkInService.RegisterCheckinStaffAsync(request);
            if (result.IsFailure)
            {
                return result.Error.Code switch
                {
                    "CheckIn.EmailExists" => ProblemResponse(StatusCodes.Status409Conflict, "Xung dot du lieu.", result.Error.Message),
                    _ => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message)
                };
            }
            return Ok(new { message = "Tao tai khoan staff check-in thanh cong.", userId = result.Value });
        }

        /// <summary>
        /// Lấy danh sách tất cả staff check-in.
        /// </summary>
        [HttpGet("staff")]
        public async Task<IActionResult> GetAllStaff([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var result = await _checkInService.GetAllCheckinStaffAsync(pageNumber, pageSize);
            if (result.IsFailure)
            {
                return ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message, "invalid_request");
            }
            return Ok(result.Value);
        }

        /// <summary>
        /// Check-in sinh viên bằng QR code (online).
        /// Staff quét QR và gọi endpoint này để ghi nhận attendance.
        /// </summary>
        [Authorize(Policy = "CanCheckIn")]
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
                    "CheckIn.RegistrationNotFound" => ProblemResponse(StatusCodes.Status404NotFound, "Khong tim thay tai nguyen.", result.Error.Message, "registration_not_found"),
                    "CheckIn.RegistrationNotConfirmed" => ProblemResponse(StatusCodes.Status409Conflict, "Xung dot du lieu.", result.Error.Message, "not_confirmed"),
                    "CheckIn.AlreadyCheckedIn" => ProblemResponse(StatusCodes.Status409Conflict, "Xung dot du lieu.", result.Error.Message, "already_checked_in"),
                    "CheckIn.WorkshopCancelled" => ProblemResponse(StatusCodes.Status409Conflict, "Xung dot du lieu.", result.Error.Message, "workshop_cancelled"),
                    "CheckIn.InvalidQrCode" => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message, "invalid_qr"),
                    _ => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message, "invalid_request")
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
                return ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message, "invalid_request");
            }

            return Ok(result.Value);
        }

        /// <summary>
        /// Preload danh sach registration da confirmed cua workshop.
        /// Mobile dung de check-in offline khi mat mang.
        /// </summary>
        [Authorize(Policy = "CanCheckIn")]
        [HttpGet("workshops/{workshopId:guid}/registrations")]
        public async Task<IActionResult> GetConfirmedRegistrations(Guid workshopId)
        {
            var result = await _checkInService.GetConfirmedRegistrationsByWorkshopAsync(workshopId);

            if (result.IsFailure)
            {
                return result.Error.Code switch
                {
                    "CheckIn.InvalidRequest" => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message, "invalid_request"),
                    _ => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message, "invalid_request")
                };
            }

            return Ok(result.Value);
        }

        /// <summary>
        /// Validate registration thuoc workshop, dung cho flow scan online truoc khi check-in.
        /// </summary>
        [Authorize(Policy = "CanCheckIn")]
        [HttpGet("registrations/{registrationId:guid}/validate")]
        public async Task<IActionResult> ValidateRegistration(Guid registrationId, [FromQuery(Name = "workshop_id")] Guid workshopId)
        {
            var result = await _checkInService.ValidateRegistrationAsync(registrationId, workshopId);

            if (result.IsFailure)
            {
                return result.Error.Code switch
                {
                    "CheckIn.InvalidRequest" => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message, "invalid_request"),
                    "CheckIn.RegistrationNotFound" => ProblemResponse(StatusCodes.Status404NotFound, "Khong tim thay tai nguyen.", result.Error.Message, "registration_not_found"),
                    "CheckIn.RegistrationNotConfirmed" => ProblemResponse(StatusCodes.Status409Conflict, "Xung dot du lieu.", result.Error.Message, "not_confirmed"),
                    "CheckIn.WorkshopMismatch" => ProblemResponse(StatusCodes.Status409Conflict, "Xung dot du lieu.", result.Error.Message, "workshop_mismatch"),
                    "CheckIn.WorkshopCancelled" => ProblemResponse(StatusCodes.Status409Conflict, "Xung dot du lieu.", result.Error.Message, "workshop_cancelled"),
                    _ => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message, "invalid_request")
                };
            }

            return Ok(result.Value);
        }

        /// <summary>
        /// Dong bo batch check-in offline len server.
        /// </summary>
        [Authorize(Policy = "CanCheckIn")]
        [HttpPost("sync")]
        public async Task<IActionResult> SyncOffline([FromBody] OfflineSyncRequestDto request)
        {
            if (!TryGetCurrentUserId(out var staffUserId))
            {
                return ProblemResponse(StatusCodes.Status401Unauthorized, "Chua xac thuc.", "Token khong hop le.", "unauthorized");
            }

            var result = await _checkInService.SyncOfflineAsync(request, staffUserId);

            if (result.IsFailure)
            {
                return result.Error.Code switch
                {
                    "CheckIn.InvalidRequest" => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message, "invalid_request"),
                    _ => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", result.Error.Message, "invalid_request")
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

        private ObjectResult ProblemResponse(int statusCode, string title, string detail, string? code = null)
        {
            var problem = new ProblemDetails
            {
                Status = statusCode,
                Title = title,
                Detail = detail,
                Type = $"https://httpstatuses.com/{statusCode}"
            };
            problem.Extensions["traceId"] = HttpContext.TraceIdentifier;
            if (!string.IsNullOrWhiteSpace(code))
            {
                problem.Extensions["code"] = code;
            }

            return StatusCode(statusCode, problem);
        }
    }
}
