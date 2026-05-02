using Domain.Common;
using Domain.Shared;
using System;
using System.Collections.Generic;

namespace Domain.Entities
{
    public class Workshop : BaseEntity
    {
        public string Title { get; private set; } = string.Empty;
        public string Description { get; private set; } = string.Empty;
        public string SpeakerName { get; private set; } = string.Empty;
        public string SpeakerBio { get; private set; } = string.Empty;
        public string Room { get; private set; } = string.Empty;
        public string? RoomMapUrl { get; private set; }
        public DateTime StartTime { get; private set; }
        public DateTime EndTime { get; private set; }
        public int TotalSlots { get; private set; }
        public int RegisteredCount { get; private set; } = 0;
        public bool IsFree { get; private set; } = true;
        public decimal Price { get; private set; } = 0;
        public WorkshopStatus Status { get; private set; } = WorkshopStatus.Draft;
        public string? ImageUrl { get; private set; }
        public string? PdfUrl { get; private set; }
        public string? AiSummary { get; private set; }
        public DateTime? AiSummaryGeneratedAt { get; private set; }
        public Guid CreatedByUserId { get; private set; }

        // Navigation
        public ICollection<Registration> Registrations { get; private set; } = new List<Registration>();
        public ICollection<Attendance> Attendances { get; private set; } = new List<Attendance>();

        // EF Core constructor
        private Workshop() { }

        private Workshop(
            string title,
            string description,
            string speakerName,
            string speakerBio,
            string room,
            string? roomMapUrl,
            DateTime startTime,
            DateTime endTime,
            int totalSlots,
            bool isFree,
            decimal price,
            Guid createdByUserId,
            string? imageUrl = null)
        {
            Title = title;
            Description = description;
            SpeakerName = speakerName;
            SpeakerBio = speakerBio;
            Room = room;
            RoomMapUrl = roomMapUrl;
            StartTime = startTime;
            EndTime = endTime;
            TotalSlots = totalSlots;
            IsFree = isFree;
            Price = price;
            CreatedByUserId = createdByUserId;
            ImageUrl = imageUrl;
            Status = WorkshopStatus.Published;
        }

        public static Result<Workshop> Create(
            string title,
            string description,
            string speakerName,
            string speakerBio,
            string room,
            string? roomMapUrl,
            DateTime startTime,
            DateTime endTime,
            int totalSlots,
            bool isFree,
            decimal price,
            Guid createdByUserId,
            string? imageUrl = null)
        {
            if (startTime >= endTime)
                return Result.Failure<Workshop>(new Error("Workshop.InvalidTime", "Start time must be before end time."));

            if (totalSlots <= 0)
                return Result.Failure<Workshop>(new Error("Workshop.InvalidSlots", "Total slots must be greater than zero."));

            return Result.Success(new Workshop(
                title, description, speakerName, speakerBio, room, roomMapUrl,
                startTime, endTime, totalSlots, isFree, price, createdByUserId, imageUrl));
        }

        public void UpdateImageUrl(string? imageUrl)
        {
            ImageUrl = imageUrl;
        }

        public Result Update(
            string title,
            string description,
            string speakerName,
            string speakerBio,
            string room,
            string? roomMapUrl,
            DateTime startTime,
            DateTime endTime,
            int totalSlots,
            bool isFree,
            decimal price,
            string? imageUrl = null)
        {
            if (Status == WorkshopStatus.Cancelled)
                return Result.Failure(new Error("Workshop.Cancelled", "Cannot update a cancelled workshop."));

            if (Status == WorkshopStatus.Published)
            {
                if (IsFree != isFree)
                    return Result.Failure(new Error("Workshop.UpdateInvalid", "Cannot change the pricing type (Free/Paid) of a published workshop."));

                if (Price != price)
                    return Result.Failure(new Error("Workshop.UpdateInvalid", "Cannot change the price of a published workshop."));
            }

            if (startTime >= endTime)
                return Result.Failure(new Error("Workshop.InvalidTime", "Start time must be before end time."));

            if (totalSlots < RegisteredCount)
                return Result.Failure(new Error("Workshop.InvalidSlots", "Total slots cannot be less than the number of registered participants."));

            Title = title;
            Description = description;
            SpeakerName = speakerName;
            SpeakerBio = speakerBio;
            Room = room;
            RoomMapUrl = roomMapUrl;
            StartTime = startTime;
            EndTime = endTime;
            TotalSlots = totalSlots;
            IsFree = isFree;
            Price = price;

            if (imageUrl != null)
            {
                ImageUrl = imageUrl;
            }

            return Result.Success();
        }

        public Result Publish()
        {
            if (Status != WorkshopStatus.Draft)
                return Result.Failure(new Error("Workshop.InvalidStatus", "Only draft workshops can be published."));

            Status = WorkshopStatus.Published;
            return Result.Success();
        }

        public Result Cancel()
        {
            if (Status == WorkshopStatus.Cancelled)
                return Result.Failure(new Error("Workshop.InvalidStatus", "Workshop is already cancelled."));

            Status = WorkshopStatus.Cancelled;
            return Result.Success();
        }

        public void SetPdfUrl(string pdfUrl)
        {
            PdfUrl = pdfUrl;
        }

        public void SetAiSummary(string summary)
        {
            AiSummary = summary;
            AiSummaryGeneratedAt = DateTime.UtcNow;
        }

        public bool TryReserveSlot()
        {
            if (Status != WorkshopStatus.Published)
            {
                return false;
            }

            if (RegisteredCount >= TotalSlots)
            {
                return false;
            }

            RegisteredCount++;
            return true;
        }

        public void ReleaseSlot()
        {
            if (RegisteredCount > 0)
            {
                RegisteredCount--;
            }
        }
    }
}
