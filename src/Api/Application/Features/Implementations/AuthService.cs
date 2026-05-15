using Application.Abstractions;
using Application.Features.Auth;
using Application.Features.Interfaces;
using Domain;
using Domain.Entities;
using Domain.Shared;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace Application.Features.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly INotificationService _notificationService;

        public AuthService(
            UserManager<AppUser> userManager,
            RoleManager<IdentityRole<Guid>> roleManager,
            IJwtTokenService jwtTokenService,
            INotificationService notificationService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _jwtTokenService = jwtTokenService;
            _notificationService = notificationService;
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
            Console.WriteLine(roleText);
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

            // Gán user vào Identity role để UserRoles table được cập nhật
            await _userManager.AddToRoleAsync(user, roleText);

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

            var roleText = MapRoleText(user.Role);
            var isAdmin = await _userManager.IsInRoleAsync(user, "ORGANIZER");

            if (isAdmin)
            {
                roleText = "ORGANIZER";
            }

            // [2FA] Nếu là Admin, yêu cầu OTP
            if (isAdmin)
            {
                var otp = new Random().Next(100000, 999999).ToString();
                user.TwoFactorCode = otp;
                user.TwoFactorExpiry = DateTime.UtcNow.AddMinutes(5);
                await _userManager.UpdateAsync(user);

                // Gửi OTP qua email (fire-and-forget)
                _ = _notificationService.SendOtpAsync(user.Email!, user.FullName, otp);

                return Result.Success(new SignInResponse(
                    AccessToken: null,
                    TokenType: null,
                    UserId: user.Id,
                    Email: user.Email!,
                    FullName: user.FullName,
                    StudentId: user.StudentId,
                    Role: null,
                    RequiresTwoFactor: true));
            }

            var roleClaims = await GetRoleClaimsAsync(user);
            var accessToken = _jwtTokenService.GenerateToken(user, roleClaims);

            return Result.Success(new SignInResponse(accessToken, "Bearer", user.Id, user.Email!, user.FullName, user.StudentId, roleText));
        }

        public async Task<Result<SignInResponse>> VerifyOtpAsync(VerifyOtpRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email.Trim());
            if (user is null)
            {
                return Result.Failure<SignInResponse>(new Error("Auth.UserNotFound", "Khong tim thay nguoi dung."));
            }

            if (user.TwoFactorCode != request.Otp || user.TwoFactorExpiry < DateTime.UtcNow)
            {
                return Result.Failure<SignInResponse>(new Error("Auth.InvalidOtp", "Ma OTP khong dung hoac da het han."));
            }

            // Clear OTP after success
            user.TwoFactorCode = null;
            user.TwoFactorExpiry = null;
            await _userManager.UpdateAsync(user);

            var roleText = MapRoleText(user.Role);
            var isAdmin = await _userManager.IsInRoleAsync(user, "ORGANIZER");
            if (isAdmin)
            {
                roleText = "ORGANIZER";
            }

            var roleClaims = await GetRoleClaimsAsync(user);
            var accessToken = _jwtTokenService.GenerateToken(user, roleClaims);

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

            var roleText = MapRoleText(user.Role);
            var isAdmin = await _userManager.IsInRoleAsync(user, "ADMIN");
            if (isAdmin)
            {
                roleText = "ADMIN";
            }

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

        private async Task<IEnumerable<Claim>> GetRoleClaimsAsync(AppUser user)
        {
            var roleNames = await _userManager.GetRolesAsync(user);
            var claims = new List<Claim>();

            foreach (var roleName in roleNames)
            {
                var role = await _roleManager.FindByNameAsync(roleName);
                if (role is null) continue;

                var roleClaims = await _roleManager.GetClaimsAsync(role);
                claims.AddRange(roleClaims);
            }

            return claims;
        }
    }
}

