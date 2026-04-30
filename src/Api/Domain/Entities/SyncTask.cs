using System;

namespace Domain.Entities
{
    public class SyncTask
    {
        public Guid Id { get; set; }
        public string InputCsvUrl { get; set; } = string.Empty;
        public string? SuccessUrl { get; set; }
        public string? ErrorUrl { get; set; }
        public SyncState SyncState { get; set; } = SyncState.Pending;
        public string? ErrorMessage { get; set; }
        public int TotalRows { get; set; }
        public int SuccessCount { get; set; }
        public int ErrorCount { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ProcessedAt { get; set; }

        public SyncTask()
        {
            Id = Guid.NewGuid();
        }
    }
}
