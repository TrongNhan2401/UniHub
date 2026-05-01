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

        public async Task<Result<List<CheckInWorkshopRegistrationDto>>> GetWorkshopRegistrationsAsync(Guid workshopId)
        {
            var workshop = await _unitOfWork.Workshops.GetByIdAsync(workshopId);
            if (workshop is null)
            {
                return Result.Failure<List<CheckInWorkshopRegistrationDto>>(new Error("Workshop.NotFound", "Khong tim thay workshop."));
            }

            var registrations = await _unitOfWork.Registrations.GetConfirmedByWorkshopAsync(workshopId);

            var result = registrations.Select(r => new CheckInWorkshopRegistrationDto
            {
                RegistrationId = r.Id,
                WorkshopId = r.WorkshopId,
                QrCode = r.QrCode ?? string.Empty,
                StudentName = r.User.FullName,
                StudentId = r.User.StudentId,
                IsCheckedIn = r.Attendance is not null,
                CheckedInAt = r.Attendance?.CheckedInAt
            }).ToList();

            return Result.Success(result);
        }

        public async Task<Result<CheckInValidationDto>> ValidateAsync(Guid registrationId, Guid workshopId)
        {
            var registration = await _unitOfWork.Registrations.GetByIdAsync(registrationId);
            if (registration is null)
            {
                return Result.Failure<CheckInValidationDto>(new Error("Registration.NotFound", "Khong tim thay dang ky."));
            }

            if (registration.WorkshopId != workshopId)
            {
                return Result.Failure<CheckInValidationDto>(new Error("CheckIn.WrongWorkshop", "QR nay khong thuoc workshop dang check-in."));
            }

            if (registration.Status != RegistrationStatus.Confirmed)
            {
                return Result.Failure<CheckInValidationDto>(new Error("CheckIn.InvalidRegistration", "Dang ky chua du dieu kien check-in."));
            }

            var attendance = registration.Attendance;

            return Result.Success(new CheckInValidationDto
            {
                RegistrationId = registration.Id,
                WorkshopId = registration.WorkshopId,
                Valid = true,
                AlreadyCheckedIn = attendance is not null,
                StudentName = registration.User.FullName,
                StudentId = registration.User.StudentId,
                CheckedInAt = attendance?.CheckedInAt,
                Message = attendance is null ? "Hop le de check-in." : "Sinh vien da check-in truoc do."
            });
        }

        public async Task<Result<CheckInResultDto>> CheckInAsync(CheckInRequestDto request)
        {
            if (request.RegistrationId == Guid.Empty || request.WorkshopId == Guid.Empty)
            {
                return Result.Failure<CheckInResultDto>(new Error("CheckIn.InvalidRequest", "registrationId/workshopId khong hop le."));
            }

            var registration = await _unitOfWork.Registrations.GetByIdAsync(request.RegistrationId, asNoTracking: false);
            if (registration is null)
            {
                return Result.Failure<CheckInResultDto>(new Error("Registration.NotFound", "Khong tim thay dang ky."));
            }

            if (registration.WorkshopId != request.WorkshopId)
            {
                return Result.Failure<CheckInResultDto>(new Error("CheckIn.WrongWorkshop", "QR nay khong thuoc workshop dang check-in."));
            }

            if (registration.Status != RegistrationStatus.Confirmed)
            {
                return Result.Failure<CheckInResultDto>(new Error("CheckIn.InvalidRegistration", "Dang ky chua du dieu kien check-in."));
            }

            if (registration.Attendance is not null)
            {
                return Result.Success(ToResult(registration.Attendance, isDuplicate: true));
            }

            var checkedInAt = request.CheckedInAt ?? DateTime.UtcNow;
            var offlineDeviceId = string.IsNullOrWhiteSpace(request.DeviceId) ? null : request.DeviceId.Trim();

            var attendance = new Attendance(
                registration.Id,
                registration.UserId,
                registration.WorkshopId,
                checkedInAt,
                offlineDeviceId);

            await _unitOfWork.BeginTransactionAsync();

            try
            {
                await _unitOfWork.Attendances.AddAsync(attendance);
                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();

                var existing = await _unitOfWork.Attendances.GetByRegistrationIdAsync(request.RegistrationId);
                if (existing is not null)
                {
                    return Result.Success(ToResult(existing, isDuplicate: true));
                }

                return Result.Failure<CheckInResultDto>(new Error("CheckIn.CreateFailed", ex.Message));
            }

            var saved = await _unitOfWork.Attendances.GetByRegistrationIdAsync(request.RegistrationId);
            if (saved is null)
            {
                return Result.Failure<CheckInResultDto>(new Error("CheckIn.NotFound", "Khong tim thay ban ghi check-in sau khi tao."));
            }

            return Result.Success(ToResult(saved, isDuplicate: false));
        }

        public async Task<Result<CheckInSyncResultDto>> SyncAsync(CheckInSyncRequestDto request)
        {
            if (request.Records.Count == 0)
            {
                return Result.Success(new CheckInSyncResultDto());
            }

            var result = new CheckInSyncResultDto
            {
                Total = request.Records.Count
            };

            foreach (var record in request.Records)
            {
                var checkInResult = await CheckInAsync(record);

                if (checkInResult.IsFailure)
                {
                    result.Failed.Add(new CheckInSyncFailedRecordDto
                    {
                        RegistrationId = record.RegistrationId,
                        WorkshopId = record.WorkshopId,
                        Reason = checkInResult.Error.Message
                    });
                    continue;
                }

                if (checkInResult.Value.IsDuplicate)
                {
                    result.Duplicates += 1;
                }
                else
                {
                    result.Inserted += 1;
                }
            }

            return Result.Success(result);
        }

        public async Task<Result<PagedResult<CheckInResultDto>>> GetHistoryAsync(Guid workshopId, int pageNumber, int pageSize)
        {
            if (pageNumber <= 0 || pageSize <= 0)
            {
                return Result.Failure<PagedResult<CheckInResultDto>>(new Error("CheckIn.InvalidPaging", "pageNumber va pageSize phai lon hon 0."));
            }

            var workshop = await _unitOfWork.Workshops.GetByIdAsync(workshopId);
            if (workshop is null)
            {
                return Result.Failure<PagedResult<CheckInResultDto>>(new Error("Workshop.NotFound", "Khong tim thay workshop."));
            }

            var (items, total) = await _unitOfWork.Attendances.GetByWorkshopPagedAsync(workshopId, pageNumber, pageSize);
            var mapped = items.Select(item => ToResult(item, isDuplicate: false)).ToList();

            return Result.Success(new PagedResult<CheckInResultDto>(mapped, total, pageNumber, pageSize));
        }

        private static CheckInResultDto ToResult(Attendance attendance, bool isDuplicate)
        {
            return new CheckInResultDto
            {
                AttendanceId = attendance.Id,
                RegistrationId = attendance.RegistrationId,
                WorkshopId = attendance.WorkshopId,
                UserId = attendance.UserId,
                StudentName = attendance.User.FullName,
                StudentId = attendance.User.StudentId,
                CheckedInAt = attendance.CheckedInAt,
                IsSyncedFromOffline = attendance.IsSyncedFromOffline,
                OfflineDeviceId = attendance.OfflineDeviceId,
                IsDuplicate = isDuplicate
            };
        }
    }
}