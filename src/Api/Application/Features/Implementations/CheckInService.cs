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

            var normalizedQr = qrCode.Trim();

            // 1. Tim registration theo QR code
            var registration = await _unitOfWork.Registrations.GetByQrCodeAsync(normalizedQr);
            if (registration is null)
            {
                return Result.Failure<CheckInResponseDto>(new Error("CheckIn.RegistrationNotFound", "Khong tim thay dang ky voi QR code nay."));
            }

            if (registration.Workshop.Status == WorkshopStatus.Cancelled)
            {
                return Result.Failure<CheckInResponseDto>(new Error("CheckIn.WorkshopCancelled", "Workshop da bi huy, khong the check-in."));
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
                checkedInAt: checkedInAt,
                offlineDeviceId: null
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

        public async Task<Result<List<PreloadRegistrationDto>>> GetConfirmedRegistrationsByWorkshopAsync(Guid workshopId)
        {
            if (workshopId == Guid.Empty)
            {
                return Result.Failure<List<PreloadRegistrationDto>>(new Error("CheckIn.InvalidRequest", "WorkshopId khong hop le."));
            }

            var registrations = await _unitOfWork.Registrations.GetConfirmedByWorkshopAsync(workshopId);

            var result = registrations
                .Where(r => !string.IsNullOrWhiteSpace(r.QrCode))
                .Select(r => new PreloadRegistrationDto
                {
                    RegistrationId = r.Id,
                    QrCode = r.QrCode!,
                    StudentName = r.User.FullName,
                    StudentId = r.User.StudentId,
                    StudentEmail = r.User.Email ?? string.Empty
                })
                .ToList();

            return Result.Success(result);
        }

        public async Task<Result<ValidateRegistrationResponseDto>> ValidateRegistrationAsync(Guid registrationId, Guid workshopId)
        {
            if (registrationId == Guid.Empty || workshopId == Guid.Empty)
            {
                return Result.Failure<ValidateRegistrationResponseDto>(
                    new Error("CheckIn.InvalidRequest", "registration_id hoac workshop_id khong hop le."));
            }

            var registration = await _unitOfWork.Registrations.GetByIdForCheckInAsync(registrationId);
            if (registration is null)
            {
                return Result.Failure<ValidateRegistrationResponseDto>(
                    new Error("CheckIn.RegistrationNotFound", "Khong tim thay dang ky."));
            }

            if (registration.WorkshopId != workshopId)
            {
                return Result.Failure<ValidateRegistrationResponseDto>(
                    new Error("CheckIn.WorkshopMismatch", "Dang ky khong thuoc workshop dang check-in."));
            }

            if (registration.Workshop.Status == WorkshopStatus.Cancelled)
            {
                return Result.Failure<ValidateRegistrationResponseDto>(
                    new Error("CheckIn.WorkshopCancelled", "Workshop da bi huy, khong the check-in."));
            }

            if (registration.Status != RegistrationStatus.Confirmed)
            {
                return Result.Failure<ValidateRegistrationResponseDto>(
                    new Error("CheckIn.RegistrationNotConfirmed", "Dang ky chua duoc xac nhan."));
            }

            var existingAttendance = await _unitOfWork.Attendances.GetByRegistrationIdAsync(registrationId);

            return Result.Success(new ValidateRegistrationResponseDto
            {
                RegistrationId = registration.Id,
                IsValid = existingAttendance is null,
                AlreadyCheckedIn = existingAttendance is not null,
                StudentName = registration.User.FullName,
                StudentId = registration.User.StudentId,
                StudentEmail = registration.User.Email ?? string.Empty,
                WorkshopTitle = registration.Workshop.Title
            });
        }

        public async Task<Result<OfflineSyncResponseDto>> SyncOfflineAsync(OfflineSyncRequestDto request, Guid staffUserId)
        {
            if (request.Records is null || request.Records.Count == 0)
            {
                return Result.Failure<OfflineSyncResponseDto>(new Error("CheckIn.InvalidRequest", "records khong duoc rong."));
            }

            var response = new OfflineSyncResponseDto
            {
                Total = request.Records.Count
            };

            var registrationIds = request.Records.Select(x => x.RegistrationId).Distinct().ToList();
            var existingAttendances = await _unitOfWork.Attendances.GetByRegistrationIdsAsync(registrationIds);
            var existingRegistrationIds = existingAttendances
                .Select(a => a.RegistrationId)
                .ToHashSet();

            var hasInserted = false;

            foreach (var record in request.Records)
            {
                var result = new OfflineSyncRecordResultDto
                {
                    SyncKey = record.SyncKey,
                    RegistrationId = record.RegistrationId
                };

                if (record.RegistrationId == Guid.Empty || record.WorkshopId == Guid.Empty)
                {
                    result.Status = "failed";
                    result.Message = "registration_id hoac workshop_id khong hop le.";
                    response.Failed++;
                    response.Results.Add(result);
                    continue;
                }

                if (string.IsNullOrWhiteSpace(record.DeviceId))
                {
                    result.Status = "failed";
                    result.Message = "device_id khong duoc rong.";
                    response.Failed++;
                    response.Results.Add(result);
                    continue;
                }

                if (existingRegistrationIds.Contains(record.RegistrationId))
                {
                    result.Status = "duplicate";
                    result.Message = "Sinh vien da check-in truoc do.";
                    response.Duplicates++;
                    response.Results.Add(result);
                    continue;
                }

                var registration = await _unitOfWork.Registrations.GetByIdForCheckInAsync(record.RegistrationId);
                if (registration is null)
                {
                    result.Status = "failed";
                    result.Message = "Khong tim thay dang ky.";
                    response.Failed++;
                    response.Results.Add(result);
                    continue;
                }

                if (registration.WorkshopId != record.WorkshopId)
                {
                    result.Status = "failed";
                    result.Message = "Dang ky khong thuoc workshop da gui.";
                    response.Failed++;
                    response.Results.Add(result);
                    continue;
                }

                if (registration.Workshop.Status == WorkshopStatus.Cancelled)
                {
                    result.Status = "failed";
                    result.Message = "Workshop da bi huy.";
                    response.Failed++;
                    response.Results.Add(result);
                    continue;
                }

                if (registration.Status != RegistrationStatus.Confirmed)
                {
                    result.Status = "failed";
                    result.Message = "Dang ky chua duoc xac nhan.";
                    response.Failed++;
                    response.Results.Add(result);
                    continue;
                }

                var checkedInAt = record.CheckedInAt == default ? DateTime.UtcNow : record.CheckedInAt;

                var attendance = new Attendance(
                    registrationId: registration.Id,
                    userId: registration.UserId,
                    workshopId: registration.WorkshopId,
                    checkedInAt: checkedInAt,
                    offlineDeviceId: record.DeviceId.Trim());

                await _unitOfWork.Attendances.AddAsync(attendance);
                hasInserted = true;
                existingRegistrationIds.Add(registration.Id);

                result.Status = "inserted";
                result.AttendanceId = attendance.Id;
                response.Inserted++;
                response.Results.Add(result);
            }

            if (hasInserted)
            {
                await _unitOfWork.SaveChangesAsync();
            }

            return Result.Success(response);
        }
    }
}
