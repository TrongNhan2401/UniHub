using Application.Abstractions;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services.Notifications
{
    /// <summary>
    /// Context trong Strategy Pattern — nhận danh sách INotificationChannel được inject,
    /// build HTML template rồi gọi tất cả kênh song song (fan-out).
    /// </summary>
    public class NotificationService : INotificationService
    {
        private readonly IEnumerable<INotificationChannel> _channels;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            IEnumerable<INotificationChannel> channels,
            ILogger<NotificationService> logger)
        {
            _channels = channels;
            _logger = logger;
        }

        // ──────────────────────────────────────────────────────────────
        // 1. Đăng ký thành công (workshop miễn phí)
        // ──────────────────────────────────────────────────────────────
        public Task SendRegistrationConfirmedAsync(
            string userEmail, string userName,
            string workshopTitle, string workshopRoom,
            DateTime workshopStartTime, string qrCode,
            CancellationToken ct = default)
        {
            var subject = $"✅ Đăng ký thành công — {workshopTitle}";
            var body = BuildRegistrationConfirmedHtml(userName, workshopTitle, workshopRoom, workshopStartTime, qrCode);
            return FanOutAsync(userEmail, subject, body, ct);
        }

        // ──────────────────────────────────────────────────────────────
        // 2. Thanh toán thành công + QR
        // ──────────────────────────────────────────────────────────────
        public Task SendPaymentConfirmedAsync(
            string userEmail, string userName,
            string workshopTitle, string workshopRoom,
            DateTime workshopStartTime, string qrCode, long amountPaid,
            CancellationToken ct = default)
        {
            var subject = $"🎉 Thanh toán thành công — {workshopTitle}";
            var body = BuildPaymentConfirmedHtml(userName, workshopTitle, workshopRoom, workshopStartTime, qrCode, amountPaid);
            return FanOutAsync(userEmail, subject, body, ct);
        }

        // ──────────────────────────────────────────────────────────────
        // 3. Nhắc nhở trước sự kiện
        // ──────────────────────────────────────────────────────────────
        public Task SendEventReminderAsync(
            string userEmail, string userName,
            string workshopTitle, string workshopRoom,
            DateTime workshopStartTime,
            CancellationToken ct = default)
        {
            var subject = $"⏰ Nhắc nhở — {workshopTitle} sắp bắt đầu!";
            var body = BuildReminderHtml(userName, workshopTitle, workshopRoom, workshopStartTime);
            return FanOutAsync(userEmail, subject, body, ct);
        }

        // ──────────────────────────────────────────────────────────────
        // 4. Gửi OTP (2FA)
        // ──────────────────────────────────────────────────────────────
        public Task SendOtpAsync(
            string userEmail, string userName, string otpCode,
            CancellationToken ct = default)
        {
            var subject = $"🔒 Mã xác thực đăng nhập (OTP)";
            var body = BuildOtpHtml(userName, otpCode);
            return FanOutAsync(userEmail, subject, body, ct);
        }

        // ──────────────────────────────────────────────────────────────

        // Fan-out: gửi qua tất cả kênh song song, lỗi 1 kênh không ảnh hưởng kênh khác
        // ──────────────────────────────────────────────────────────────
        private async Task FanOutAsync(string recipient, string subject, string htmlBody, CancellationToken ct)
        {
            var tasks = _channels.Select(async channel =>
            {
                try
                {
                    await channel.SendAsync(recipient, subject, htmlBody, ct);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[Notification] Kênh {Channel} gặp lỗi khi gửi tới {Recipient}", channel.ChannelName, recipient);
                }
            });

            await Task.WhenAll(tasks);
        }

        // ──────────────────────────────────────────────────────────────
        // HTML Templates
        // ──────────────────────────────────────────────────────────────
        private static string BuildRegistrationConfirmedHtml(
            string userName, string workshopTitle, string workshopRoom,
            DateTime startTime, string qrCode)
        {
            return $@"
<!DOCTYPE html>
<html lang='vi'>
<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'></head>
<body style='font-family: Arial, sans-serif; background:#f4f4f4; margin:0; padding:0;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f4f4; padding:30px 0;'>
    <tr><td align='center'>
      <table width='600' cellpadding='0' cellspacing='0' style='background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);'>
        <!-- Header -->
        <tr><td style='background:#2563eb; padding:28px 32px;'>
          <h1 style='color:#fff; margin:0; font-size:22px;'>UniHub Workshop</h1>
          <p style='color:#bfdbfe; margin:4px 0 0; font-size:14px;'>Đăng ký thành công</p>
        </td></tr>
        <!-- Body -->
        <tr><td style='padding:32px;'>
          <p style='color:#374151; font-size:16px; margin:0 0 16px;'>Xin chào <strong>{userName}</strong>,</p>
          <p style='color:#374151; font-size:15px; margin:0 0 24px;'>
            Bạn đã đăng ký thành công workshop <strong>{workshopTitle}</strong>. Dưới đây là thông tin chi tiết:
          </p>
          <!-- Info box -->
          <table width='100%' style='background:#eff6ff; border-radius:8px; padding:16px; margin-bottom:24px;'>
            <tr><td style='padding:6px 0;'><span style='color:#6b7280; font-size:13px;'>🗓️ Thời gian:</span></td>
                <td style='color:#1e3a8a; font-weight:600; font-size:14px;'>{startTime:dd/MM/yyyy HH:mm}</td></tr>
            <tr><td style='padding:6px 0;'><span style='color:#6b7280; font-size:13px;'>📍 Phòng:</span></td>
                <td style='color:#1e3a8a; font-weight:600; font-size:14px;'>{workshopRoom}</td></tr>
            <tr><td style='padding:6px 0;'><span style='color:#6b7280; font-size:13px;'>🎟️ Mã QR:</span></td>
                <td style='color:#1e3a8a; font-weight:600; font-size:14px; letter-spacing:1px;'>{qrCode}</td></tr>
          </table>
          <p style='color:#374151; font-size:14px; background:#fef9c3; border-left:4px solid #eab308; padding:12px 16px; border-radius:6px; margin:0 0 24px;'>
            ⚠️ Vui lòng mang theo mã QR này khi đến check-in tại cửa phòng.
          </p>
          <p style='color:#6b7280; font-size:13px; margin:0;'>Trân trọng,<br><strong>Ban tổ chức UniHub</strong></p>
        </td></tr>
        <!-- Footer -->
        <tr><td style='background:#f9fafb; padding:16px 32px; border-top:1px solid #e5e7eb;'>
          <p style='color:#9ca3af; font-size:12px; margin:0; text-align:center;'>Email này được gửi tự động. Vui lòng không trả lời.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";
        }

        private static string BuildPaymentConfirmedHtml(
            string userName, string workshopTitle, string workshopRoom,
            DateTime startTime, string qrCode, long amountPaid)
        {
            return $@"
<!DOCTYPE html>
<html lang='vi'>
<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'></head>
<body style='font-family: Arial, sans-serif; background:#f4f4f4; margin:0; padding:0;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f4f4; padding:30px 0;'>
    <tr><td align='center'>
      <table width='600' cellpadding='0' cellspacing='0' style='background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);'>
        <tr><td style='background:#16a34a; padding:28px 32px;'>
          <h1 style='color:#fff; margin:0; font-size:22px;'>UniHub Workshop</h1>
          <p style='color:#bbf7d0; margin:4px 0 0; font-size:14px;'>Thanh toán thành công 🎉</p>
        </td></tr>
        <tr><td style='padding:32px;'>
          <p style='color:#374151; font-size:16px; margin:0 0 16px;'>Xin chào <strong>{userName}</strong>,</p>
          <p style='color:#374151; font-size:15px; margin:0 0 24px;'>
            Thanh toán của bạn đã được xác nhận. Bạn đã đăng ký thành công workshop <strong>{workshopTitle}</strong>.
          </p>
          <table width='100%' style='background:#f0fdf4; border-radius:8px; padding:16px; margin-bottom:24px;'>
            <tr><td style='padding:6px 0;'><span style='color:#6b7280; font-size:13px;'>🗓️ Thời gian:</span></td>
                <td style='color:#15803d; font-weight:600; font-size:14px;'>{startTime:dd/MM/yyyy HH:mm}</td></tr>
            <tr><td style='padding:6px 0;'><span style='color:#6b7280; font-size:13px;'>📍 Phòng:</span></td>
                <td style='color:#15803d; font-weight:600; font-size:14px;'>{workshopRoom}</td></tr>
            <tr><td style='padding:6px 0;'><span style='color:#6b7280; font-size:13px;'>💰 Số tiền:</span></td>
                <td style='color:#15803d; font-weight:600; font-size:14px;'>{amountPaid:N0} VNĐ</td></tr>
            <tr><td style='padding:6px 0;'><span style='color:#6b7280; font-size:13px;'>🎟️ Mã QR:</span></td>
                <td style='color:#15803d; font-weight:600; font-size:14px; letter-spacing:1px;'>{qrCode}</td></tr>
          </table>
          <p style='color:#374151; font-size:14px; background:#fef9c3; border-left:4px solid #eab308; padding:12px 16px; border-radius:6px; margin:0 0 24px;'>
            ⚠️ Vui lòng mang theo mã QR này khi đến check-in tại cửa phòng.
          </p>
          <p style='color:#6b7280; font-size:13px; margin:0;'>Trân trọng,<br><strong>Ban tổ chức UniHub</strong></p>
        </td></tr>
        <tr><td style='background:#f9fafb; padding:16px 32px; border-top:1px solid #e5e7eb;'>
          <p style='color:#9ca3af; font-size:12px; margin:0; text-align:center;'>Email này được gửi tự động. Vui lòng không trả lời.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";
        }

        private static string BuildReminderHtml(
            string userName, string workshopTitle, string workshopRoom, DateTime startTime)
        {
            return $@"
<!DOCTYPE html>
<html lang='vi'>
<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'></head>
<body style='font-family: Arial, sans-serif; background:#f4f4f4; margin:0; padding:0;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f4f4; padding:30px 0;'>
    <tr><td align='center'>
      <table width='600' cellpadding='0' cellspacing='0' style='background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);'>
        <tr><td style='background:#d97706; padding:28px 32px;'>
          <h1 style='color:#fff; margin:0; font-size:22px;'>UniHub Workshop</h1>
          <p style='color:#fde68a; margin:4px 0 0; font-size:14px;'>Nhắc nhở sự kiện ⏰</p>
        </td></tr>
        <tr><td style='padding:32px;'>
          <p style='color:#374151; font-size:16px; margin:0 0 16px;'>Xin chào <strong>{userName}</strong>,</p>
          <p style='color:#374151; font-size:15px; margin:0 0 24px;'>
            Workshop <strong>{workshopTitle}</strong> mà bạn đã đăng ký sắp bắt đầu!
          </p>
          <table width='100%' style='background:#fffbeb; border-radius:8px; padding:16px; margin-bottom:24px;'>
            <tr><td style='padding:6px 0;'><span style='color:#6b7280; font-size:13px;'>🗓️ Thời gian:</span></td>
                <td style='color:#b45309; font-weight:600; font-size:14px;'>{startTime:dd/MM/yyyy HH:mm}</td></tr>
            <tr><td style='padding:6px 0;'><span style='color:#6b7280; font-size:13px;'>📍 Phòng:</span></td>
                <td style='color:#b45309; font-weight:600; font-size:14px;'>{workshopRoom}</td></tr>
          </table>
          <p style='color:#374151; font-size:14px; background:#eff6ff; border-left:4px solid #2563eb; padding:12px 16px; border-radius:6px; margin:0 0 24px;'>
            📱 Đừng quên mang theo QR code đã nhận lúc đăng ký để check-in nhanh tại cửa phòng.
          </p>
          <p style='color:#6b7280; font-size:13px; margin:0;'>Trân trọng,<br><strong>Ban tổ chức UniHub</strong></p>
        </td></tr>
        <tr><td style='background:#f9fafb; padding:16px 32px; border-top:1px solid #e5e7eb;'>
          <p style='color:#9ca3af; font-size:12px; margin:0; text-align:center;'>Email này được gửi tự động. Vui lòng không trả lời.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";
        }

        private static string BuildOtpHtml(string userName, string otpCode)
        {
            return $@"
<!DOCTYPE html>
<html lang='vi'>
<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'></head>
<body style='font-family: Arial, sans-serif; background:#f4f4f4; margin:0; padding:0;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f4f4; padding:30px 0;'>
    <tr><td align='center'>
      <table width='600' cellpadding='0' cellspacing='0' style='background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);'>
        <tr><td style='background:#2563eb; padding:28px 32px;'>
          <h1 style='color:#fff; margin:0; font-size:22px;'>UniHub Admin Portal</h1>
          <p style='color:#bfdbfe; margin:4px 0 0; font-size:14px;'>Xác thực đăng nhập</p>
        </td></tr>
        <tr><td style='padding:32px;'>
          <p style='color:#374151; font-size:16px; margin:0 0 16px;'>Xin chào <strong>{userName}</strong>,</p>
          <p style='color:#374151; font-size:15px; margin:0 0 24px;'>
            Bạn đang yêu cầu đăng nhập vào cổng quản trị UniHub. Vui lòng sử dụng mã xác thực dưới đây để tiếp tục:
          </p>
          <div style='background:#f3f4f6; border-radius:8px; padding:24px; text-align:center; margin-bottom:24px;'>
            <h2 style='color:#111827; font-size:32px; font-weight:700; letter-spacing:8px; margin:0;'>{otpCode}</h2>
          </div>
          <p style='color:#ef4444; font-size:14px; margin:0 0 24px;'>
            Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.
          </p>
          <p style='color:#6b7280; font-size:13px; margin:0;'>Trân trọng,<br><strong>Hệ thống bảo mật UniHub</strong></p>
        </td></tr>
        <tr><td style='background:#f9fafb; padding:16px 32px; border-top:1px solid #e5e7eb;'>
          <p style='color:#9ca3af; font-size:12px; margin:0; text-align:center;'>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email hoặc liên hệ quản trị viên.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";
        }
    }
}
