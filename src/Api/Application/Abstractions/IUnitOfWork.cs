using Application.Abstractions.Repositories;
using System;
using System.Threading.Tasks;

namespace Application.Abstractions
{
    public interface IUnitOfWork : IDisposable
    {
        IWorkshopRepo Workshops { get; }
        ISyncTaskRepo SyncTasks { get; }
        IRegistrationRepo Registrations { get; }
        IPaymentRepo Payments { get; }
        IAttendanceRepo Attendances { get; }

        Task<int> SaveChangesAsync();
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
}
