using Application.Abstractions;
using Application.DTOs.CheckIn;
using Application.Features.Interfaces;
using Domain;
using Domain.Entities;
using Domain.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Implementations
{
    public class CheckInService : ICheckInService
    {
        private const string CheckInStaffRoleName = "CHECKIN_STAFF";

        private readonly IUnitOfWork _unitOfWork;
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;

        public CheckInService(IUnitOfWork unitOfWork, UserManager<AppUser> userManager, RoleManager<IdentityRole<Guid>> roleManager)
        {
            _unitOfWork = unitOfWork;
            _userManager = userManager;
            _roleManager = roleManager;
        }

        public async Task<Result<Guid>> RegisterCheckinStaffAsync(CreateCheckinStaffRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.FullName))
            {
                return Result.Failure<Guid>(new Error("CheckIn.InvalidRequest", "Email, password, fullName khong duoc de trong."));
            }

            if (await _userManager.FindByEmailAsync(request.Email) is not null)
            {
                return Result.Failure<Guid>(new Error("CheckIn.EmailExists", "Email da ton tai."));
            }

            var user = new AppUser(request.Email, request.FullName, UserRole.CheckInStaff);
            var createResult = await _userManager.CreateAsync(user, request.Password);
            if (!createResult.Succeeded)
            {
                var errorMsg = string.Join("; ", createResult.Errors.Select(e => e.Description));
                return Result.Failure<Guid>(new Error("CheckIn.CreateFailed", errorMsg));
            }

            // Đảm bảo role tồn tại và gán role
            if (!await _roleManager.RoleExistsAsync(CheckInStaffRoleName))
            {
                await _roleManager.CreateAsync(new IdentityRole<Guid>(CheckInStaffRoleName));
            }
            await _userManager.AddToRoleAsync(user, CheckInStaffRoleName);

            return Result.Success(user.Id);
        }

        public async Task<Result<PagedResult<CheckinStaffDto>>> GetAllCheckinStaffAsync(int pageNumber, int pageSize)
        {
            try
            {
                if (pageNumber < 1 || pageSize < 1)
                {
                    return Result.Failure<PagedResult<CheckinStaffDto>>(new Error("CheckIn.InvalidRequest", "pageNumber va pageSize phai lon hon 0."));
                }

                var query = _userManager.Users
                    .AsNoTracking()
                    .Where(u => u.Role == UserRole.CheckInStaff)
                    .OrderByDescending(u => u.CreatedAt);

                var totalCount = await query.CountAsync();
                var staffUsers = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var staffList = staffUsers
                    .Select(u => new CheckinStaffDto
                    {
                        Id = u.Id,
                        Email = u.Email ?? string.Empty,
                        FullName = u.FullName,
                        CreatedAt = u.CreatedAt
                    })
                    .ToList();

                return Result.Success(new PagedResult<CheckinStaffDto>(staffList, totalCount, pageNumber, pageSize));
            }
            catch (Exception ex)
            {
                return Result.Failure<PagedResult<CheckinStaffDto>>(new Error("CheckIn.GetStaffFailed", $"Loi khi lay danh sach staff: {ex.Message}"));
            }
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
