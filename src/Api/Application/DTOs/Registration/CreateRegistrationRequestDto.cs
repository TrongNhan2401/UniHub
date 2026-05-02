using System.Text.Json.Serialization;

namespace Application.DTOs.Registration
{
    public class CreateRegistrationRequestDto
    {
        [JsonPropertyName("workshop_id")]
        public Guid WorkshopId { get; set; }
    }
}
