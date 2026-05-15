using System.ComponentModel.DataAnnotations;

namespace Application.Features.Auth
{
    // ── Requests ──────────────────────────────────────────────────────────────

    public sealed class SignUpRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(8)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [MaxLength(120)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(30)]
        public string? StudentId { get; set; }

        [MaxLength(30)]
        public string? Role { get; set; }
    }

    public sealed class SignInRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    // ── Responses ─────────────────────────────────────────────────────────────

    public sealed record SignUpResponse(
        Guid Id,
        string Email,
        string FullName,
        string StudentId,
        string Role);

    public sealed record SignInResponse(
        string? AccessToken,
        string? TokenType,
        Guid UserId,
        string Email,
        string FullName,
        string StudentId,
        string? Role,
        bool RequiresTwoFactor = false);

    public sealed class VerifyOtpRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(6, MinimumLength = 6)]
        public string Otp { get; set; } = string.Empty;
    }

    public sealed record MeResponse(
        Guid Id,
        string Email,
        string FullName,
        string StudentId,
        string Role);
}
