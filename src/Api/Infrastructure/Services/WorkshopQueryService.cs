using Application.Abstractions;
using Application.Features.Workshops;
using Domain;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services
{
    public sealed class WorkshopQueryService : IWorkshopQueryService
    {
        private static readonly HashSet<string> AllowedSorts =
        [
            "startTimeAsc",
            "startTimeDesc",
            "createdAtDesc",
            "priceAsc",
            "priceDesc",
            "availableSlotsDesc"
        ];

        private readonly AppDbContext _db;

        public WorkshopQueryService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<WorkshopListResult> GetListAsync(WorkshopListQuery query, CancellationToken ct = default)
        {
            var q = _db.Workshops.AsNoTracking().Where(w => !w.IsDeleted);

            if (!string.IsNullOrWhiteSpace(query.Day))
            {
                var day = DateOnly.Parse(query.Day);
                q = q.Where(w => DateOnly.FromDateTime(w.StartTime) == day);
            }

            if (!string.IsNullOrWhiteSpace(query.Topic))
            {
                var topic = query.Topic.Trim().ToLower();
                q = q.Where(w =>
                    w.SpeakerName.ToLower().Contains(topic) ||
                    w.Title.ToLower().Contains(topic) ||
                    w.Description.ToLower().Contains(topic));
            }

            if (!string.IsNullOrWhiteSpace(query.Status))
            {
                var status = ParseStatus(query.Status);
                q = q.Where(w => w.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(query.PriceType))
            {
                var isFree = string.Equals(query.PriceType, "FREE", StringComparison.OrdinalIgnoreCase);
                q = q.Where(w => w.IsFree == isFree);
            }

            q = query.Sort switch
            {
                "startTimeDesc" => q.OrderByDescending(w => w.StartTime),
                "createdAtDesc" => q.OrderByDescending(w => w.CreatedAt),
                "priceAsc" => q.OrderBy(w => w.Price),
                "priceDesc" => q.OrderByDescending(w => w.Price),
                "availableSlotsDesc" => q.OrderByDescending(w => w.TotalSlots - w.RegisteredCount),
                _ => q.OrderBy(w => w.StartTime) // startTimeAsc default
            };

            var totalItems = await q.CountAsync(ct);
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)query.PageSize);

            var items = await q
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(w => new WorkshopListItem
                {
                    Id = w.Id,
                    Title = w.Title,
                    ThumbnailUrl = null,
                    StartTime = w.StartTime,
                    EndTime = w.EndTime,
                    Location = w.Room,
                    Topic = string.IsNullOrWhiteSpace(w.SpeakerName) ? "GENERAL" : w.SpeakerName,
                    Status = MapStatus(w.Status),
                    PriceType = w.IsFree ? "FREE" : "PAID",
                    Price = w.Price,
                    Capacity = w.TotalSlots,
                    RegisteredCount = w.RegisteredCount,
                    AvailableSlots = Math.Max(0, w.TotalSlots - w.RegisteredCount),
                    IsRegistrationOpen = w.Status == WorkshopStatus.Published
                                         && (w.TotalSlots - w.RegisteredCount) > 0
                })
                .ToListAsync(ct);

            return new WorkshopListResult
            {
                Items = items,
                Pagination = new WorkshopPagination
                {
                    Page = query.Page,
                    PageSize = query.PageSize,
                    TotalItems = totalItems,
                    TotalPages = totalPages,
                    HasNext = query.Page < totalPages,
                    HasPrevious = query.Page > 1
                },
                FiltersApplied = new WorkshopFiltersApplied
                {
                    Day = query.Day,
                    Topic = query.Topic,
                    Status = query.Status?.ToUpperInvariant(),
                    PriceType = query.PriceType?.ToUpperInvariant(),
                    Sort = query.Sort
                }
            };
        }

        public async Task<WorkshopDetailResult?> GetByIdAsync(Guid id, CancellationToken ct = default)
        {
            return await _db.Workshops
                .AsNoTracking()
                .Where(w => !w.IsDeleted && w.Id == id)
                .Select(w => new WorkshopDetailResult
                {
                    Id = w.Id,
                    Title = w.Title,
                    Description = w.Description,
                    ThumbnailUrl = null,
                    StartTime = w.StartTime,
                    EndTime = w.EndTime,
                    RegistrationOpenAt = w.StartTime.AddDays(-7),
                    RegistrationCloseAt = w.StartTime.AddMinutes(-1),
                    Location = w.Room,
                    Topic = string.IsNullOrWhiteSpace(w.SpeakerName) ? "GENERAL" : w.SpeakerName,
                    Status = MapStatus(w.Status),
                    PriceType = w.IsFree ? "FREE" : "PAID",
                    Price = w.Price,
                    Capacity = w.TotalSlots,
                    RegisteredCount = w.RegisteredCount,
                    AvailableSlots = Math.Max(0, w.TotalSlots - w.RegisteredCount),
                    IsRegistrationOpen = w.Status == WorkshopStatus.Published
                                         && (w.TotalSlots - w.RegisteredCount) > 0,
                    Organizer = new WorkshopOrganizerInfo
                    {
                        Id = w.CreatedByUserId,
                        Name = "Unknown Organizer"
                    }
                })
                .FirstOrDefaultAsync(ct);
        }

        private static WorkshopStatus ParseStatus(string text) => text.Trim().ToUpperInvariant() switch
        {
            "DRAFT" => WorkshopStatus.Draft,
            "PUBLISHED" => WorkshopStatus.Published,
            "CANCELLED" => WorkshopStatus.Cancelled,
            "COMPLETED" => WorkshopStatus.Completed,
            _ => WorkshopStatus.Draft
        };

        private static string MapStatus(WorkshopStatus status) => status switch
        {
            WorkshopStatus.Draft => "DRAFT",
            WorkshopStatus.Published => "PUBLISHED",
            WorkshopStatus.Cancelled => "CANCELLED",
            WorkshopStatus.Completed => "COMPLETED",
            _ => "DRAFT"
        };
    }
}
