using Application.Features.Auth;
using Domain.Shared;

namespace Application.Features.Interfaces
{
    public interface IAuthService
    {
        Task<Result<SignUpResponse>> SignUpAsync(SignUpRequest request);
        Task<Result<SignInResponse>> SignInAsync(SignInRequest request);
        Task<Result<MeResponse>> GetMeAsync(Guid userId);
    }
}
