using Application.Abstractions;
using UglyToad.PdfPig;
using System.Text;
using System.IO;
using System.Threading.Tasks;

namespace Infrastructure.Services
{
    public class PdfService : IPdfService
    {
        public async Task<string> ExtractTextAsync(Stream pdfStream)
        {
            return await Task.Run(() =>
            {
                using var document = PdfDocument.Open(pdfStream);
                var textBuilder = new StringBuilder();

                foreach (var page in document.GetPages())
                {
                    textBuilder.AppendLine(page.Text);
                }

                return CleanText(textBuilder.ToString());
            });
        }

        private string CleanText(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return string.Empty;

            // Simple cleaning: remove extra whitespace and newlines
            return System.Text.RegularExpressions.Regex.Replace(text, @"\s+", " ").Trim();
        }
    }
}
