using Microsoft.AspNetCore.Http;
using System;

namespace Application.DTOs.Workshop
{
    public class CreateWorkshopDto
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
        public bool IsFree { get; set; } = true;
        public decimal Price { get; set; } = 0;
        public IFormFile? Image { get; set; }
    }
}
