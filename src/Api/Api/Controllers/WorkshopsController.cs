using Application.DTOs.Workshop;
using Application.Features.Interfaces;
using Domain.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WorkshopsController : ControllerBase
    {
        private readonly IWorkshopService _workshopService;

        public WorkshopsController(IWorkshopService workshopService)
        {
            _workshopService = workshopService;
        }
        [Authorize(Roles = "ORGANIZER")]

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateWorkshopDto dto)
        {
            // For now, using a dummy user ID. 
            // In a real scenario, this would come from User.Claims
            var userId = Guid.NewGuid(); 

            var result = await _workshopService.CreateWorkshopAsync(dto, userId);

            if (result.IsFailure)
            {
                return BadRequest(result.Error);
            }

            var workshop = result.Value;
            return CreatedAtAction(nameof(GetById), new { id = workshop.Id }, workshop);
        }
        [Authorize(Roles = "ORGANIZER")]

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromForm] UpdateWorkshopDto dto)
        {
            var result = await _workshopService.UpdateWorkshopAsync(id, dto);

            if (result.IsFailure)
            {
                if (result.Error.Code == "Workshop.NotFound")
                {
                    return NotFound(result.Error);
                }
                return BadRequest(result.Error);
            }

            return Ok(result.Value);
        }
        [Authorize(Roles = "ORGANIZER")]

        [HttpPost("{id}/pdf")]
        public async Task<IActionResult> UploadPdf(Guid id, IFormFile file)
        {
            var result = await _workshopService.UploadWorkshopPdfAsync(id, file);

            if (result.IsFailure)
            {
                if (result.Error.Code == "Workshop.NotFound")
                {
                    return NotFound(result.Error);
                }
                return BadRequest(result.Error);
            }

            return Ok(new { Url = result.Value });
        }
        [Authorize(Roles = "ORGANIZER")]

        [HttpPost("{id}/image")]
        public async Task<IActionResult> UploadImage(Guid id, IFormFile file)
        {
            var result = await _workshopService.UploadWorkshopImageAsync(id, file);

            if (result.IsFailure)
            {
                if (result.Error.Code == "Workshop.NotFound")
                {
                    return NotFound(result.Error);
                }
                return BadRequest(result.Error);
            }

            return Ok(new { Url = result.Value });
        }
        [Authorize(Roles = "ORGANIZER")]

        [HttpPatch("{id}/publish")]
        public async Task<IActionResult> Publish(Guid id)
        {
            var result = await _workshopService.PublishWorkshopAsync(id);

            if (result.IsFailure)
            {
                if (result.Error.Code == "Workshop.NotFound")
                {
                    return NotFound(result.Error);
                }
                return BadRequest(result.Error);
            }

            return Ok(result.Value);
        }
        [Authorize(Roles = "ORGANIZER")]

        [HttpPatch("{id}/cancel")]
        public async Task<IActionResult> Cancel(Guid id)
        {
            var result = await _workshopService.CancelWorkshopAsync(id);

            if (result.IsFailure)
            {
                if (result.Error.Code == "Workshop.NotFound")
                {
                    return NotFound(result.Error);
                }
                return BadRequest(result.Error);
            }

            return Ok(result.Value);
        }

        [HttpGet]
        public async Task<IActionResult> GetPaged(
            [FromQuery] int pageNumber = 1, 
            [FromQuery] int pageSize = 10, 
            [FromQuery] DateTime? date = null,
            [FromQuery] string? status = null,
            [FromQuery] string? sortByTime = null)
        {
            var isOrganizer = User.IsInRole("ORGANIZER") || User.IsInRole("ADMIN");
            var result = await _workshopService.GetWorkshopsPagedAsync(pageNumber, pageSize, date, status, sortByTime, isOrganizer);

            if (result.IsFailure)
            {
                return BadRequest(result.Error);
            }
            return Ok(result.Value);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var isOrganizer = User.IsInRole("ORGANIZER") || User.IsInRole("ADMIN");
            var result = await _workshopService.GetWorkshopDetailAsync(id, isOrganizer);

            if (result.IsFailure)
            {
                if (result.Error.Code == "Workshop.NotFound")
                {
                    return NotFound(result.Error);
                }
                return BadRequest(result.Error);
            }

            return Ok(result.Value);
        }
    }
}
