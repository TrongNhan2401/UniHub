using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Application.DTOs.CheckIn
{
    public class CheckInRequestDto
    {
        /// <summary>
        /// QR code quét từ vé sinh viên. Dạng "REG-{guid:N}".
        /// </summary>
        [Required]
        [JsonPropertyName("qr_code")]
        public string QrCode { get; set; } = string.Empty;
    }

    public class CheckInResponseDto
    {
        [JsonPropertyName("attendance_id")]
        public Guid AttendanceId { get; set; }

        [JsonPropertyName("registration_id")]
        public Guid RegistrationId { get; set; }

        [JsonPropertyName("user_id")]
        public Guid UserId { get; set; }

        [JsonPropertyName("workshop_id")]
        public Guid WorkshopId { get; set; }

        [JsonPropertyName("workshop_title")]
        public string WorkshopTitle { get; set; } = string.Empty;

        [JsonPropertyName("checked_in_at")]
        public DateTime CheckedInAt { get; set; }

        [JsonPropertyName("is_synced_from_offline")]
        public bool IsSyncedFromOffline { get; set; }
    }
}
