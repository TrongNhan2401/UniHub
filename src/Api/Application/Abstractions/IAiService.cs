using System.Threading.Tasks;

namespace Application.Abstractions
{
    public interface IAiService
    {
        Task<string> SummarizeWorkshopAsync(string text);
    }
}
