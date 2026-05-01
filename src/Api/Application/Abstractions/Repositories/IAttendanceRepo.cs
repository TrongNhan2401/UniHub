using Domain.Entities;

namespace Application.Abstractions.Repositories
{
    public interface IAttendanceRepo
    {
        Task AddAsync(Attendance attendance);
        Task<Attendance?> GetByRegistrationIdAsync(Guid registrationId, bool asNoTracking = true);
        Task<bool> ExistsByRegistrationIdAsync(Guid registrationId);
        Task<(List<Attendance> Items, int TotalCount)> GetByWorkshopPagedAsync(Guid workshopId, int pageNumber, int pageSize);
    }
}