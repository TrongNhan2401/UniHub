using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace Infrastructure.Persistence.Configurations
{
    public class WorkshopConfiguration : IEntityTypeConfiguration<Workshop>
    {
        public void Configure(EntityTypeBuilder<Workshop> builder)
        {
            builder.ToTable("Workshops");

            builder.Property(w => w.Title)
                .HasMaxLength(300)
                .IsRequired();

            builder.Property(w => w.Description)
                .HasMaxLength(2000);

            builder.Property(w => w.SpeakerName)
                .HasMaxLength(200);

            builder.Property(w => w.Room)
                .HasMaxLength(100);

            builder.Property(w => w.Price)
                .HasColumnType("decimal(10,2)");

            builder.Property(w => w.Status)
                .IsRequired();

            // Relationships
            builder.HasMany(w => w.Registrations)
                .WithOne(r => r.Workshop)
                .HasForeignKey(r => r.WorkshopId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(w => w.Attendances)
                .WithOne(a => a.Workshop)
                .HasForeignKey(a => a.WorkshopId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(w => w.StartTime);
        }
    }
}
