namespace Application.DTOs.CheckIn
{
    public class CheckInValidationDto
    {
        public Guid RegistrationId { get; set; }
        public Guid WorkshopId { get; set; }
        public bool Valid { get; set; }
        public bool AlreadyCheckedIn { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentId { get; set; } = string.Empty;
        public DateTime? CheckedInAt { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}