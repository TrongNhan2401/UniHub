using Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notification;

        public NotificationsController(INotificationService notification)
        {
            _notification = notification;
        }

        /// <summary>
        /// Gửi email thử để xác nhận cấu hình SMTP hoạt động.
        /// Chỉ ADMIN hoặc ORGANIZER mới được dùng.
        /// </summary>
        [HttpPost("test-email")]
        public async Task<IActionResult> SendTestEmail([FromBody] TestEmailRequest request)
        {
            if (!User.IsInRole("ADMIN") && !User.IsInRole("ORGANIZER"))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    type = "https://httpstatuses.io/403",
                    title = "Forbidden",
                    detail = "Chi ADMIN hoac ORGANIZER moi duoc gui email thu.",
                    status = 403,
                });
            }

            try
            {
                await _notification.SendRegistrationConfirmedAsync(
                    userEmail: request.ToEmail,
                    userName: request.ToName ?? "Test User",
                    workshopTitle: "Workshop Thử Nghiệm — Test Email",
                    workshopRoom: "Phòng A201",
                    workshopStartTime: DateTime.UtcNow.AddDays(3),
                    qrCode: "TEST-QR-" + Guid.NewGuid().ToString("N")[..8].ToUpper());

                return Ok(new { success = true, message = $"Email đã được gửi tới {request.ToEmail}. Vui lòng kiểm tra hộp thư (kể cả Spam)." });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    type = "https://httpstatuses.io/500",
                    title = "Gửi email thất bại",
                    detail = ex.Message,
                    status = 500,
                });
            }
        }
    }

    public class TestEmailRequest
    {
        [Required]
        [EmailAddress]
        public string ToEmail { get; set; } = string.Empty;

        public string? ToName { get; set; }
    }
}
