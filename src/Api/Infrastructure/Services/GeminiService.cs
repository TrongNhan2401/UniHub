using Application.Abstractions;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System;

namespace Infrastructure.Services
{
    public class GeminiService : IAiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private const string _baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

        public GeminiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["GeminiSettings:ApiKey"] ?? throw new ArgumentNullException("Gemini API Key is missing");
        }

        public async Task<string> SummarizeWorkshopAsync(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return string.Empty;

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = $"Hãy tóm tắt nội dung sau đây của một workshop chuyên môn. Tập trung vào: Mục tiêu, Kiến thức chính, Diễn giả và Lợi ích tham gia. Ngôn ngữ: Tiếng Việt. Độ dài: khoảng 200 từ. Nội dung: {text}" }
                        }
                    }
                }
            };

            var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            
            try
            {
                var response = await _httpClient.PostAsync($"{_baseUrl}?key={_apiKey}", content);
                response.EnsureSuccessStatusCode();

                var responseString = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseString);
                
                // Navigate to the text content in Gemini response structure
                var summary = doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                return summary ?? "Không thể tạo bản tóm tắt.";
            }
            catch (Exception ex)
            {
                // In production, log this error
                return $"Lỗi khi gọi AI: {ex.Message}";
            }
        }
    }
}
