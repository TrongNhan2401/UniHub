using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class RegistrationConfiguration : IEntityTypeConfiguration<Registration>
    {
        public void Configure(EntityTypeBuilder<Registration> builder)
        {
            builder.ToTable("Registrations");

            builder.Property(r => r.Status)
                .IsRequired();

            builder.Property(r => r.QrToken)
                .HasMaxLength(200);

            builder.Property(r => r.IdempotencyKey)
                .HasMaxLength(100);

            // Unique: prevent duplicate registration
            builder.HasIndex(r => new { r.UserId, r.WorkshopId })
                .IsUnique();

            // Relationships
            builder.HasOne(r => r.User)
                .WithMany(u => u.Registrations)
                .HasForeignKey(r => r.UserId);

            builder.HasOne(r => r.Workshop)
                .WithMany(w => w.Registrations)
                .HasForeignKey(r => r.WorkshopId)
                .OnDelete(DeleteBehavior.Restrict);

            // 1-1 Payment
            builder.HasOne(r => r.Payment)
                .WithOne(p => p.Registration)
                .HasForeignKey<Payment>(p => p.RegistrationId);

            // 1-1 Attendance
            builder.HasOne(r => r.Attendance)
                .WithOne(a => a.Registration)
                .HasForeignKey<Attendance>(a => a.RegistrationId);
        }
    }
}