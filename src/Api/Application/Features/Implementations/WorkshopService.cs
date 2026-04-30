using Application.Abstractions;
using Application.Abstractions.Repositories;
using Application.DTOs.Workshop;
using Application.Features.Interfaces;
using Application.Mappings;
using Domain.Entities;
using Domain.Shared;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Application.Features.Implementations
{
    public class WorkshopService : IWorkshopService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IUploadService _uploadService;
        private readonly IPdfService _pdfService;
        private readonly IAiService _aiService;

        public WorkshopService(
            IUnitOfWork unitOfWork, 
            IUploadService uploadService,
            IPdfService pdfService,
            IAiService aiService)
        {
            _unitOfWork = unitOfWork;
            _uploadService = uploadService;
            _pdfService = pdfService;
            _aiService = aiService;
        }

        public async Task<Result<WorkshopDto>> CreateWorkshopAsync(CreateWorkshopDto dto, Guid userId)
        {
            string? imageUrl = null;
            if (dto.Image != null)
            {
                try
                {
                    imageUrl = await _uploadService.UploadImageAsync(dto.Image);
                }
                catch (Exception ex)
                {
                    return Result.Failure<WorkshopDto>(new Error("Workshop.ImageUploadFailed", ex.Message));
                }
            }

            var workshopResult = Workshop.Create(
                dto.Title,
                dto.Description,
                dto.SpeakerName,
                dto.SpeakerBio,
                dto.Room,
                dto.RoomMapUrl,
                dto.StartTime,
                dto.EndTime,
                dto.TotalSlots,
                dto.IsFree,
                dto.Price,
                userId,
                imageUrl
            );

            if (workshopResult.IsFailure)
            {
                return Result.Failure<WorkshopDto>(workshopResult.Error);
            }

            var workshop = workshopResult.Value;

            try
            {
                await _unitOfWork.Workshops.AddAsync(workshop);
                await _unitOfWork.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                return Result.Failure<WorkshopDto>(new Error("Workshop.SaveFailed", "An error occurred while saving the workshop."));
            }

            return Result.Success(workshop.ToDto());
        }

        public async Task<Result<WorkshopDto>> UpdateWorkshopAsync(Guid id, UpdateWorkshopDto dto)
        {
            var workshop = await _unitOfWork.Workshops.GetByIdAsync(id);
            if (workshop == null)
            {
                return Result.Failure<WorkshopDto>(new Error("Workshop.NotFound", $"Workshop with id {id} was not found."));
            }

            string? imageUrl = null;
            if (dto.Image != null)
            {
                try
                {
                    imageUrl = await _uploadService.UploadImageAsync(dto.Image);
                }
                catch (Exception ex)
                {
                    return Result.Failure<WorkshopDto>(new Error("Workshop.ImageUploadFailed", ex.Message));
                }
            }

            var updateResult = workshop.Update(
                dto.Title,
                dto.Description,
                dto.SpeakerName,
                dto.SpeakerBio,
                dto.Room,
                dto.RoomMapUrl,
                dto.StartTime,
                dto.EndTime,
                dto.TotalSlots,
                dto.IsFree,
                dto.Price,
                imageUrl
            );

            if (updateResult.IsFailure)
            {
                return Result.Failure<WorkshopDto>(updateResult.Error);
            }

            try
            {
                await _unitOfWork.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                return Result.Failure<WorkshopDto>(new Error("Workshop.UpdateFailed", "An error occurred while updating the workshop."));
            }

            return Result.Success(workshop.ToDto());
        }

        public async Task<Result<bool>> PublishWorkshopAsync(Guid id)
        {
            var workshop = await _unitOfWork.Workshops.GetByIdAsync(id);
            if (workshop == null)
            {
                return Result.Failure<bool>(new Error("Workshop.NotFound", $"Workshop with id {id} was not found."));
            }

            var result = workshop.Publish();
            if (result.IsFailure)
            {
                return Result.Failure<bool>(result.Error);
            }

            try
            {
                await _unitOfWork.SaveChangesAsync();
                return Result.Success(true);
            }
            catch (Exception ex)
            {
                return Result.Failure<bool>(new Error("Workshop.SaveFailed", "An error occurred while saving the workshop."));
            }
        }

        public async Task<Result<bool>> CancelWorkshopAsync(Guid id)
        {
            var workshop = await _unitOfWork.Workshops.GetByIdAsync(id);
            if (workshop == null)
            {
                return Result.Failure<bool>(new Error("Workshop.NotFound", $"Workshop with id {id} was not found."));
            }

            var result = workshop.Cancel();
            if (result.IsFailure)
            {
                return Result.Failure<bool>(result.Error);
            }

            try
            {
                await _unitOfWork.SaveChangesAsync();
                return Result.Success(true);
            }
            catch (Exception ex)
            {
                return Result.Failure<bool>(new Error("Workshop.SaveFailed", "An error occurred while saving the workshop."));
            }
        }

        public async Task<Result<string>> UploadWorkshopPdfAsync(Guid id, IFormFile file)
        {
            var workshop = await _unitOfWork.Workshops.GetByIdAsync(id);
            if (workshop == null)
            {
                return Result.Failure<string>(new Error("Workshop.NotFound", $"Workshop with id {id} was not found."));
            }

            try
            {
                // 1. Upload to Cloudinary
                var pdfUrl = await _uploadService.UploadPdfAsync(file);
                workshop.SetPdfUrl(pdfUrl);

                // 2. Extract Text for AI
                using var stream = file.OpenReadStream();
                var extractedText = await _pdfService.ExtractTextAsync(stream);

                // 3. Save initial PDF URL
                await _unitOfWork.SaveChangesAsync();

                // 4. Fire and forget AI Summary generation
                _ = Task.Run(async () =>
                {
                    try
                    {
                        var summary = await _aiService.SummarizeWorkshopAsync(extractedText);
                        
                        // We need a fresh unit of work/service or a way to save back
                        // For simplicity in this demo, we'll use the current one, 
                        // but in production, use a Scoped service provider.
                        workshop.SetAiSummary(summary);
                        await _unitOfWork.SaveChangesAsync();
                    }
                    catch (Exception)
                    {
                        // Log background error
                    }
                });

                return Result.Success(pdfUrl);
            }
            catch (Exception ex)
            {
                return Result.Failure<string>(new Error("Workshop.PdfUploadFailed", ex.Message));
            }
        }

        public async Task<Result<PagedResult<WorkshopListDto>>> GetWorkshopsPagedAsync(int pageNumber, int pageSize, DateTime? date = null)
        {
            var (items, totalCount) = await _unitOfWork.Workshops.GetPagedAsync(pageNumber, pageSize, date);
            
            var dtos = items.Select(w => w.ToListDto()).ToList();
            var pagedResult = new PagedResult<WorkshopListDto>(dtos, totalCount, pageNumber, pageSize);
            
            return Result.Success(pagedResult);
        }

        public async Task<Result<WorkshopDetailDto>> GetWorkshopDetailAsync(Guid id)
        {
            var workshop = await _unitOfWork.Workshops.GetByIdAsync(id);
            
            if (workshop == null)
            {
                return Result.Failure<WorkshopDetailDto>(new Error("Workshop.NotFound", $"Workshop with id {id} was not found."));
            }

            return Result.Success(workshop.ToDetailDto());
        }
    }
}
