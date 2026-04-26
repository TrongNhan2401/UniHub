using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class IdempotencyRecordConfiguration : IEntityTypeConfiguration<IdempotencyRecord>
    {
        public void Configure(EntityTypeBuilder<IdempotencyRecord> builder)
        {
            builder.ToTable("IdempotencyRecords");

            builder.HasKey(i => i.Key);

            builder.Property(i => i.Key)
                .HasMaxLength(100);

            builder.Property(i => i.ResponseBody)
                .HasColumnType("nvarchar(max)");

            builder.Property(i => i.StatusCode)
                .IsRequired();

            builder.Property(i => i.ExpiresAt)
                .IsRequired();

            builder.HasIndex(i => i.ExpiresAt);
        }
    }
}