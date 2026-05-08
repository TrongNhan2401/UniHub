namespace Application.Abstractions
{
    /// <summary>
    /// Strategy interface — mỗi kênh thông báo (Email, Telegram, v.v.) implement interface này.
    /// </summary>
    public interface INotificationChannel
    {
        /// <summary>Tên kênh, dùng để log và debug.</summary>
        string ChannelName { get; }

        /// <summary>
        /// Gửi thông báo tới người nhận.
        /// </summary>
        /// <param name="recipient">Địa chỉ nhận (email, chat_id Telegram, ...)</param>
        /// <param name="subject">Tiêu đề / chủ đề</param>
        /// <param name="htmlBody">Nội dung HTML (email) hoặc plain text (Telegram)</param>
        Task SendAsync(string recipient, string subject, string htmlBody, CancellationToken ct = default);
    }
}
