using Application.DTOs.CheckIn;
using Domain.Shared;

namespace Application.Features.Interfaces
{
    public interface ICheckInService
    {
        /// <summary>
        /// Check-in online: quét QR code và ghi nhận attendance ngay lập tức.
        /// </summary>
        Task<Result<CheckInResponseDto>> CheckInAsync(string qrCode, Guid staffUserId);

        /// <summary>
        /// Lấy danh sách attendance của 1 workshop (dùng cho staff xem tổng hợp).
        /// </summary>
        Task<Result<List<CheckInResponseDto>>> GetAttendanceByWorkshopAsync(Guid workshopId);
    }
}
