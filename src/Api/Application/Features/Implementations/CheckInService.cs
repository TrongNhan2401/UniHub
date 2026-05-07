using Application.Abstractions;
using Application.DTOs.CheckIn;
using Application.Features.Interfaces;
using Domain;
using Domain.Entities;
using Domain.Shared;

namespace Application.Features.Implementations
{
    public class CheckInService : ICheckInService
    {
        private readonly IUnitOfWork _unitOfWork;

        public CheckInService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<Result<CheckInResponseDto>> CheckInAsync(string qrCode, Guid staffUserId)
        {
            if (string.IsNullOrWhiteSpace(qrCode))
            {
                return Result.Failure<CheckInResponseDto>(new Error("CheckIn.InvalidQrCode", "QR code khong duoc de trong."));
            }

            // 1. Tim registration theo QR code
            var registration = await _unitOfWork.Registrations.GetByQrCodeAsync(qrCode);
            if (registration is null)
            {
                return Result.Failure<CheckInResponseDto>(new Error("CheckIn.RegistrationNotFound", "Khong tim thay dang ky voi QR code nay."));
            }

            // 2. Kiem tra trang thai: phai la Confirmed
            if (registration.Status != RegistrationStatus.Confirmed)
            {
                var statusLabel = registration.Status switch
                {
                    RegistrationStatus.Pending => "chua duoc xac nhan (cho thanh toan)",
                    RegistrationStatus.Cancelled => "da bi huy",
                    RegistrationStatus.WaitListed => "dang trong danh sach cho",
                    _ => registration.Status.ToString()
                };
                return Result.Failure<CheckInResponseDto>(new Error("CheckIn.RegistrationNotConfirmed", $"Dang ky {statusLabel}, khong the check-in."));
            }

            // 3. Kiem tra da check-in chua
            var existingAttendance = await _unitOfWork.Attendances.GetByRegistrationIdAsync(registration.Id);
            if (existingAttendance is not null)
            {
                return Result.Failure<CheckInResponseDto>(new Error("CheckIn.AlreadyCheckedIn", "Sinh vien nay da check-in truoc do."));
            }

            // 4. Tao buc ghi danh
            var checkedInAt = DateTime.UtcNow;
            var attendance = new Attendance(
                registrationId: registration.Id,
                userId: registration.UserId,
                workshopId: registration.WorkshopId,
                checkedInAt: checkedInAt
            );

            await _unitOfWork.Attendances.AddAsync(attendance);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success(new CheckInResponseDto
            {
                AttendanceId = attendance.Id,
                RegistrationId = registration.Id,
                UserId = registration.UserId,
                WorkshopId = registration.WorkshopId,
                WorkshopTitle = registration.Workshop?.Title ?? string.Empty,
                CheckedInAt = checkedInAt,
                IsSyncedFromOffline = false
            });
        }

        public async Task<Result<List<CheckInResponseDto>>> GetAttendanceByWorkshopAsync(Guid workshopId)
        {
            if (workshopId == Guid.Empty)
            {
                return Result.Failure<List<CheckInResponseDto>>(new Error("CheckIn.InvalidWorkshopId", "WorkshopId khong hop le."));
            }

            var list = await _unitOfWork.Attendances.GetByWorkshopIdAsync(workshopId);

            var result = list.Select(a => new CheckInResponseDto
            {
                AttendanceId = a.Id,
                RegistrationId = a.RegistrationId,
                UserId = a.UserId,
                WorkshopId = a.WorkshopId,
                WorkshopTitle = string.Empty, // Khong load navigation de giu don gian
                CheckedInAt = a.CheckedInAt,
                IsSyncedFromOffline = a.IsSyncedFromOffline
            }).ToList();

            return Result.Success(result);
        }
    }
}
