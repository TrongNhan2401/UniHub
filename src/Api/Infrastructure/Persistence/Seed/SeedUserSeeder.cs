using Domain;
using Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Persistence.Seed
{
    public static class SeedUserSeeder
    {
        private record SeedUser(string Email, string Password, string FullName, UserRole Role, string RoleName);

        private static readonly SeedUser[] SeedUsers =
        [
            new SeedUser(
                Email: "checkin.seed@unihub.local",
                Password: "Checkin@123",
                FullName: "Check-in Staff (Seed)",
                Role: UserRole.CheckInStaff,
                RoleName: SystemRoleSeeder.CheckInStaff)
        ];

        public static async Task SeedAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken = default)
        {
            using var scope = serviceProvider.CreateScope();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
            var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("SeedUserSeeder");

            foreach (var seed in SeedUsers)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var existing = await userManager.FindByEmailAsync(seed.Email);
                if (existing is not null)
                {
                    // Ensure role is assigned
                    if (!await userManager.IsInRoleAsync(existing, seed.RoleName))
                    {
                        await userManager.AddToRoleAsync(existing, seed.RoleName);
                        logger.LogInformation("Assigned role {Role} to existing seed user {Email}", seed.RoleName, seed.Email);
                    }
                    continue;
                }

                var user = new AppUser(seed.Email, seed.FullName, seed.Role);
                user.EmailConfirmed = true;

                var createResult = await userManager.CreateAsync(user, seed.Password);
                if (!createResult.Succeeded)
                {
                    var errors = string.Join("; ", createResult.Errors.Select(e => $"{e.Code}: {e.Description}"));
                    logger.LogError("Failed to create seed user {Email}: {Errors}", seed.Email, errors);
                    continue;
                }

                var roleResult = await userManager.AddToRoleAsync(user, seed.RoleName);
                if (!roleResult.Succeeded)
                {
                    var errors = string.Join("; ", roleResult.Errors.Select(e => $"{e.Code}: {e.Description}"));
                    logger.LogError("Failed to assign role {Role} to seed user {Email}: {Errors}", seed.RoleName, seed.Email, errors);
                    continue;
                }

                logger.LogInformation("Created seed user {Email} with role {Role}", seed.Email, seed.RoleName);
            }
        }
    }
}
