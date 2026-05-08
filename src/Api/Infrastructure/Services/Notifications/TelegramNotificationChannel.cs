using Application.Abstractions;
using Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;

namespace Infrastructure.Services.Notifications
{
    /// <summary>
    /// Concrete Strategy — kênh gửi thông báo qua Telegram Bot API.
    /// Để kích hoạt: đăng ký channel này trong DI và điền TelegramSettings.
    /// </summary>
    public class TelegramNotificationChannel : INotificationChannel
    {
        private readonly TelegramSettings _settings;
        private readonly HttpClient _httpClient;
        private readonly ILogger<TelegramNotificationChannel> _logger;

        public string ChannelName => "Telegram";

        public TelegramNotificationChannel(
            IOptions<TelegramSettings> settings,
            HttpClient httpClient,
            ILogger<TelegramNotificationChannel> logger)
        {
            _settings = settings.Value;
            _httpClient = httpClient;
            _logger = logger;
        }

        /// <summary>
        /// Gửi tin nhắn Telegram.
        /// recipient = Telegram chat_id (lấy từ @userinfobot hoặc webhook).
        /// subject được ghép vào đầu htmlBody theo định dạng text thuần.
        /// </summary>
        public async Task SendAsync(string recipient, string subject, string htmlBody, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(recipient) || string.IsNullOrWhiteSpace(_settings.BotToken))
            {
                _logger.LogWarning("[Telegram] Bỏ qua vì recipient hoặc BotToken rỗng.");
                return;
            }

            // Telegram dùng plain text hoặc Markdown, không phải HTML email
            var text = $"*{EscapeMarkdown(subject)}*\n\n{StripHtml(htmlBody)}";

            var url = $"https://api.telegram.org/bot{_settings.BotToken}/sendMessage";
            var payload = new { chat_id = recipient, text, parse_mode = "Markdown" };

            try
            {
                var response = await _httpClient.PostAsJsonAsync(url, payload, ct);
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("[Telegram] Đã gửi tới chat_id {Recipient}", recipient);
                }
                else
                {
                    var err = await response.Content.ReadAsStringAsync(ct);
                    _logger.LogWarning("[Telegram] Gửi thất bại tới {Recipient}: {Error}", recipient, err);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Telegram] Lỗi khi gửi tới {Recipient}", recipient);
            }
        }

        private static string EscapeMarkdown(string text) =>
            text.Replace("_", "\\_").Replace("*", "\\*").Replace("[", "\\[").Replace("`", "\\`");

        private static string StripHtml(string html)
        {
            // Loại bỏ tag HTML, giữ lại text thuần cho Telegram
            var result = System.Text.RegularExpressions.Regex.Replace(html, "<[^>]*>", string.Empty);
            result = System.Net.WebUtility.HtmlDecode(result);
            // Gộp nhiều dòng trắng thành 1
            result = System.Text.RegularExpressions.Regex.Replace(result, @"\n\s*\n\s*\n", "\n\n");
            return result.Trim();
        }
    }
}
