namespace Application.Features.Workshops
{
    public sealed class WorkshopListQuery
    {
        public int Page { get; init; } = 1;
        public int PageSize { get; init; } = 20;
        public string? Day { get; init; }
        public string? Topic { get; init; }
        public string? Status { get; init; }
        public string? PriceType { get; init; }
        public string Sort { get; init; } = "startTimeAsc";
    }
}
