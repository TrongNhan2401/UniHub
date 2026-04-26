

namespace Domain.Enties
{
    public class IdempotencyRecord
    {
        public string Key { get; set; } = string.Empty;
        public string ResponseBody { get; set; } = string.Empty;
        public int StatusCode { get; set; }
        public DateTime ExpiresAt { get; set; }
    }
}
