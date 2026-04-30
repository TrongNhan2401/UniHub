using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace Application.Abstractions
{
    public interface IUploadService
    {
        Task<string> UploadImageAsync(IFormFile file);
        Task<string> UploadPdfAsync(IFormFile file);
    }
}
