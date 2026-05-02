using Domain.Entities;

namespace Application.Abstractions.Repositories
{
    public interface IPaymentRepo
    {
        Task AddAsync(Payment payment);
        Task<Payment?> GetByIdAsync(Guid paymentId);
        Task<Payment?> GetByRegistrationIdAsync(Guid registrationId);
        Task<Payment?> GetByGatewayTransactionIdAsync(string gatewayTransactionId);
        Task<Payment?> GetByUserAndIdempotencyKeyAsync(Guid userId, string idempotencyKey);
    }
}