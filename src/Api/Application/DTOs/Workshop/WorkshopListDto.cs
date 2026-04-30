using Domain.Entities;
using System;

namespace Application.DTOs.Workshop
{
    public class WorkshopListDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string SpeakerName { get; set; } = string.Empty;
        public string Room { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int TotalSlots { get; set; }
        public int RegisteredCount { get; set; }
        public bool IsFree { get; set; }
        public string? ImageUrl { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
