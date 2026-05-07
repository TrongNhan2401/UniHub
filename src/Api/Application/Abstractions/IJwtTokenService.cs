using Domain.Entities;
using System.Security.Claims;

namespace Application.Abstractions
{
    public interface IJwtTokenService
    {
        string GenerateToken(AppUser user, IEnumerable<Claim>? additionalClaims = null);
    }
}