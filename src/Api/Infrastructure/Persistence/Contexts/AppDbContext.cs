using Domain.Common;
using Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;

namespace Infrastructure.Persistence.Contexts
{
    public class AppDbContext : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>
    {
        private readonly IConfiguration _configuration;

        public AppDbContext(
            DbContextOptions<AppDbContext> options,
            IConfiguration configuration
        ) : base(options)
        {
            _configuration = configuration;
        }

        // Domain DbSets
        public DbSet<Workshop> Workshops { get; set; }
        public DbSet<Registration> Registrations { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Attendance> Attendances { get; set; }
        public DbSet<IdempotencyRecord> IdempotencyRecords { get; set; }

        // Outbox
        //public DbSet<OutboxMessage> OutboxMessages { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // ✅ Rename Identity tables (cleaner naming)
            builder.Entity<AppUser>().ToTable("Users");
            builder.Entity<IdentityRole<Guid>>().ToTable("Roles");
            builder.Entity<IdentityUserRole<Guid>>().ToTable("UserRoles");
            builder.Entity<IdentityUserClaim<Guid>>().ToTable("UserClaims");
            builder.Entity<IdentityUserLogin<Guid>>().ToTable("UserLogins");
            builder.Entity<IdentityRoleClaim<Guid>>().ToTable("RoleClaims");
            builder.Entity<IdentityUserToken<Guid>>().ToTable("UserTokens");

            // ✅ Apply all configurations automatically
            builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            // ✅ Handle audit fields
            foreach (var entry in ChangeTracker.Entries<BaseEntity>())
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.CreatedAt = DateTime.UtcNow;
                        break;

                    case EntityState.Modified:
                        entry.Entity.UpdatedAt = DateTime.UtcNow;
                        break;
                }
            }

            //// ✅ Collect domain events
            //var domainEvents = ChangeTracker
            //    .Entries<AggregateRoot>()
            //    .Where(e => e.Entity.DomainEvents.Any())
            //    .SelectMany(e => e.Entity.DomainEvents)
            //    .ToList();

            //// ✅ Convert to Outbox messages
            //foreach (var domainEvent in domainEvents)
            //{
            //    var type = domainEvent.GetType().AssemblyQualifiedName!;
            //    var payload = JsonConvert.SerializeObject(domainEvent);

            //    OutboxMessages.Add(new OutboxMessage
            //    {
            //        Type = type,
            //        Payload = payload,
            //        OccurredOn = DateTime.UtcNow
            //    });
            //}

            //// ✅ Clear domain events
            //foreach (var entry in ChangeTracker.Entries<AggregateRoot>())
            //{
            //    entry.Entity.ClearDomainEvents();
            //}

            return await base.SaveChangesAsync(cancellationToken);
        }
    }
}