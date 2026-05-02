using Application.Abstractions.Repositories;
using Domain.Entities;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories
{
    public class PaymentRepo : IPaymentRepo
    {
        private readonly AppDbContext _context;

        public PaymentRepo(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Payment payment)
        {
            await _context.Payments.AddAsync(payment);
        }

        public async Task<Payment?> GetByIdAsync(Guid paymentId)
        {
            return await _context.Payments
                .Include(p => p.Registration)
                .ThenInclude(r => r.Workshop)
                .FirstOrDefaultAsync(p => p.Id == paymentId);
        }

        public async Task<Payment?> GetByRegistrationIdAsync(Guid registrationId)
        {
            return await _context.Payments
                .FirstOrDefaultAsync(p => p.RegistrationId == registrationId);
        }

        public async Task<Payment?> GetByGatewayTransactionIdAsync(string gatewayTransactionId)
        {
            return await _context.Payments
                .FirstOrDefaultAsync(p => p.GatewayTransactionId == gatewayTransactionId);
        }

        public async Task<Payment?> GetByUserAndIdempotencyKeyAsync(Guid userId, string idempotencyKey)
        {
            return await _context.Payments
                .FirstOrDefaultAsync(p => p.UserId == userId && p.IdempotencyKey == idempotencyKey);
        }
    }
}