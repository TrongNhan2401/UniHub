namespace Application.Abstractions
{
    /// <summary>
    /// Notification service — điều phối gửi thông báo qua nhiều kênh.
    /// Các use-case (Registration, Payment) chỉ phụ thuộc vào interface này,
    /// không biết cụ thể kênh nào đang được dùng.
    /// </summary>
    public interface INotificationService
    {
        /// <summary>
        /// Gửi email xác nhận đăng ký thành công (workshop miễn phí).
        /// </summary>
        Task SendRegistrationConfirmedAsync(
            string userEmail,
            string userName,
            string workshopTitle,
            string workshopRoom,
            DateTime workshopStartTime,
            string qrCode,
            CancellationToken ct = default);

        /// <summary>
        /// Gửi email xác nhận thanh toán thành công và QR code.
        /// </summary>
        Task SendPaymentConfirmedAsync(
            string userEmail,
            string userName,
            string workshopTitle,
            string workshopRoom,
            DateTime workshopStartTime,
            string qrCode,
            long amountPaid,
            CancellationToken ct = default);

        /// <summary>
        /// Gửi email nhắc nhở trước sự kiện (có thể gọi từ background job).
        /// </summary>
        Task SendEventReminderAsync(
            string userEmail,
            string userName,
            string workshopTitle,
            string workshopRoom,
            DateTime workshopStartTime,
            CancellationToken ct = default);
    }
}
