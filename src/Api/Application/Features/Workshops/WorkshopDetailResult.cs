namespace Application.Features.Workshops
{
    public sealed class WorkshopDetailResult
    {
        public Guid Id { get; init; }
        public string Title { get; init; } = string.Empty;
        public string Description { get; init; } = string.Empty;
        public string? ThumbnailUrl { get; init; }
        public DateTime StartTime { get; init; }
        public DateTime EndTime { get; init; }
        public DateTime RegistrationOpenAt { get; init; }
        public DateTime RegistrationCloseAt { get; init; }
        public string Location { get; init; } = string.Empty;
        public string Topic { get; init; } = "GENERAL";
        public string Status { get; init; } = string.Empty;
        public string PriceType { get; init; } = "FREE";
        public decimal? Price { get; init; }
        public int Capacity { get; init; }
        public int RegisteredCount { get; init; }
        public int AvailableSlots { get; init; }
        public bool IsRegistrationOpen { get; init; }
        public WorkshopOrganizerInfo Organizer { get; init; } = new();
    }

    public sealed class WorkshopOrganizerInfo
    {
        public Guid Id { get; init; }
        public string Name { get; init; } = string.Empty;
    }
}
