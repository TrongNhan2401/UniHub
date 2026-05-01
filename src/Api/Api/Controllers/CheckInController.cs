using Application.DTOs.CheckIn;
using Application.Features.Interfaces;
using Domain.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/checkin")]
    [Authorize(Roles = "CHECKIN_STAFF,ORGANIZER")]
    public class CheckInController : ControllerBase
    {
        private readonly ICheckInService _checkInService;

        public CheckInController(ICheckInService checkInService)
        {
            _checkInService = checkInService;
        }

        [HttpGet("workshops/{id:guid}/registrations")]
        public async Task<IActionResult> GetWorkshopRegistrations(Guid id)
        {
            var result = await _checkInService.GetWorkshopRegistrationsAsync(id);
            if (result.IsFailure)
            {
                return MapFailure(result.Error);
            }

            return Ok(result.Value);
        }

        [HttpGet("registrations/{id:guid}/validate")]
        public async Task<IActionResult> Validate(Guid id, [FromQuery] Guid workshopId)
        {
            var result = await _checkInService.ValidateAsync(id, workshopId);
            if (result.IsFailure)
            {
                return MapFailure(result.Error);
            }

            return Ok(result.Value);
        }

        [HttpPost]
        public async Task<IActionResult> CheckIn([FromBody] CheckInRequestDto request)
        {
            var result = await _checkInService.CheckInAsync(request);
            if (result.IsFailure)
            {
                return MapFailure(result.Error);
            }

            var status = result.Value.IsDuplicate ? StatusCodes.Status200OK : StatusCodes.Status201Created;
            return StatusCode(status, result.Value);
        }

        [HttpPost("sync")]
        public async Task<IActionResult> Sync([FromBody] CheckInSyncRequestDto request)
        {
            var result = await _checkInService.SyncAsync(request);
            if (result.IsFailure)
            {
                return MapFailure(result.Error);
            }

            return Ok(result.Value);
        }

        [HttpGet("history")]
        public async Task<IActionResult> History(
            [FromQuery] Guid workshopId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 50)
        {
            var result = await _checkInService.GetHistoryAsync(workshopId, pageNumber, pageSize);
            if (result.IsFailure)
            {
                return MapFailure(result.Error);
            }

            return Ok(result.Value);
        }

        private IActionResult MapFailure(Error error)
        {
            return error.Code switch
            {
                "Workshop.NotFound" => ProblemResponse(StatusCodes.Status404NotFound, "Khong tim thay tai nguyen.", error.Message),
                "Registration.NotFound" => ProblemResponse(StatusCodes.Status404NotFound, "Khong tim thay tai nguyen.", error.Message),
                "CheckIn.WrongWorkshop" => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", error.Message),
                "CheckIn.InvalidRegistration" => ProblemResponse(StatusCodes.Status409Conflict, "Xung dot du lieu.", error.Message),
                _ => ProblemResponse(StatusCodes.Status400BadRequest, "Yeu cau khong hop le.", error.Message)
            };
        }

        private ObjectResult ProblemResponse(int statusCode, string title, string detail)
        {
            var problem = new ProblemDetails
            {
                Status = statusCode,
                Title = title,
                Detail = detail,
                Type = $"https://httpstatuses.com/{statusCode}"
            };
            problem.Extensions["traceId"] = HttpContext.TraceIdentifier;

            return StatusCode(statusCode, problem);
        }
    }
}