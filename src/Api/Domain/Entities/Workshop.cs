using Domain.Common;

namespace Domain.Entities
{
    public class Workshop : BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string SpeakerName { get; set; } = string.Empty;
        public string SpeakerBio { get; set; } = string.Empty;
        public string Room { get; set; } = string.Empty;
        public string? RoomMapUrl { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int TotalSlots { get; set; }
        public int RegisteredCount { get; set; } = 0;
        public bool IsFree { get; set; } = true;
        public decimal Price { get; set; } = 0;
        public WorkshopStatus Status { get; set; } = WorkshopStatus.Draft;
        public string? PdfUrl { get; set; }
        public string? AiSummary { get; set; }
        public DateTime? AiSummaryGeneratedAt { get; set; }
        public Guid CreatedByUserId { get; set; }

        // Navigation
        public ICollection<Registration> Registrations { get; set; } = new List<Registration>();
        public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    }
}
