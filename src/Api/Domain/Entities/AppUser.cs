using Microsoft.AspNetCore.Identity;

namespace Domain.Entities
{
    public class AppUser : IdentityUser<Guid>
    {
        public string FullName { get; set; } = string.Empty;
        public string StudentId { get; set; } = string.Empty;
        public UserRole Role { get; set; } = UserRole.Student;
        public string? TelegramChatId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public ICollection<Registration> Registrations { get; set; } = new List<Registration>();
        public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }

}
