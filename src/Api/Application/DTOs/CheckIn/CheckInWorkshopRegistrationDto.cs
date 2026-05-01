namespace Application.DTOs.CheckIn
{
    public class CheckInWorkshopRegistrationDto
    {
        public Guid RegistrationId { get; set; }
        public Guid WorkshopId { get; set; }
        public string QrCode { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public string StudentId { get; set; } = string.Empty;
        public bool IsCheckedIn { get; set; }
        public DateTime? CheckedInAt { get; set; }
    }
}