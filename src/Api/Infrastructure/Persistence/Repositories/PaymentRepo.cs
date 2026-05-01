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

        public async Task<Payment?> GetByIdAsync(Guid id, bool asNoTracking = true)
        {
            var query = BuildBaseQuery(asNoTracking);
            return await query.FirstOrDefaultAsync(payment => payment.Id == id);
        }

        public async Task<Payment?> GetByRegistrationIdAsync(Guid registrationId, bool asNoTracking = true)
        {
            var query = BuildBaseQuery(asNoTracking);
            return await query.FirstOrDefaultAsync(payment => payment.RegistrationId == registrationId);
        }

        public async Task<Payment?> GetByGatewayTransactionIdAsync(string gatewayTransactionId, bool asNoTracking = true)
        {
            var query = BuildBaseQuery(asNoTracking);
            return await query.FirstOrDefaultAsync(payment => payment.GatewayTransactionId == gatewayTransactionId);
        }

        private IQueryable<Payment> BuildBaseQuery(bool asNoTracking)
        {
            IQueryable<Payment> query = _context.Payments
                .Include(payment => payment.User)
                .Include(payment => payment.Registration)
                    .ThenInclude(registration => registration.User)
                .Include(payment => payment.Registration)
                    .ThenInclude(registration => registration.Workshop);

            if (asNoTracking)
            {
                query = query.AsNoTracking();
            }

            return query;
        }
    }
}