using Domain.Entities;

namespace Application.Abstractions
{
    public interface IJwtTokenService
    {
        string GenerateToken(AppUser user);
    }
}