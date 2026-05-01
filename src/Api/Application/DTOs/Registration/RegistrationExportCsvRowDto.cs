namespace Application.DTOs.Registration
{
    public class RegistrationExportCsvRowDto
    {
        public Guid RegistrationId { get; set; }
        public string StudentId { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string WorkshopTitle { get; set; } = string.Empty;
        public DateTime WorkshopStartTime { get; set; }
        public string RegistrationStatus { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public DateTime RegisteredAt { get; set; }
    }
}