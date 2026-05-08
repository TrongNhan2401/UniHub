namespace Infrastructure.Options
{
    public class EmailSettings
    {
        /// <summary>SMTP host, ví dụ: smtp.gmail.com</summary>
        public string SmtpHost { get; set; } = string.Empty;

        /// <summary>SMTP port: 587 (STARTTLS) hoặc 465 (SSL)</summary>
        public int SmtpPort { get; set; } = 587;

        /// <summary>Tài khoản Gmail (địa chỉ email đầy đủ)</summary>
        public string Username { get; set; } = string.Empty;

        /// <summary>App Password 16 ký tự từ Google Account (không phải mật khẩu đăng nhập)</summary>
        public string Password { get; set; } = string.Empty;

        /// <summary>Địa chỉ người gửi hiển thị, ví dụ: noreply@unihub.local</summary>
        public string FromAddress { get; set; } = string.Empty;

        /// <summary>Tên người gửi hiển thị, ví dụ: UniHub Workshop</summary>
        public string FromName { get; set; } = "UniHub Workshop";

        /// <summary>Bật/tắt SSL (true cho port 465, false cho port 587 với STARTTLS)</summary>
        public bool EnableSsl { get; set; } = false;
    }
}
