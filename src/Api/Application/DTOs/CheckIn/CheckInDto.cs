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

    public class PreloadRegistrationDto
    {
        [JsonPropertyName("registration_id")]
        public Guid RegistrationId { get; set; }

        [JsonPropertyName("qr_code")]
        public string QrCode { get; set; } = string.Empty;

        [JsonPropertyName("student_name")]
        public string StudentName { get; set; } = string.Empty;

        [JsonPropertyName("student_id")]
        public string StudentId { get; set; } = string.Empty;

        [JsonPropertyName("student_email")]
        public string StudentEmail { get; set; } = string.Empty;
    }

    public class ValidateRegistrationResponseDto
    {
        [JsonPropertyName("registration_id")]
        public Guid RegistrationId { get; set; }

        [JsonPropertyName("is_valid")]
        public bool IsValid { get; set; }

        [JsonPropertyName("already_checked_in")]
        public bool AlreadyCheckedIn { get; set; }

        [JsonPropertyName("student_name")]
        public string StudentName { get; set; } = string.Empty;

        [JsonPropertyName("student_id")]
        public string StudentId { get; set; } = string.Empty;

        [JsonPropertyName("student_email")]
        public string StudentEmail { get; set; } = string.Empty;

        [JsonPropertyName("workshop_title")]
        public string WorkshopTitle { get; set; } = string.Empty;
    }

    public class OfflineSyncRecordDto
    {
        [JsonPropertyName("registration_id")]
        public Guid RegistrationId { get; set; }

        [JsonPropertyName("workshop_id")]
        public Guid WorkshopId { get; set; }

        [JsonPropertyName("device_id")]
        public string DeviceId { get; set; } = string.Empty;

        [JsonPropertyName("checked_in_at")]
        public DateTime CheckedInAt { get; set; }

        [JsonPropertyName("sync_key")]
        public string SyncKey { get; set; } = string.Empty;
    }

    public class OfflineSyncRequestDto
    {
        [Required]
        [MinLength(1)]
        [JsonPropertyName("records")]
        public List<OfflineSyncRecordDto> Records { get; set; } = new();
    }

    public class OfflineSyncRecordResultDto
    {
        [JsonPropertyName("sync_key")]
        public string SyncKey { get; set; } = string.Empty;

        [JsonPropertyName("registration_id")]
        public Guid RegistrationId { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("message")]
        public string? Message { get; set; }

        [JsonPropertyName("attendance_id")]
        public Guid? AttendanceId { get; set; }
    }

    public class OfflineSyncResponseDto
    {
        [JsonPropertyName("total")]
        public int Total { get; set; }

        [JsonPropertyName("inserted")]
        public int Inserted { get; set; }

        [JsonPropertyName("duplicates")]
        public int Duplicates { get; set; }

        [JsonPropertyName("failed")]
        public int Failed { get; set; }

        [JsonPropertyName("results")]
        public List<OfflineSyncRecordResultDto> Results { get; set; } = new();
    }
}
