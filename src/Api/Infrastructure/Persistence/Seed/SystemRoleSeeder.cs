using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

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
            }
        }
    }
}
