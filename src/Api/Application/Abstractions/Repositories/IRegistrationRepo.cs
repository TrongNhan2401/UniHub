using Domain.Entities;

namespace Application.Abstractions.Repositories
{
    public interface IRegistrationRepo
    {
        Task AddAsync(Registration registration);
        Task<Registration?> GetByIdAsync(Guid registrationId);
        Task<Registration?> GetByIdWithWorkshopAsync(Guid registrationId);
        Task<List<Registration>> GetByUserIdAsync(Guid userId);
        Task<Registration?> GetByUserAndWorkshopAsync(Guid userId, Guid workshopId);
        Task<Registration?> GetByIdempotencyKeyAsync(Guid userId, string idempotencyKey);
        Task<Workshop?> GetWorkshopForUpdateAsync(Guid workshopId);
    }
}
