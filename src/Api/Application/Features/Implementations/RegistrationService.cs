using Application.Abstractions;
using Application.DTOs.Registration;
using Application.Features.Interfaces;
using Domain;
using Domain.Entities;
using Domain.Shared;

namespace Application.Features.Implementations
{
    public class RegistrationService : IRegistrationService
    {
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

            if (!string.IsNullOrWhiteSpace(idempotencyKey))
            {
                var existingByIdempotency = await _unitOfWork.Registrations.GetByIdempotencyKeyAsync(userId, idempotencyKey);
                if (existingByIdempotency is not null)
                {
                    return Result.Success(ToDto(existingByIdempotency));
                }
            }

            var workshop = await _unitOfWork.Registrations.GetWorkshopForUpdateAsync(request.WorkshopId);
            if (workshop is null)
            {
                return Result.Failure<RegistrationDto>(new Error("Workshop.NotFound", "Khong tim thay workshop."));
            }

            if (workshop.Status != WorkshopStatus.Published)
            {
                return Result.Failure<RegistrationDto>(new Error("Registration.WorkshopUnavailable", "Workshop khong kha dung de dang ky."));
            }

            if (workshop.StartTime <= DateTime.UtcNow)
            {
                return Result.Failure<RegistrationDto>(new Error("Registration.WorkshopStarted", "Workshop da bat dau, khong the dang ky."));
            }

            var duplicated = await _unitOfWork.Registrations.GetByUserAndWorkshopAsync(userId, request.WorkshopId);
            if (duplicated is not null)
            {
                return Result.Failure<RegistrationDto>(new Error("Registration.AlreadyRegistered", "Ban da dang ky workshop nay roi."));
            }

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                if (!workshop.TryReserveSlot())
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result.Failure<RegistrationDto>(new Error("Registration.NoSlots", "Het cho cho workshop nay."));
                }

                var registration = new Registration(userId, request.WorkshopId, idempotencyKey);

                if (workshop.IsFree)
                {
                    registration.Confirm($"REG-{registration.Id:N}");
                }

                await _unitOfWork.Registrations.AddAsync(registration);
                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();

                return Result.Success(ToDto(registration, workshop.Title, workshop.IsFree));
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task<Result<RegistrationDto>> GetByIdAsync(Guid userId, Guid registrationId)
        {
            var registration = await _unitOfWork.Registrations.GetByIdWithWorkshopAsync(registrationId);
            if (registration is null)
            {
                return Result.Failure<RegistrationDto>(new Error("Registration.NotFound", "Khong tim thay dang ky."));
            }

            if (registration.UserId != userId)
            {
                return Result.Failure<RegistrationDto>(new Error("Registration.Forbidden", "Ban khong co quyen xem dang ky nay."));
            }

            return Result.Success(ToDto(registration));
        }

        public async Task<Result<List<RegistrationDto>>> GetMineAsync(Guid userId)
        {
            var items = await _unitOfWork.Registrations.GetByUserIdAsync(userId);
            return Result.Success(items.Select(r => ToDto(r)).ToList());
        }

        public async Task<Result<bool>> CancelAsync(Guid userId, Guid registrationId)
        {
            var registration = await _unitOfWork.Registrations.GetByIdWithWorkshopAsync(registrationId);
            if (registration is null)
            {
                return Result.Failure<bool>(new Error("Registration.NotFound", "Khong tim thay dang ky."));
            }

            if (registration.UserId != userId)
            {
                return Result.Failure<bool>(new Error("Registration.Forbidden", "Ban khong co quyen huy dang ky nay."));
            }

            if (registration.Status == RegistrationStatus.Cancelled)
            {
                return Result.Failure<bool>(new Error("Registration.AlreadyCancelled", "Dang ky da duoc huy truoc do."));
            }

            if (registration.Workshop.StartTime <= DateTime.UtcNow)
            {
                return Result.Failure<bool>(new Error("Registration.CannotCancel", "Workshop da bat dau, khong the huy dang ky."));
            }

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                registration.Cancel();
                registration.Workshop.ReleaseSlot();
                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();
                return Result.Success(true);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        private static RegistrationDto ToDto(Registration registration, string? workshopTitle = null, bool? isFree = null)
        {
            var title = workshopTitle ?? registration.Workshop?.Title ?? string.Empty;
            var workshopIsFree = isFree ?? registration.Workshop?.IsFree ?? true;

            var paymentStatus = workshopIsFree
                ? "NOT_REQUIRED"
                : registration.Payment?.Status switch
                {
                    PaymentStatus.Completed => "COMPLETED",
                    PaymentStatus.Failed => "FAILED",
                    PaymentStatus.Refunded => "REFUNDED",
                    PaymentStatus.Timeout => "TIMEOUT",
                    _ => "PENDING"
                };

            return new RegistrationDto
            {
                Id = registration.Id,
                WorkshopId = registration.WorkshopId,
                WorkshopTitle = title,
                Status = registration.Status.ToString().ToUpperInvariant(),
                PaymentStatus = paymentStatus,
                QrCode = registration.QrCode,
                PollingUrl = $"/api/registrations/{registration.Id}",
                RegisteredAt = registration.CreatedAt
            };
        }
    }
}
