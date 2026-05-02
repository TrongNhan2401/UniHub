using Application.Abstractions.Repositories;
using Domain.Entities;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class RegistrationRepo : IRegistrationRepo
    {
        private readonly AppDbContext _context;

        public RegistrationRepo(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Registration registration)
        {
            await _context.Registrations.AddAsync(registration);
        }

        public async Task<Registration?> GetByIdAsync(Guid registrationId)
        {
            return await _context.Registrations
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == registrationId);
        }

        public async Task<Registration?> GetByIdWithWorkshopAsync(Guid registrationId)
        {
            return await _context.Registrations
                .Include(r => r.Workshop)
                .Include(r => r.Payment)
                .FirstOrDefaultAsync(r => r.Id == registrationId);
        }

        public async Task<List<Registration>> GetByUserIdAsync(Guid userId)
        {
            return await _context.Registrations
                .AsNoTracking()
                .Include(r => r.Workshop)
                .Include(r => r.Payment)
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        /// <summary>
        /// [DUPLICATE PREVENTION] Kiểm tra xem user đã đăng ký workshop này chưa.
        /// Loại trừ các đăng ký đã bị huỷ để cho phép user đăng ký lại sau khi huỷ.
        /// </summary>
        public async Task<Registration?> GetByUserAndWorkshopAsync(Guid userId, Guid workshopId)
        {
            return await _context.Registrations
                .FirstOrDefaultAsync(r => r.UserId == userId && r.WorkshopId == workshopId && r.Status != Domain.RegistrationStatus.Cancelled);
        }

        /// <summary>
        /// [IDEMPOTENCY] Lấy registration đã tồn tại với cùng idempotency key từ client.
        /// Dùng khi client retry request sau timeout/network error để tránh tạo duplicate.
        /// Đảm bảo retry an toàn: request lặp lại với cùng key sẽ trả về kết quả cũ (không tạo mới).
        /// </summary>
        public async Task<Registration?> GetByIdempotencyKeyAsync(Guid userId, string idempotencyKey)
        {
            return await _context.Registrations
                .Include(r => r.Workshop)
                .Include(r => r.Payment)
                .FirstOrDefaultAsync(r => r.UserId == userId && r.IdempotencyKey == idempotencyKey);
        }

        /// <summary>
        /// [RACE CONDITION PREVENTION] Lấy workshop row với PESSIMISTIC LOCK (SELECT FOR UPDATE).
        /// 
        /// Khi request gọi method này:
        /// 1. Database sẽ LOCK row workshop để ngăn các request khác sửa đổi
        /// 2. Các request khác phải CHỜ cho đến khi lock được release
        /// 3. Đảm bảo chỉ 1 request có thể reserve slot tại một thời điểm
        /// 
        /// Scenario: Workshop còn 1 chỗ, 1000 requests cùng lúc
        /// - Request 1 lock & check (1 < 1) → reserve (RegisteredCount=1)
        /// - Request 2-1000 phải chờ lock
        /// - Khi request 2 acquire lock: check (1 < 1) FALSE → "Hết chỗ"
        /// 
        /// Lưu ý: Phải sử dụng trong transaction và gọi SaveChangesAsync() để release lock.
        /// </summary>
        public async Task<Workshop?> GetWorkshopForUpdateAsync(Guid workshopId)
        {
            // PostgreSQL: SELECT ... FOR UPDATE locks the row until transaction commits/rollbacks
            return await _context.Workshops
                .FromSqlRaw(
                    "SELECT \"Id\", \"Title\", \"Description\", \"SpeakerName\", \"SpeakerBio\", " +
                    "\"Room\", \"RoomMapUrl\", \"StartTime\", \"EndTime\", \"TotalSlots\", " +
                    "\"RegisteredCount\", \"IsFree\", \"Price\", \"Status\", \"ImageUrl\", " +
                    "\"PdfUrl\", \"AiSummary\", \"AiSummaryGeneratedAt\", \"CreatedByUserId\", " +
                    "\"CreatedAt\", \"UpdatedAt\" " +
                    "FROM \"Workshops\" WHERE \"Id\" = {0} FOR UPDATE",
                    workshopId)
                .FirstOrDefaultAsync();
        }
    }
}
