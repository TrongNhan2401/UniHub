using Application.DTOs.Registration;
using Domain;
using Domain.Entities;

namespace Application.Abstractions.Repositories
{
    public interface IRegistrationRepo
    {
        Task AddAsync(Registration registration);
        Task<Registration?> GetByIdAsync(Guid id, bool asNoTracking = true);
        Task<Registration?> GetByUserWorkshopAsync(Guid userId, Guid workshopId, bool asNoTracking = true);
        Task<Registration?> GetByUserAndIdempotencyKeyAsync(Guid userId, string idempotencyKey, bool asNoTracking = true);
        Task<List<Registration>> GetMineAsync(Guid userId);
        Task<(List<Registration> Items, int TotalCount)> GetPagedAsync(Guid? workshopId, RegistrationStatus? status, int pageNumber, int pageSize);
        Task<List<Registration>> GetConfirmedByWorkshopAsync(Guid workshopId);
        Task<List<RegistrationExportCsvRowDto>> GetExportRowsAsync(Guid workshopId);
        Task<bool> ExistsAsync(Guid id);
    }
}