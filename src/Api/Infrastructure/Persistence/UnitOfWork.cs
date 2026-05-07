using Application.Abstractions;
using Application.Abstractions.Repositories;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore.Storage;
using System.Threading.Tasks;

namespace Infrastructure.Persistence
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;
        private IDbContextTransaction? _transaction;

        public IWorkshopRepo Workshops { get; }
        public ISyncTaskRepo SyncTasks { get; }
        public IRegistrationRepo Registrations { get; }
        public IPaymentRepo Payments { get; }
        public IAttendanceRepo Attendances { get; }

        public UnitOfWork(
            AppDbContext context,
            IWorkshopRepo workshopRepo,
            ISyncTaskRepo syncTaskRepo,
            IRegistrationRepo registrationRepo,
            IPaymentRepo paymentRepo,
            IAttendanceRepo attendanceRepo)
        {
            _context = context;
            Workshops = workshopRepo;
            SyncTasks = syncTaskRepo;
            Registrations = registrationRepo;
            Payments = paymentRepo;
            Attendances = attendanceRepo;
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public async Task BeginTransactionAsync()
        {
            _transaction = await _context.Database.BeginTransactionAsync();
        }

        public async Task CommitTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.CommitAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public async Task RollbackTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public void Dispose()
        {
            _transaction?.Dispose();
            _context.Dispose();
        }
    }
}
