using Application.Abstractions;
using Application.DTOs.Registration;
using Application.Features.Interfaces;
using Domain;
using Domain.Entities;
using Domain.Shared;
using System.Text;

namespace Application.Features.Implementations
{
    public class RegistrationService : IRegistrationService
    {
        private const string PaymentStatusNotRequired = "NOT_REQUIRED";

        private readonly IUnitOfWork _unitOfWork;

        public RegistrationService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<Result<RegistrationDto>> CreateAsync(Guid userId, CreateRegistrationRequestDto request, string? idempotencyKey)
        {
            if (request.WorkshopId == Guid.Empty)
            {
                return Result.Failure<RegistrationDto>(new Error("Registration.InvalidWorkshop", "WorkshopId khong hop le."));
            }

            if (string.IsNullOrWhiteSpace(idempotencyKey))
            {
                return Result.Failure<RegistrationDto>(new Error("Registration.IdempotencyRequired", "Can gui header Idempotency-Key."));
            }

            var normalizedIdempotencyKey = idempotencyKey.Trim();

            var previousAttempt = await _unitOfWork.Registrations
                .GetByUserAndIdempotencyKeyAsync(userId, normalizedIdempotencyKey);

            if (previousAttempt is not null)
            {
                return Result.Success(ToDto(previousAttempt));
            }

            var existing = await _unitOfWork.Registrations
                .GetByUserWorkshopAsync(userId, request.WorkshopId);

            if (existing is not null)
            {
                return Result.Failure<RegistrationDto>(new Error("Registration.AlreadyExists", "Ban da dang ky workshop nay."));
            }

            var workshop = await _unitOfWork.Workshops.GetByIdAsync(request.WorkshopId);

            if (workshop is null)
            {
                return Result.Failure<RegistrationDto>(new Error("Workshop.NotFound", "Khong tim thay workshop."));
            }

            if (workshop.Status != WorkshopStatus.Published)
            {
                return Result.Failure<RegistrationDto>(new Error("Workshop.Unavailable", "Workshop hien khong kha dung de dang ky."));
            }

            if (workshop.StartTime <= DateTime.UtcNow)
            {
                return Result.Failure<RegistrationDto>(new Error("Workshop.Started", "Workshop da bat dau, khong the dang ky moi."));
            }

            await _unitOfWork.BeginTransactionAsync();

            try
            {
                var reserved = await _unitOfWork.Workshops.TryReserveSlotAsync(request.WorkshopId, DateTime.UtcNow);
                if (!reserved)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result.Failure<RegistrationDto>(new Error("Registration.NoSlots", "Workshop da het cho."));
                }

                var registration = new Registration(userId, request.WorkshopId, normalizedIdempotencyKey);

                if (workshop.IsFree)
                {
                    var qrToken = GenerateQrToken();
                    var qrCode = GenerateQrCode(registration.Id);
                    registration.Confirm(qrCode, qrToken);
                }
                else
                {
                    registration.MarkPending();

                    var payment = Payment.Create(
                        registration.Id,
                        userId,
                        workshop.Price,
                        Guid.NewGuid().ToString("N"),
                        DateTime.UtcNow.AddMinutes(15));

                    await _unitOfWork.Payments.AddAsync(payment);
                }

                await _unitOfWork.Registrations.AddAsync(registration);

                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();

                var saved = await _unitOfWork.Registrations.GetByIdAsync(registration.Id);
                if (saved is null)
                {
                    return Result.Failure<RegistrationDto>(new Error("Registration.NotFound", "Dang ky vua tao khong ton tai."));
                }

                return Result.Success(ToDto(saved));
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return Result.Failure<RegistrationDto>(new Error("Registration.CreateFailed", ex.Message));
            }
        }

        public async Task<Result<RegistrationDto>> GetByIdAsync(Guid registrationId, Guid currentUserId, bool isOrganizer)
        {
            var registration = await _unitOfWork.Registrations.GetByIdAsync(registrationId);

            if (registration is null)
            {
                return Result.Failure<RegistrationDto>(new Error("Registration.NotFound", "Khong tim thay dang ky."));
            }

            if (!isOrganizer && registration.UserId != currentUserId)
            {
                return Result.Failure<RegistrationDto>(new Error("Registration.Forbidden", "Ban khong co quyen truy cap dang ky nay."));
            }

            return Result.Success(ToDto(registration));
        }

        public async Task<Result<List<RegistrationDto>>> GetMineAsync(Guid userId)
        {
            var items = await _unitOfWork.Registrations.GetMineAsync(userId);
            return Result.Success(items.Select(ToDto).ToList());
        }

        public async Task<Result<PagedResult<RegistrationDto>>> GetPagedAsync(Guid? workshopId, string? status, int pageNumber, int pageSize)
        {
            if (pageNumber <= 0 || pageSize <= 0)
            {
                return Result.Failure<PagedResult<RegistrationDto>>(new Error("Registration.InvalidPaging", "pageNumber va pageSize phai lon hon 0."));
            }

            RegistrationStatus? statusFilter = null;
            if (!string.IsNullOrWhiteSpace(status))
            {
                if (!Enum.TryParse<RegistrationStatus>(status.Trim(), true, out var parsedStatus))
                {
                    return Result.Failure<PagedResult<RegistrationDto>>(new Error("Registration.InvalidStatus", "Gia tri status khong hop le."));
                }

                statusFilter = parsedStatus;
            }

            var (items, totalCount) = await _unitOfWork.Registrations.GetPagedAsync(workshopId, statusFilter, pageNumber, pageSize);
            var dtos = items.Select(ToDto).ToList();

            return Result.Success(new PagedResult<RegistrationDto>(dtos, totalCount, pageNumber, pageSize));
        }

        public async Task<Result<bool>> CancelAsync(Guid registrationId, Guid currentUserId, bool isOrganizer)
        {
            var registration = await _unitOfWork.Registrations.GetByIdAsync(registrationId, asNoTracking: false);

            if (registration is null)
            {
                return Result.Failure<bool>(new Error("Registration.NotFound", "Khong tim thay dang ky."));
            }

            if (!isOrganizer && registration.UserId != currentUserId)
            {
                return Result.Failure<bool>(new Error("Registration.Forbidden", "Ban khong co quyen huy dang ky nay."));
            }

            if (registration.Status == RegistrationStatus.Cancelled)
            {
                return Result.Failure<bool>(new Error("Registration.AlreadyCancelled", "Dang ky da bi huy truoc do."));
            }

            if (registration.Workshop.StartTime <= DateTime.UtcNow)
            {
                return Result.Failure<bool>(new Error("Registration.CannotCancel", "Khong the huy dang ky sau khi workshop da bat dau."));
            }

            await _unitOfWork.BeginTransactionAsync();

            try
            {
                registration.Cancel();

                var released = await _unitOfWork.Workshops.TryReleaseSlotAsync(registration.WorkshopId);
                if (!released)
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result.Failure<bool>(new Error("Registration.ReleaseFailed", "Khong the hoan slot cho workshop."));
                }

                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();

                return Result.Success(true);
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return Result.Failure<bool>(new Error("Registration.CancelFailed", ex.Message));
            }
        }

        public async Task<Result<RegistrationExportFileDto>> ExportCsvAsync(Guid workshopId)
        {
            var exists = await _unitOfWork.Workshops.GetByIdAsync(workshopId);
            if (exists is null)
            {
                return Result.Failure<RegistrationExportFileDto>(new Error("Workshop.NotFound", "Khong tim thay workshop."));
            }

            var rows = await _unitOfWork.Registrations.GetExportRowsAsync(workshopId);

            var sb = new StringBuilder();
            sb.AppendLine("registration_id,student_id,student_name,email,workshop_title,workshop_start_time,registration_status,payment_status,registered_at");

            foreach (var row in rows)
            {
                sb.AppendLine(string.Join(",",
                    EscapeCsv(row.RegistrationId.ToString()),
                    EscapeCsv(row.StudentId),
                    EscapeCsv(row.StudentName),
                    EscapeCsv(row.Email),
                    EscapeCsv(row.WorkshopTitle),
                    EscapeCsv(row.WorkshopStartTime.ToString("O")),
                    EscapeCsv(row.RegistrationStatus),
                    EscapeCsv(row.PaymentStatus),
                    EscapeCsv(row.RegisteredAt.ToString("O"))
                ));
            }

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            var dto = new RegistrationExportFileDto
            {
                Content = bytes,
                ContentType = "text/csv",
                FileName = $"registrations_{workshopId:N}.csv"
            };

            return Result.Success(dto);
        }

        public async Task<Result<RegistrationDto>> RegenerateQrAsync(Guid registrationId)
        {
            var registration = await _unitOfWork.Registrations.GetByIdAsync(registrationId, asNoTracking: false);

            if (registration is null)
            {
                return Result.Failure<RegistrationDto>(new Error("Registration.NotFound", "Khong tim thay dang ky."));
            }

            if (registration.Status != RegistrationStatus.Confirmed)
            {
                return Result.Failure<RegistrationDto>(new Error("Registration.InvalidStatus", "Chi co the cap lai QR cho dang ky da xac nhan."));
            }

            registration.RegenerateQr(GenerateQrCode(registration.Id), GenerateQrToken());
            await _unitOfWork.SaveChangesAsync();

            var refreshed = await _unitOfWork.Registrations.GetByIdAsync(registration.Id);
            if (refreshed is null)
            {
                return Result.Failure<RegistrationDto>(new Error("Registration.NotFound", "Khong tim thay dang ky sau khi cap nhat QR."));
            }

            return Result.Success(ToDto(refreshed));
        }

        private static RegistrationDto ToDto(Registration registration)
        {
            var paymentStatus = registration.Workshop.IsFree
                ? PaymentStatusNotRequired
                : registration.Payment is null
                    ? PaymentStatus.Pending.ToString().ToUpperInvariant()
                    : registration.Payment.Status.ToString().ToUpperInvariant();

            return new RegistrationDto
            {
                Id = registration.Id,
                UserId = registration.UserId,
                StudentId = registration.User?.StudentId ?? string.Empty,
                StudentName = registration.User?.FullName ?? string.Empty,
                WorkshopId = registration.WorkshopId,
                WorkshopTitle = registration.Workshop?.Title ?? string.Empty,
                WorkshopStartTime = registration.Workshop?.StartTime ?? DateTime.MinValue,
                Status = registration.Status.ToString().ToUpperInvariant(),
                PaymentStatus = paymentStatus,
                IsFreeWorkshop = registration.Workshop?.IsFree ?? true,
                Price = registration.Workshop?.Price ?? 0,
                QrCode = registration.QrCode,
                QrToken = registration.QrToken,
                RegisteredAt = registration.CreatedAt
            };
        }

        private static string GenerateQrCode(Guid registrationId)
        {
            return $"REG-{registrationId:N}";
        }

        private static string GenerateQrToken()
        {
            return Convert.ToBase64String(Guid.NewGuid().ToByteArray())
                .Replace("+", string.Empty)
                .Replace("/", string.Empty)
                .Replace("=", string.Empty);
        }

        private static string EscapeCsv(string value)
        {
            var escaped = value.Replace("\"", "\"\"");
            return $"\"{escaped}\"";
        }
    }
}