using Application.Abstractions;
using Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;

namespace Infrastructure.Services.Notifications
{
    /// <summary>
    /// Concrete Strategy — kênh gửi email qua SMTP (Gmail App Password).
    /// Implement INotificationChannel.
    /// </summary>
    public class EmailNotificationChannel : INotificationChannel
    {
        private readonly EmailSettings _settings;
        private readonly ILogger<EmailNotificationChannel> _logger;

        public string ChannelName => "Email";

        public EmailNotificationChannel(
            IOptions<EmailSettings> settings,
            ILogger<EmailNotificationChannel> logger)
        {
            _settings = settings.Value;
            _logger = logger;
        }

        public async Task SendAsync(string recipient, string subject, string htmlBody, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(recipient))
            {
                _logger.LogWarning("[Email] Bỏ qua gửi vì recipient rỗng.");
                return;
            }

            try
            {
                // Port 587 (submission) requires STARTTLS on most SMTP providers (including Gmail).
                var enableSsl = _settings.EnableSsl || _settings.SmtpPort == 587;

                using var client = new SmtpClient(_settings.SmtpHost, _settings.SmtpPort)
                {
                    EnableSsl = enableSsl,
                    Credentials = new NetworkCredential(_settings.Username, _settings.Password),
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                };

                var from = new MailAddress(_settings.FromAddress, _settings.FromName);
                var to = new MailAddress(recipient);

                using var message = new MailMessage(from, to)
                {
                    Subject = subject,
                    Body = htmlBody,
                    IsBodyHtml = true,
                };

                await client.SendMailAsync(message, ct);
                _logger.LogInformation("[Email] Đã gửi tới {Recipient} — chủ đề: {Subject}", recipient, subject);
            }
            catch (Exception ex)
            {
                // Fire-and-forget: ghi log lỗi nhưng không crash luồng chính
                _logger.LogError(ex, "[Email] Gửi thất bại tới {Recipient} — chủ đề: {Subject}", recipient, subject);
            }
        }
    }
}
