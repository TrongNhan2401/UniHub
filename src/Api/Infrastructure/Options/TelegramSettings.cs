namespace Infrastructure.Options
{
    public class TelegramSettings
    {
        /// <summary>Bot token lấy từ @BotFather trên Telegram</summary>
        public string BotToken { get; set; } = string.Empty;

        /// <summary>
        /// Có bật kênh Telegram hay không.
        /// Đặt true trong appsettings.json để kích hoạt.
        /// </summary>
        public bool Enabled { get; set; } = false;
    }
}
