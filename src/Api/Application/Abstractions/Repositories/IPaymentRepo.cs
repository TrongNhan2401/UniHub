using Domain.Entities;

namespace Application.Abstractions.Repositories
{
    public interface IPaymentRepo
    {
        Task AddAsync(Payment payment);
        Task<Payment?> GetByIdAsync(Guid id, bool asNoTracking = true);
        Task<Payment?> GetByRegistrationIdAsync(Guid registrationId, bool asNoTracking = true);
        Task<Payment?> GetByGatewayTransactionIdAsync(string gatewayTransactionId, bool asNoTracking = true);
    }
}