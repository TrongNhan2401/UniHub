using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace Infrastructure.Persistence.Seed
{
    public static class SystemRoleSeeder
    {
        public const string Student = "STUDENT";
        public const string Organizer = "ORGANIZER";
        public const string CheckInStaff = "CHECKIN_STAFF";

        private static readonly string[] RequiredRoles =
        [
            Student,
            Organizer,
            CheckInStaff
        ];

        // Permissions gán cho từng role — đây là nguồn sự thật cho RoleClaims table
        private static readonly Dictionary<string, string[]> RolePermissions = new()
        {
            [Student] = ["view_workshop", "register_workshop"],
            [Organizer] = ["manage_workshop", "view_checkins"],
            [CheckInStaff] = ["checkin", "view_checkins"]
        };

        public const string PermissionClaimType = "permission";

        public static async Task SeedAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken = default)
        {
            using var scope = serviceProvider.CreateScope();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
            var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("SystemRoleSeeder");

            foreach (var roleName in RequiredRoles)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var existingRole = roleManager.Roles
                    .FirstOrDefault(r => r.NormalizedName == roleName);

                if (existingRole is not null)
                {
                    if (!string.Equals(existingRole.Name, roleName, StringComparison.Ordinal))
                    {
                        existingRole.Name = roleName;
                        existingRole.NormalizedName = roleName;

                        var updateResult = await roleManager.UpdateAsync(existingRole);
                        if (!updateResult.Succeeded)
                        {
                            var updateErrors = string.Join("; ", updateResult.Errors.Select(e => $"{e.Code}: {e.Description}"));
                            throw new InvalidOperationException($"Failed to normalize role '{roleName}'. {updateErrors}");
                        }

                        logger.LogInformation("Normalized role name to {RoleName}", roleName);
                    }

                    await SeedRoleClaimsAsync(roleManager, existingRole, roleName, logger, cancellationToken);
                    continue;
                }

                var result = await roleManager.CreateAsync(new IdentityRole<Guid>
                {
                    Name = roleName,
                    NormalizedName = roleName
                });

                if (!result.Succeeded)
                {
                    var errors = string.Join("; ", result.Errors.Select(e => $"{e.Code}: {e.Description}"));
                    throw new InvalidOperationException($"Failed to seed role '{roleName}'. {errors}");
                }

                logger.LogInformation("Seeded role {RoleName}", roleName);

                var createdRole = roleManager.Roles.First(r => r.NormalizedName == roleName);
                await SeedRoleClaimsAsync(roleManager, createdRole, roleName, logger, cancellationToken);
            }
        }

        private static async Task SeedRoleClaimsAsync(
            RoleManager<IdentityRole<Guid>> roleManager,
            IdentityRole<Guid> role,
            string roleName,
            ILogger logger,
            CancellationToken cancellationToken)
        {
            if (!RolePermissions.TryGetValue(roleName, out var permissions))
                return;

            var existingClaims = await roleManager.GetClaimsAsync(role);
            var existingPermissions = existingClaims
                .Where(c => c.Type == PermissionClaimType)
                .Select(c => c.Value)
                .ToHashSet(StringComparer.Ordinal);

            foreach (var permission in permissions)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (existingPermissions.Contains(permission))
                    continue;

                var addResult = await roleManager.AddClaimAsync(role, new Claim(PermissionClaimType, permission));
                if (!addResult.Succeeded)
                {
                    var errors = string.Join("; ", addResult.Errors.Select(e => $"{e.Code}: {e.Description}"));
                    throw new InvalidOperationException($"Failed to seed claim '{permission}' for role '{roleName}'. {errors}");
                }

                logger.LogInformation("Seeded claim permission={Permission} for role {RoleName}", permission, roleName);
            }
        }
    }
}
