using Domain.Entities;
using Infrastructure.Persistence.Contexts;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructureDependencies(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(configuration.GetConnectionString("Default")));

            services.AddIdentityCore<AppUser>(options =>
            {
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = false;
                options.Password.RequiredLength = 8;
                options.User.RequireUniqueEmail = true;
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<AppDbContext>();

            services.AddScoped<Application.Abstractions.Repositories.IWorkshopRepo, Infrastructure.Persistence.Repositories.WorkshopRepo>();
            services.AddScoped<Application.Abstractions.IUnitOfWork, Infrastructure.Persistence.UnitOfWork>();
            
            services.Configure<Infrastructure.Storage.CloudinarySettings>(configuration.GetSection("CloudinarySettings"));
            services.AddScoped<Application.Abstractions.IUploadService, Infrastructure.Storage.CloudinaryUploadService>();

            services.AddHttpClient();
            services.AddScoped<Application.Abstractions.IPdfService, Infrastructure.Services.PdfService>();
            services.AddScoped<Application.Abstractions.IAiService, Infrastructure.Services.GeminiService>();

            return services;
        }
    }
}
