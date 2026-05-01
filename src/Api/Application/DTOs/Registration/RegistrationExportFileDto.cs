namespace Application.DTOs.Registration
{
    public class RegistrationExportFileDto
    {
        public byte[] Content { get; set; } = Array.Empty<byte>();
        public string ContentType { get; set; } = "text/csv";
        public string FileName { get; set; } = "registrations.csv";
    }
}