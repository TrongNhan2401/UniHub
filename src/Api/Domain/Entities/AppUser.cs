using Microsoft.AspNetCore.Identity;

namespace Domain.Entities
{
    public class AppUser : IdentityUser<Guid>
    {
        public string FullName { get; set; } = string.Empty;
        public string StudentId { get; set; } = string.Empty;
        public UserRole Role { get; set; } = UserRole.Student;
        public string? TelegramChatId { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public int? EntryYear { get; set; }
        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; private set; }

        // Navigation
        public ICollection<Registration> Registrations { get; private set; } = new List<Registration>();
        public ICollection<Attendance> Attendances { get; private set; } = new List<Attendance>();
        public ICollection<Payment> Payments { get; private set; } = new List<Payment>();

        public AppUser() { } // Required for EF Core

        public AppUser(
            string email,
            string fullName,
            UserRole role,
            string? studentId = null,
            DateTime? dateOfBirth = null,
            int? entryYear = null,
            string? telegramChatId = null)
        {
            Id = Guid.NewGuid();

            Email = email.Trim();
            UserName = email.Trim();

            FullName = fullName.Trim();
            Role = role;

            StudentId = studentId?.Trim() ?? string.Empty;
            DateOfBirth = dateOfBirth;
            EntryYear = entryYear;
            TelegramChatId = telegramChatId;

            CreatedAt = DateTime.UtcNow;
        }
    }
}
