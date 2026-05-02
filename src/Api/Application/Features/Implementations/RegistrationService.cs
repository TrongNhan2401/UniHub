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

        /// <summary>
        /// Tạo registration mới với xử lý đầy đủ:
        /// - Idempotency: Tránh duplicate khi client retry
        /// - Duplicate check: Tránh user đăng ký 2 lần cùng workshop
        /// - Race condition: Sử dụng pessimistic lock để tránh overbook slot
        /// - Transaction: Đảm bảo atomic operation (tất cả hoặc không)
        /// </summary>
        public async Task<Result<RegistrationDto>> CreateAsync(Guid userId, CreateRegistrationRequestDto request, string? idempotencyKey)
        {
            // === VALIDATION ===
            if (request.WorkshopId == Guid.Empty)
            {
                return Result.Failure<RegistrationDto>(new Error("Registration.InvalidWorkshop", "WorkshopId khong hop le."));
            }

            // === STEP 1: IDEMPOTENCY CHECK ===
            // Kiểm tra nếu client đã gửi request này trước đó (dựa trên idempotencyKey)
            // Nếu có: trả về bản ghi cũ (tránh duplicate từ retry)
            // Nếu không: tiếp tục tạo mới
            if (!string.IsNullOrWhiteSpace(idempotencyKey))
            {
                var existingByIdempotency = await _unitOfWork.Registrations.GetByIdempotencyKeyAsync(userId, idempotencyKey);
                if (existingByIdempotency is not null)
                {
                    // Client đã gửi request này rồi → trả về kết quả cũ (idempotent)
                    return Result.Success(ToDto(existingByIdempotency));
                }
            }

            // === STEP 2: LOAD WORKSHOP WITH PESSIMISTIC LOCK ===
            // Gọi GetWorkshopForUpdateAsync: LOCK workshop row để ngăn race condition
            // Chỉ 1 request có thể sửa RegisteredCount tại 1 thời điểm
            var workshop = await _unitOfWork.Registrations.GetWorkshopForUpdateAsync(request.WorkshopId);
            if (workshop is null)
            {
                return Result.Failure<RegistrationDto>(new Error("Workshop.NotFound", "Khong tim thay workshop."));
            }

            // === STEP 3: BUSINESS RULE VALIDATION ===
            // Workshop phải ở trạng thái Published
            if (workshop.Status != WorkshopStatus.Published)
            {
                return Result.Failure<RegistrationDto>(new Error("Registration.WorkshopUnavailable", "Workshop khong kha dung de dang ky."));
            }

            // Workshop chưa bắt đầu
            if (workshop.StartTime <= DateTime.UtcNow)
            {
                return Result.Failure<RegistrationDto>(new Error("Registration.WorkshopStarted", "Workshop da bat dau, khong the dang ky."));
            }

            // === STEP 4: DUPLICATE CHECK ===
            // Kiểm tra user đã đăng ký workshop này chưa (không loại trừ cancelled)
            // Nếu có registration chưa cancelled: reject (tránh user đăng ký 2 lần)
            var duplicated = await _unitOfWork.Registrations.GetByUserAndWorkshopAsync(userId, request.WorkshopId);
            if (duplicated is not null)
            {
                return Result.Failure<RegistrationDto>(new Error("Registration.AlreadyRegistered", "Ban da dang ky workshop nay roi."));
            }

            // === STEP 5: TRANSACTION - RESERVE SLOT + CREATE REGISTRATION ===
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                // TryReserveSlot() check: RegisteredCount < TotalSlots
                // Nếu còn slot: increment RegisteredCount → return true
                // Nếu hết: return false → "Hết chỗ"
                // Pessimistic lock đảm bảo chỉ 1 request check/increment tại 1 thời điểm
                if (!workshop.TryReserveSlot())
                {
                    await _unitOfWork.RollbackTransactionAsync();
                    return Result.Failure<RegistrationDto>(new Error("Registration.NoSlots", "Het cho cho workshop nay."));
                }

                // Tạo registration entity với status = Pending (mặc định)
                var registration = new Registration(userId, request.WorkshopId, idempotencyKey);

                // Nếu workshop miễn phí: confirm ngay (status = Confirmed, QrCode = REG-...)
                // Nếu workshop có phí: status = Pending → chờ payment callback
                if (workshop.IsFree)
                {
                    registration.Confirm($"REG-{registration.Id:N}");
                }

                // Thêm registration vào DB + increment workshop.RegisteredCount
                await _unitOfWork.Registrations.AddAsync(registration);
                await _unitOfWork.SaveChangesAsync();

                // Commit transaction: release pessimistic lock, write changes to DB
                await _unitOfWork.CommitTransactionAsync();

                return Result.Success(ToDto(registration, workshop.Title, workshop.IsFree));
            }
            catch
            {
                // Nếu có exception: rollback transaction
                // - workshop.RegisteredCount không được increment
                // - registration không được lưu
                // - pessimistic lock được release
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

        /// <summary>
        /// Huỷ registration và hoàn trả slot về workshop.
        /// Đảm bảo atomic: hoặc huỷ + release slot, hoặc không làm gì (không trạng thái nửa vời).
        /// </summary>
        public async Task<Result<bool>> CancelAsync(Guid userId, Guid registrationId)
        {
            // Lấy registration + workshop với full data
            var registration = await _unitOfWork.Registrations.GetByIdWithWorkshopAsync(registrationId);
            if (registration is null)
            {
                return Result.Failure<bool>(new Error("Registration.NotFound", "Khong tim thay dang ky."));
            }

            // Kiểm tra authorization: chỉ owner mới được huỷ
            if (registration.UserId != userId)
            {
                return Result.Failure<bool>(new Error("Registration.Forbidden", "Ban khong co quyen huy dang ky nay."));
            }

            // Không huỷ nếu đã bị huỷ trước đó
            if (registration.Status == RegistrationStatus.Cancelled)
            {
                return Result.Failure<bool>(new Error("Registration.AlreadyCancelled", "Dang ky da duoc huy truoc do."));
            }

            // Không huỷ nếu workshop đã bắt đầu
            if (registration.Workshop.StartTime <= DateTime.UtcNow)
            {
                return Result.Failure<bool>(new Error("Registration.CannotCancel", "Workshop da bat dau, khong the huy dang ky."));
            }

            // TRANSACTION: Huỷ + Release slot (atomic)
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                // Đổi status → Cancelled
                registration.Cancel();

                // Hoàn trả slot: decrement RegisteredCount
                // Bây giờ user khác có thể reserve slot này
                registration.Workshop.ReleaseSlot();

                // Write changes
                await _unitOfWork.SaveChangesAsync();

                // Commit
                await _unitOfWork.CommitTransactionAsync();
                return Result.Success(true);
            }
            catch
            {
                // Rollback: không huỷ, không release slot
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
