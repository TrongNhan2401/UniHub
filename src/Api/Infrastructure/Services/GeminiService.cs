using Application.Abstractions;
using Microsoft.Extensions.Configuration;
using System;
using System.Net.Http;
using System.Net.Http.Json; // Extension for cleaner JSON posting
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Infrastructure.Services
{
    public class GeminiService : IAiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        // Using gemini-2.5-flash for faster, cheaper summarization in 2026
        private const string _modelId = "gemini-2.5-flash";
        private string BaseUrl => $"https://generativelanguage.googleapis.com/v1/models/{_modelId}:generateContent";

        public GeminiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["GeminiSettings:ApiKey"]
                      ?? throw new ArgumentNullException(nameof(configuration), "Gemini API Key is missing in configuration.");
        }

        public async Task<string> SummarizeWorkshopAsync(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return string.Empty;

            // Limit input length to stay within efficient token limits and reduce latency
            const int maxChars = 30000;
            var truncatedText = text.Length > maxChars ? text.Substring(0, maxChars) + "..." : text;

            var prompt = $"Hãy tóm tắt nội dung workshop sau đây và TRẢ VỀ DUY NHẤT MÃ HTML (chỉ phần body). " +
                         $"TUYỆT ĐỐI KHÔNG dùng Markdown, KHÔNG dùng dấu sao (*), KHÔNG dùng dấu thăng (#), KHÔNG dùng các khối mã ```. " +
                         $"Hãy sử dụng chính xác các thẻ HTML: <h3> cho tiêu đề và <ul>, <li> cho danh sách, <p> cho văn bản. " +
                         $"Cấu trúc bắt buộc phải có đủ 4 mục: <h3>1. Mục tiêu</h3>, <h3>2. Kiến thức chính</h3>, <h3>3. Diễn giả/Người hướng dẫn</h3>, <h3>4. Lợi ích tham gia</h3>. " +
                         $"Ngôn ngữ: Tiếng Việt. Nội dung cần tóm tắt: {truncatedText}";

            var requestBody = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                }
            };

            try
            {
                // Using PostAsJsonAsync simplifies the code and handles headers automatically
                var response = await _httpClient.PostAsJsonAsync($"{BaseUrl}?key={_apiKey}", requestBody);

                if (!response.IsSuccessStatusCode)
                {
                    var errorDetails = await response.Content.ReadAsStringAsync();
                    return $"Lỗi API ({response.StatusCode}): {errorDetails}";
                }

                using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());

                // 1. Check for explicit error object in response body (sometimes returned with 200 OK)
                if (doc.RootElement.TryGetProperty("error", out var apiError))
                {
                    return $"Lỗi API từ Gemini: {apiError.GetRawText()}";
                }

                // 2. Safe navigation using TryGetProperty to avoid runtime crashes
                if (doc.RootElement.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
                {
                    var firstCandidate = candidates[0];

                    // Check if content was blocked or finished abnormally
                    if (firstCandidate.TryGetProperty("finishReason", out var reason) && reason.GetString() != "STOP")
                    {
                        return $"AI không thể hoàn thành tóm tắt (Lý do: {reason.GetString()}).";
                    }

                    if (firstCandidate.TryGetProperty("content", out var content) &&
                        content.TryGetProperty("parts", out var parts) &&
                        parts.GetArrayLength() > 0)
                    {
                        return parts[0].GetProperty("text").GetString() ?? "Nội dung tóm tắt rỗng.";
                    }
                }

                return "Không tìm thấy nội dung phản hồi từ Gemini.";
            }
            catch (HttpRequestException ex)
            {
                return $"Lỗi kết nối mạng: {ex.Message}";
            }
            catch (Exception ex)
            {
                return $"Lỗi hệ thống: {ex.Message}";
            }
        }
    }
}