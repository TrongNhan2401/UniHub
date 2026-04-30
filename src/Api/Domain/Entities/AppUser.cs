using Microsoft.AspNetCore.Identity;

namespace Domain.Entities
{
    public class AppUser : IdentityUser<Guid>
    {
        public string FullName { get; private set; } = string.Empty;
        public string StudentId { get; private set; } = string.Empty;
        public UserRole Role { get; private set; } = UserRole.Student;
        public string? TelegramChatId { get; private set; }
        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; private set; }

        // Navigation
        public ICollection<Registration> Registrations { get; private set; } = new List<Registration>();
        public ICollection<Attendance> Attendances { get; private set; } = new List<Attendance>();
        public ICollection<Payment> Payments { get; private set; } = new List<Payment>();
    }

}
