namespace Application.DTOs.Registration
{
    public class RegistrationDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string StudentId { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public Guid WorkshopId { get; set; }
        public string WorkshopTitle { get; set; } = string.Empty;
        public DateTime WorkshopStartTime { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public bool IsFreeWorkshop { get; set; }
        public decimal Price { get; set; }
        public string? QrCode { get; set; }
        public string? QrToken { get; set; }
        public DateTime RegisteredAt { get; set; }
    }
}