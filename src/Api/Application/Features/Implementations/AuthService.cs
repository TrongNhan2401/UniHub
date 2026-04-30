using Application.Abstractions;
using Application.Features.Auth;
using Application.Features.Interfaces;
using Domain;
using Domain.Entities;
using Domain.Shared;
using Microsoft.AspNetCore.Identity;

namespace Application.Features.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IJwtTokenService _jwtTokenService;

        public AuthService(UserManager<AppUser> userManager, IJwtTokenService jwtTokenService)
        {
            _userManager = userManager;
            _jwtTokenService = jwtTokenService;
        }

        public async Task<Result<SignUpResponse>> SignUpAsync(SignUpRequest request)
        {
            var roleText = string.IsNullOrWhiteSpace(request.Role)
                ? "STUDENT"
                : request.Role.Trim().ToUpperInvariant();

            if (!TryMapRole(roleText, out var roleEnum))
            {
                return Result.Failure<SignUpResponse>(
                    new Error("Auth.InvalidRole", "Role khong hop le. Gia tri phai la STUDENT, ORGANIZER hoac CHECKIN_STAFF."));
            }

            if (await _userManager.FindByEmailAsync(request.Email) is not null)
            {
                return Result.Failure<SignUpResponse>(
                    new Error("Auth.EmailExists", "Email da ton tai."));
            }

            var user = new AppUser(
                request.Email,
                request.FullName,
                roleEnum,
                request.StudentId
            );

            var createResult = await _userManager.CreateAsync(user, request.Password);
            if (!createResult.Succeeded)
            {
                var details = string.Join(" ", createResult.Errors.Select(e => e.Description));
                return Result.Failure<SignUpResponse>(new Error("Auth.CreateFailed", details));
            }

            var addRoleResult = await _userManager.AddToRoleAsync(user, roleText);
            if (!addRoleResult.Succeeded)
            {
                await _userManager.DeleteAsync(user);
                var details = string.Join(" ", addRoleResult.Errors.Select(e => e.Description));
                return Result.Failure<SignUpResponse>(new Error("Auth.RoleFailed", details));
            }

            return Result.Success(new SignUpResponse(user.Id, user.Email!, user.FullName, user.StudentId, roleText));
        }

        public async Task<Result<SignInResponse>> SignInAsync(SignInRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email.Trim());
            if (user is null)
            {
                return Result.Failure<SignInResponse>(
                    new Error("Auth.InvalidCredentials", "Email hoac mat khau khong dung."));
            }

            var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
            if (!isPasswordValid)
            {
                return Result.Failure<SignInResponse>(
                    new Error("Auth.InvalidCredentials", "Email hoac mat khau khong dung."));
            }

            var roles = await _userManager.GetRolesAsync(user);
            var roleText = roles.FirstOrDefault() ?? MapRoleText(user.Role);
            var accessToken = _jwtTokenService.GenerateToken(user);

            return Result.Success(new SignInResponse(accessToken, "Bearer", user.Id, user.Email!, user.FullName, user.StudentId, roleText));
        }

        public async Task<Result<MeResponse>> GetMeAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user is null)
            {
                return Result.Failure<MeResponse>(
                    new Error("Auth.NotFound", "Khong tim thay nguoi dung."));
            }

            var roles = await _userManager.GetRolesAsync(user);
            var roleText = roles.FirstOrDefault() ?? MapRoleText(user.Role);

            return Result.Success(new MeResponse(user.Id, user.Email!, user.FullName, user.StudentId, roleText));
        }

        private static bool TryMapRole(string roleText, out UserRole role)
        {
            role = roleText switch
            {
                "STUDENT" => UserRole.Student,
                "ORGANIZER" => UserRole.Organizer,
                "CHECKIN_STAFF" => UserRole.CheckInStaff,
                _ => UserRole.Student
            };

            return roleText is "STUDENT" or "ORGANIZER" or "CHECKIN_STAFF";
        }

        private static string MapRoleText(UserRole role) => role switch
        {
            UserRole.Student => "STUDENT",
            UserRole.Organizer => "ORGANIZER",
            UserRole.CheckInStaff => "CHECKIN_STAFF",
            _ => "STUDENT"
        };
    }
}

