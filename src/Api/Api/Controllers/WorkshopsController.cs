using Application.Abstractions;
using Application.Features.Workshops;
using Domain.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/workshops")]
    [Authorize(Policy = AppPolicies.WorkshopRead)]
    public class WorkshopsController : ControllerBase
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

        private readonly IWorkshopQueryService _workshopQueryService;

        public WorkshopsController(IWorkshopQueryService workshopQueryService)
        {
            _workshopQueryService = workshopQueryService;
        }

        [HttpGet]
        public async Task<IActionResult> GetWorkshops(
            [FromQuery] WorkshopListRequest request,
            CancellationToken ct)
        {
            var errors = ValidateListRequest(request);
            if (errors.Count > 0)
            {
                return ProblemResponse(
                    StatusCodes.Status400BadRequest,
                    "Yeu cau khong hop le.",
                    "Query params khong hop le.",
                    errors);
            }

            var query = new WorkshopListQuery
            {
                Page = request.Page ?? 1,
                PageSize = request.PageSize ?? 20,
                Day = request.Day,
                Topic = request.Topic,
                Status = request.Status,
                PriceType = request.PriceType,
                Sort = request.Sort ?? "startTimeAsc"
            };

            var result = await _workshopQueryService.GetListAsync(query, ct);
            return Ok(result);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetWorkshopById(Guid id, CancellationToken ct)
        {
            var result = await _workshopQueryService.GetByIdAsync(id, ct);

            if (result is null)
            {
                return ProblemResponse(
                    StatusCodes.Status404NotFound,
                    "Khong tim thay tai nguyen.",
                    $"Khong tim thay workshop voi id '{id}'.");
            }

            return Ok(result);
        }

        private static List<string> ValidateListRequest(WorkshopListRequest request)
        {
            var errors = new List<string>();
            var page = request.Page ?? 1;
            var pageSize = request.PageSize ?? 20;

            if (page < 1)
                errors.Add("Gia tri page phai >= 1.");

            if (pageSize < 1 || pageSize > 100)
                errors.Add("Gia tri pageSize phai trong khoang 1-100.");

            if (!string.IsNullOrWhiteSpace(request.Day) && !DateOnly.TryParse(request.Day, out _))
                errors.Add("Gia tri day khong hop le. Dinh dang yeu cau: yyyy-MM-dd.");

            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                var s = request.Status.Trim().ToUpperInvariant();
                if (s is not ("DRAFT" or "PUBLISHED" or "CANCELLED" or "COMPLETED"))
                    errors.Add("Gia tri status khong hop le. Gia tri hop le: DRAFT, PUBLISHED, CANCELLED, COMPLETED.");
            }

            if (!string.IsNullOrWhiteSpace(request.PriceType))
            {
                var p = request.PriceType.Trim().ToUpperInvariant();
                if (p is not ("FREE" or "PAID"))
                    errors.Add("Gia tri priceType khong hop le. Gia tri hop le: FREE, PAID.");
            }

            if (!string.IsNullOrWhiteSpace(request.Sort) && !AllowedSorts.Contains(request.Sort))
                errors.Add("Gia tri sort khong hop le. Gia tri hop le: startTimeAsc, startTimeDesc, createdAtDesc, priceAsc, priceDesc, availableSlotsDesc.");

            return errors;
        }

        private ObjectResult ProblemResponse(int statusCode, string title, string detail, IEnumerable<string>? errors = null)
        {
            var problem = new ProblemDetails
            {
                Status = statusCode,
                Title = title,
                Detail = detail,
                Type = $"https://httpstatuses.com/{statusCode}"
            };
            problem.Extensions["traceId"] = HttpContext.TraceIdentifier;

            if (errors is not null)
                problem.Extensions["errors"] = errors.ToArray();

            return StatusCode(statusCode, problem);
        }
    }

    public sealed class WorkshopListRequest
    {
        public int? Page { get; set; }
        public int? PageSize { get; set; }
        public string? Day { get; set; }
        public string? Topic { get; set; }
        public string? Status { get; set; }
        public string? PriceType { get; set; }
        public string? Sort { get; set; }
    }
}
