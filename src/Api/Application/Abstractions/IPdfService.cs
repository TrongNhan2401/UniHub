using System.Threading.Tasks;

namespace Application.Abstractions
{
    public interface IPdfService
    {
        Task<string> ExtractTextAsync(Stream pdfStream);
    }
}
