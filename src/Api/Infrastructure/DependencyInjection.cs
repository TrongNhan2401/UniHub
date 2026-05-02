using Application.Abstractions;
using Application.Features.Implementations;
using Application.Features.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence.Contexts;
using Infrastructure.Options;
using Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text.Json;
using System.Text;

namespace Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructureDependencies(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            var jwtIssuer = configuration["Jwt:Issuer"]
                ?? throw new InvalidOperationException("Missing configuration key: Jwt:Issuer");
            var jwtAudience = configuration["Jwt:Audience"]
                ?? throw new InvalidOperationException("Missing configuration key: Jwt:Audience");
            var jwtKey = configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("Missing configuration key: Jwt:Key");

            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(configuration.GetConnectionString("Default")));

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ClockSkew = TimeSpan.Zero,
                        ValidIssuer = jwtIssuer,
                        ValidAudience = jwtAudience,
                        NameClaimType = ClaimTypes.Name,
                        RoleClaimType = ClaimTypes.Role,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
                    };

                    options.Events = new JwtBearerEvents
                    {
                        OnChallenge = async context =>
                        {
                            if (context.Response.HasStarted)
                            {
                                return;
                            }

                            context.HandleResponse();
                            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                            context.Response.ContentType = "application/problem+json";

                            var problem = new ProblemDetails
                            {
                                Status = StatusCodes.Status401Unauthorized,
                                Title = "Chua xac thuc.",
                                Detail = "Token khong hop le hoac khong duoc gui kem request.",
                                Type = "https://httpstatuses.com/401"
                            };
                            problem.Extensions["traceId"] = context.HttpContext.TraceIdentifier;

                            await context.Response.WriteAsync(JsonSerializer.Serialize(problem));
                        },
                        OnForbidden = async context =>
                        {
                            if (context.Response.HasStarted)
                            {
                                return;
                            }

                            context.Response.StatusCode = StatusCodes.Status403Forbidden;
                            context.Response.ContentType = "application/problem+json";

                            var problem = new ProblemDetails
                            {
                                Status = StatusCodes.Status403Forbidden,
                                Title = "Khong co quyen truy cap.",
                                Detail = "Ban da xac thuc nhung khong du quyen cho tai nguyen nay.",
                                Type = "https://httpstatuses.com/403"
                            };
                            problem.Extensions["traceId"] = context.HttpContext.TraceIdentifier;

                            await context.Response.WriteAsync(JsonSerializer.Serialize(problem));
                        }
                    };
                });

            services.AddAuthorization();
            services.AddScoped<IJwtTokenService, JwtTokenService>();
            services.AddScoped<IAuthService, AuthService>();

            services.AddIdentityCore<AppUser>(options =>
            {
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = false;
                options.Password.RequireUppercase = false;
                options.Password.RequiredLength = 6;
                options.User.RequireUniqueEmail = true;
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<AppDbContext>();

            services.AddScoped<Application.Abstractions.Repositories.IWorkshopRepo, Infrastructure.Persistence.Repositories.WorkshopRepo>();
            services.AddScoped<Application.Abstractions.Repositories.ISyncTaskRepo, Infrastructure.Persistence.Repositories.SyncTaskRepo>();
            services.AddScoped<Application.Abstractions.Repositories.IRegistrationRepo, Infrastructure.Persistence.Repositories.RegistrationRepo>();
            services.AddScoped<Application.Abstractions.Repositories.IPaymentRepo, Infrastructure.Persistence.Repositories.PaymentRepo>();
            services.AddScoped<Application.Abstractions.IUnitOfWork, Infrastructure.Persistence.UnitOfWork>();
            services.Configure<PayOsSettings>(configuration.GetSection("Payment:PayOS"));
            services.AddScoped<Application.Abstractions.IPaymentGateway, PayOsGateway>();

            services.Configure<Infrastructure.Storage.CloudinarySettings>(configuration.GetSection("CloudinarySettings"));
            services.AddScoped<Application.Abstractions.IUploadService, Infrastructure.Storage.CloudinaryUploadService>();
            services.AddScoped<Application.Features.Interfaces.ISyncTaskService, Application.Features.Implementations.SyncTaskService>();

            services.AddHttpClient();
            services.AddScoped<Application.Abstractions.IPdfService, Infrastructure.Services.PdfService>();
            services.AddScoped<Application.Abstractions.IAiService, Infrastructure.Services.GeminiService>();

            services.AddHostedService<Infrastructure.BackgroundJobs.SyncBackgroundService>();

            return services;
        }
    }
}
