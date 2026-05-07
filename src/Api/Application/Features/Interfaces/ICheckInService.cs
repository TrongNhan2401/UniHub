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

        /// <summary>
        /// Lấy danh sách registration đã confirmed của workshop để preload offline.
        /// </summary>
        Task<Result<List<PreloadRegistrationDto>>> GetConfirmedRegistrationsByWorkshopAsync(Guid workshopId);

        /// <summary>
        /// Validate registration cho chế độ scan online.
        /// </summary>
        Task<Result<ValidateRegistrationResponseDto>> ValidateRegistrationAsync(Guid registrationId, Guid workshopId);

        /// <summary>
        /// Đồng bộ batch check-in đã lưu offline.
        /// </summary>
        Task<Result<OfflineSyncResponseDto>> SyncOfflineAsync(OfflineSyncRequestDto request, Guid staffUserId);
    }
}
