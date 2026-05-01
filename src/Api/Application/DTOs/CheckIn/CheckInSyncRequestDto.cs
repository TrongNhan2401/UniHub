namespace Application.DTOs.CheckIn
{
    public class CheckInSyncRequestDto
    {
        public List<CheckInRequestDto> Records { get; set; } = new();
    }
}