using Application.Abstractions.Repositories;
using System;
using System.Threading.Tasks;

namespace Application.Abstractions
{
    public interface IUnitOfWork : IDisposable
    {
        IWorkshopRepo Workshops { get; }
        // Add other repositories here as needed
        
        Task<int> SaveChangesAsync();
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
}
