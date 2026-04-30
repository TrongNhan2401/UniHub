using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
    {
        public void Configure(EntityTypeBuilder<AppUser> builder)
        {

            builder.Property(u => u.FullName)
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(u => u.StudentId)
                .HasMaxLength(50);

            builder.Property(u => u.Role)
                .IsRequired();

            builder.Property(u => u.TelegramChatId)
                .HasMaxLength(100);

            builder.Property(u => u.DateOfBirth)
                .IsRequired(false);

            builder.Property(u => u.EntryYear)
                .IsRequired(false);

            builder.Property(u => u.CreatedAt)
                .IsRequired();

            // Relationships
            builder.HasMany(u => u.Registrations)
                .WithOne(r => r.User)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(u => u.Attendances)
                .WithOne(a => a.User)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(u => u.Payments)
                .WithOne(p => p.User)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(u => u.StudentId);
        }
    }
}