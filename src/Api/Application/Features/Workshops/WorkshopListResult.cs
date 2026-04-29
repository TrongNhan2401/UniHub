namespace Application.Features.Workshops
{
    public sealed class WorkshopListResult
    {
        public List<WorkshopListItem> Items { get; init; } = [];
        public WorkshopPagination Pagination { get; init; } = new();
        public WorkshopFiltersApplied FiltersApplied { get; init; } = new();
    }

    public sealed class WorkshopListItem
    {
        public Guid Id { get; init; }
        public string Title { get; init; } = string.Empty;
        public string? ThumbnailUrl { get; init; }
        public DateTime StartTime { get; init; }
        public DateTime EndTime { get; init; }
        public string Location { get; init; } = string.Empty;
        public string Topic { get; init; } = "GENERAL";
        public string Status { get; init; } = string.Empty;
        public string PriceType { get; init; } = "FREE";
        public decimal? Price { get; init; }
        public int Capacity { get; init; }
        public int RegisteredCount { get; init; }
        public int AvailableSlots { get; init; }
        public bool IsRegistrationOpen { get; init; }
    }

    public sealed class WorkshopPagination
    {
        public int Page { get; init; }
        public int PageSize { get; init; }
        public int TotalItems { get; init; }
        public int TotalPages { get; init; }
        public bool HasNext { get; init; }
        public bool HasPrevious { get; init; }
    }

    public sealed class WorkshopFiltersApplied
    {
        public string? Day { get; init; }
        public string? Topic { get; init; }
        public string? Status { get; init; }
        public string? PriceType { get; init; }
        public string? Sort { get; init; }
    }
}
