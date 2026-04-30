using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Application.DTOs.Workshop
{
    public class WorkshopDetailDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string SpeakerName { get; set; } = string.Empty;
        public string SpeakerBio { get; set; } = string.Empty;
        public string Room { get; set; } = string.Empty;
        public string? RoomMapUrl { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int TotalSlots { get; set; }
        public int RegisteredCount { get; set; }
        public bool IsFree { get; set; }
        public decimal Price { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string? PdfUrl { get; set; }
        public string? AiSummary { get; set; }
        public DateTime CreatedAt { get; set; }

        public List<RegistrationResponseDto> Registrations { get; set; } = new();
        public List<AttendanceResponseDto> Attendances { get; set; } = new();
    }

    public class RegistrationResponseDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class AttendanceResponseDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CheckedInAt { get; set; }
    }
}
