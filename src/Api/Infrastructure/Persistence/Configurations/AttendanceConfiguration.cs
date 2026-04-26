using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class AttendanceConfiguration : IEntityTypeConfiguration<Attendance>
    {
        public void Configure(EntityTypeBuilder<Attendance> builder)
        {
            builder.ToTable("Attendances");

            builder.Property(a => a.Status)
                .IsRequired();

            builder.Property(a => a.OfflineDeviceId)
                .HasMaxLength(100);

            builder.Property(a => a.CheckedInAt)
                .IsRequired();

            // Relationships
            builder.HasOne(a => a.User)
                .WithMany(u => u.Attendances)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(a => a.Workshop)
                .WithMany(w => w.Attendances)
                .HasForeignKey(a => a.WorkshopId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(a => new { a.UserId, a.WorkshopId });
        }
    }
}