using Application.DTOs.Workshop;
using Domain.Entities;
using System.Linq;

namespace Application.Mappings
{
    public static class WorkshopMappingExtensions
    {
        public static WorkshopListDto ToListDto(this Workshop workshop)
        {
            return new WorkshopListDto
            {
                Id = workshop.Id,
                Title = workshop.Title,
                SpeakerName = workshop.SpeakerName,
                Room = workshop.Room,
                StartTime = workshop.StartTime,
                EndTime = workshop.EndTime,
                TotalSlots = workshop.TotalSlots,
                RegisteredCount = workshop.RegisteredCount,
                IsFree = workshop.IsFree,
                ImageUrl = workshop.ImageUrl,
                Status = workshop.Status.ToString()
            };
        }

        public static WorkshopDetailDto ToDetailDto(this Workshop workshop)
        {
            return new WorkshopDetailDto
            {
                Id = workshop.Id,
                Title = workshop.Title,
                Description = workshop.Description,
                SpeakerName = workshop.SpeakerName,
                SpeakerBio = workshop.SpeakerBio,
                Room = workshop.Room,
                RoomMapUrl = workshop.RoomMapUrl,
                StartTime = workshop.StartTime,
                EndTime = workshop.EndTime,
                TotalSlots = workshop.TotalSlots,
                RegisteredCount = workshop.RegisteredCount,
                IsFree = workshop.IsFree,
                Price = workshop.Price,
                Status = workshop.Status.ToString(),
                ImageUrl = workshop.ImageUrl,
                PdfUrl = workshop.PdfUrl,
                AiSummary = workshop.AiSummary,
                CreatedAt = workshop.CreatedAt,
                Registrations = workshop.Registrations.Select(r => r.ToResponseDto()).ToList(),
                Attendances = workshop.Attendances.Select(a => a.ToResponseDto()).ToList()
            };
        }

        public static WorkshopDto ToDto(this Workshop workshop)
        {
            return new WorkshopDto
            {
                Id = workshop.Id,
                Title = workshop.Title,
                Description = workshop.Description,
                SpeakerName = workshop.SpeakerName,
                SpeakerBio = workshop.SpeakerBio,
                Room = workshop.Room,
                RoomMapUrl = workshop.RoomMapUrl,
                StartTime = workshop.StartTime,
                EndTime = workshop.EndTime,
                TotalSlots = workshop.TotalSlots,
                RegisteredCount = workshop.RegisteredCount,
                IsFree = workshop.IsFree,
                Price = workshop.Price,
                Status = workshop.Status.ToString(),
                ImageUrl = workshop.ImageUrl,
                PdfUrl = workshop.PdfUrl,
                AiSummary = workshop.AiSummary,
                CreatedAt = workshop.CreatedAt
            };
        }

        public static RegistrationResponseDto ToResponseDto(this Registration r)
        {
            return new RegistrationResponseDto
            {
                Id = r.Id,
                UserId = r.UserId,
                UserEmail = r.User?.Email ?? string.Empty,
                Status = r.Status.ToString(),
                CreatedAt = r.CreatedAt
            };
        }

        public static AttendanceResponseDto ToResponseDto(this Attendance a)
        {
            return new AttendanceResponseDto
            {
                Id = a.Id,
                UserId = a.UserId,
                UserEmail = a.User?.Email ?? string.Empty,
                Status = a.Status.ToString(),
                CheckedInAt = a.CheckedInAt
            };
        }
    }
}
