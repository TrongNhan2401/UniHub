using Domain.Entities;

namespace Application.Abstractions.Repositories
{
    public interface IAttendanceRepo
    {
        Task AddAsync(Attendance attendance);
        Task<Attendance?> GetByRegistrationIdAsync(Guid registrationId);
        Task<List<Attendance>> GetByWorkshopIdAsync(Guid workshopId);
    }
}
