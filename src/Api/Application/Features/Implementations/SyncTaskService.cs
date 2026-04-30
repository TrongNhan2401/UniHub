using Application.Abstractions;
using Application.Features.Interfaces;
using CsvHelper;
using CsvHelper.Configuration;
using Domain;
using Domain.Entities;
using Domain.Shared;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Globalization;

namespace Application.Features.Implementations
{
    public class SyncTaskService : ISyncTaskService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IUploadService _uploadService;
        private readonly UserManager<AppUser> _userManager;
        private readonly ILogger<SyncTaskService> _logger;
        private readonly HttpClient _httpClient;

        public SyncTaskService(
            IUnitOfWork unitOfWork,
            IUploadService uploadService,
            UserManager<AppUser> userManager,
            ILogger<SyncTaskService> logger)
        {
            _unitOfWork = unitOfWork;
            _uploadService = uploadService;
            _userManager = userManager;
            _logger = logger;
            _httpClient = new HttpClient();
        }

        public async Task<Result<SyncTask>> CreateSyncTaskAsync(IFormFile file)
        {
            try
            {
                var fileUrl = await _uploadService.UploadFileAsync(file.OpenReadStream(), file.FileName);

                var task = new SyncTask
                {
                    InputCsvUrl = fileUrl,
                    SyncState = SyncState.Pending
                };

                await _unitOfWork.SyncTasks.AddAsync(task);
                await _unitOfWork.SaveChangesAsync();

                return Result.Success(task);
            }
            catch (Exception ex)
            {
                return Result.Failure<SyncTask>(new Error("Sync.UploadFailed", ex.Message));
            }
        }

        public async Task<Result<List<SyncTask>>> GetAllTasksAsync(int limit = 20)
        {
            var tasks = await _unitOfWork.SyncTasks.GetAllAsync(limit);
            return Result.Success(tasks);
        }

        public async Task<Result<SyncTask>> GetTaskStatusAsync(Guid id)
        {
            var task = await _unitOfWork.SyncTasks.GetByIdAsync(id);
            if (task == null)
            {
                return Result.Failure<SyncTask>(new Error("Sync.NotFound", $"Task with id {id} was not found."));
            }
            return Result.Success(task);
        }

        public async Task ProcessPendingTasksAsync(CancellationToken ct)
        {
            var pendingTasks = await _unitOfWork.SyncTasks.GetPendingTasksAsync();

            foreach (var task in pendingTasks)
            {
                await FilterTaskAsync(task, ct);
            }
        }

        public async Task ProcessFilteredTasksAsync(CancellationToken ct)
        {
            var filteredTasks = await _unitOfWork.SyncTasks.GetFilteredTasksAsync();

            foreach (var task in filteredTasks)
            {
                await SynchronizeTaskAsync(task, ct);
            }
        }

        private async Task FilterTaskAsync(SyncTask task, CancellationToken ct)
        {
            try
            {
                _logger.LogInformation("Filtering task {TaskId}", task.Id);
                var response = await _httpClient.GetAsync(task.InputCsvUrl, ct);
                response.EnsureSuccessStatusCode();

                using var stream = await response.Content.ReadAsStreamAsync(ct);
                using var reader = new StreamReader(stream);
                using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture) { HasHeaderRecord = true });
                csv.Context.RegisterClassMap<StudentCsvMap>();

                var successRecords = new List<StudentCsvDto>();
                var errorRecords = new List<StudentErrorCsvDto>();
                int total = 0;

                while (await csv.ReadAsync())
                {
                    total++;
                    try
                    {
                        var record = csv.GetRecord<StudentCsvDto>();
                        if (string.IsNullOrWhiteSpace(record.StudentId) || string.IsNullOrWhiteSpace(record.Email) || string.IsNullOrWhiteSpace(record.FullName))
                        {
                            errorRecords.Add(new StudentErrorCsvDto(record, "Missing required fields (StudentId, FullName, or Email)"));
                        }
                        else
                        {
                            successRecords.Add(record);
                        }
                    }
                    catch (Exception ex)
                    {
                        errorRecords.Add(new StudentErrorCsvDto(null, $"Format error: {ex.Message}"));
                    }
                }

                if (successRecords.Any())
                {
                    using var successStream = new MemoryStream();
                    using var writer = new StreamWriter(successStream);
                    using var csvWriter = new CsvWriter(writer, CultureInfo.InvariantCulture);
                    csvWriter.WriteRecords(successRecords);
                    await writer.FlushAsync();
                    successStream.Position = 0;
                    task.SuccessUrl = await _uploadService.UploadFileAsync(successStream, $"success_{task.Id}.csv");
                }

                if (errorRecords.Any())
                {
                    using var errorStream = new MemoryStream();
                    using var writer = new StreamWriter(errorStream);
                    using var csvWriter = new CsvWriter(writer, CultureInfo.InvariantCulture);
                    csvWriter.WriteRecords(errorRecords);
                    await writer.FlushAsync();
                    errorStream.Position = 0;
                    task.ErrorUrl = await _uploadService.UploadFileAsync(errorStream, $"errors_{task.Id}.csv");
                }

                task.TotalRows = total;
                task.SuccessCount = successRecords.Count;
                task.ErrorCount = errorRecords.Count;
                task.SyncState = SyncState.Filtered;
                await _unitOfWork.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to filter task {TaskId}", task.Id);
                task.SyncState = SyncState.Failed;
                task.ErrorMessage = ex.Message;
                await _unitOfWork.SaveChangesAsync();
            }
        }

        private async Task SynchronizeTaskAsync(SyncTask task, CancellationToken ct)
        {
            try
            {
                _logger.LogInformation("Synchronizing task {TaskId}", task.Id);
                if (string.IsNullOrEmpty(task.SuccessUrl))
                {
                    task.SyncState = SyncState.Synchronized;
                    await _unitOfWork.SaveChangesAsync();
                    return;
                }

                var response = await _httpClient.GetAsync(task.SuccessUrl, ct);
                response.EnsureSuccessStatusCode();

                using var stream = await response.Content.ReadAsStreamAsync(ct);
                using var reader = new StreamReader(stream);
                using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture));
                csv.Context.RegisterClassMap<StudentCsvMap>();
                var records = csv.GetRecords<StudentCsvDto>().ToList();

                foreach (var record in records)
                {
                    var user = await _userManager.Users.FirstOrDefaultAsync(u => u.StudentId == record.StudentId, ct);
                    
                    string dobPart = record.DateOfBirth?.ToString("ddMMyyyy") ?? "01012000";
                    string entryPart = record.EntryYear?.ToString() ?? "2024";
                    string password = dobPart + entryPart;

                    if (user == null)
                    {
                        user = new AppUser(record.Email, record.FullName, UserRole.Student, record.StudentId, record.DateOfBirth, record.EntryYear, record.PhoneNumber);
                        var result = await _userManager.CreateAsync(user, password);
                        if (!result.Succeeded)
                        {
                             _logger.LogWarning("Failed to create user {StudentId}: {Errors}", record.StudentId, string.Join(", ", result.Errors.Select(e => e.Description)));
                        }
                    }
                    else
                    {
                        user.FullName = record.FullName;
                        user.Email = record.Email;
                        user.UserName = record.Email;
                        user.DateOfBirth = record.DateOfBirth;
                        user.EntryYear = record.EntryYear;
                        user.PhoneNumber = record.PhoneNumber;
                        
                        await _userManager.UpdateAsync(user);
                        
                        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                        await _userManager.ResetPasswordAsync(user, token, password);
                    }
                }

                task.SyncState = SyncState.Synchronized;
                task.ProcessedAt = DateTime.UtcNow;
                await _unitOfWork.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to synchronize task {TaskId}", task.Id);
                task.SyncState = SyncState.Failed;
                task.ErrorMessage = ex.Message;
                await _unitOfWork.SaveChangesAsync();
            }
        }
    }

    public class StudentCsvDto
    {
        public string StudentId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? Faculty { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public int? EntryYear { get; set; }
    }

    public class StudentErrorCsvDto
    {
        public string? StudentId { get; set; }
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string ErrorReason { get; set; }

        public StudentErrorCsvDto(StudentCsvDto? dto, string reason)
        {
            StudentId = dto?.StudentId;
            FullName = dto?.FullName;
            Email = dto?.Email;
            ErrorReason = reason;
        }
    }

    public sealed class StudentCsvMap : ClassMap<StudentCsvDto>
    {
        public StudentCsvMap()
        {
            AutoMap(CultureInfo.InvariantCulture);
            Map(m => m.DateOfBirth).TypeConverterOption.Format("dd/MM/yyyy");
        }
    }
}
