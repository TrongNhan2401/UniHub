using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
    {
        public void Configure(EntityTypeBuilder<Payment> builder)
        {
            builder.ToTable("Payments");

            builder.Property(p => p.Amount)
                .HasColumnType("decimal(10,2)")
                .IsRequired();

            builder.Property(p => p.Status)
                .IsRequired();

            builder.Property(p => p.IdempotencyKey)
                .HasMaxLength(100);

            builder.Property(p => p.GatewayTransactionId)
                .HasMaxLength(200);

            builder.Property(p => p.GatewayResponse)
                .HasColumnType("nvarchar(max)");

            // Relationships
            builder.HasOne(p => p.User)
                .WithMany(u => u.Payments)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(p => p.IdempotencyKey);
            builder.HasIndex(p => p.GatewayTransactionId);
        }
    }
}