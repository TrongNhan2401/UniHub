using Application.Abstractions;
using Application.Features.Interfaces;
using Domain;
using Domain.Entities;
using Infrastructure.Persistence.Contexts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // [Authorize(Roles = "Organizer")] // In production, restrict this
    public class SyncController : ControllerBase
    {
        private readonly ISyncTaskService _syncTaskService;

        public SyncController(ISyncTaskService syncTaskService)
        {
            _syncTaskService = syncTaskService;
        }

        [HttpPost("upload-csv")]
        public async Task<IActionResult> UploadCsv(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("File khong hop le.");

            if (!file.FileName.EndsWith(".csv"))
                return BadRequest("Chi chap nhan file .csv");

            var result = await _syncTaskService.CreateSyncTaskAsync(file);

            if (result.IsFailure)
            {
                return BadRequest(result.Error);
            }

            return Accepted(new { taskId = result.Value.Id, message = "File da duoc nhan va dang cho xu ly." });
        }

        [HttpGet("status/{id}")]
        public async Task<IActionResult> GetStatus(Guid id)
        {
            var result = await _syncTaskService.GetTaskStatusAsync(id);

            if (result.IsFailure)
            {
                if (result.Error.Code == "Sync.NotFound")
                {
                    return NotFound(result.Error);
                }
                return BadRequest(result.Error);
            }

            return Ok(result.Value);
        }

        [HttpGet("tasks")]
        public async Task<IActionResult> GetTasks()
        {
            var result = await _syncTaskService.GetAllTasksAsync();

            if (result.IsFailure)
            {
                return BadRequest(result.Error);
            }

            return Ok(result.Value);
        }
    }
}
