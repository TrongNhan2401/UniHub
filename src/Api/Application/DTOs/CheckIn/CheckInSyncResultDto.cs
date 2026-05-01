namespace Application.DTOs.CheckIn
{
    public class CheckInSyncResultDto
    {
        public int Total { get; set; }
        public int Inserted { get; set; }
        public int Duplicates { get; set; }
        public List<CheckInSyncFailedRecordDto> Failed { get; set; } = new();
    }

    public class CheckInSyncFailedRecordDto
    {
        public Guid RegistrationId { get; set; }
        public Guid WorkshopId { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}