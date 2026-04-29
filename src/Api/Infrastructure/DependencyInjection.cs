using Application.Abstractions;
using Domain.Entities;
using Domain.Shared;
using Infrastructure.Persistence.Contexts;
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

            services.AddAuthorization(options =>
            {
                options.AddPolicy(AppPolicies.WorkshopRead, policy =>
                    policy.RequireRole(AppRoles.Student, AppRoles.Organizer, AppRoles.CheckInStaff));

                options.AddPolicy(AppPolicies.RegistrationCreate, policy =>
                    policy.RequireRole(AppRoles.Student));
            });
            services.AddScoped<IJwtTokenService, JwtTokenService>();
            services.AddScoped<IWorkshopQueryService, WorkshopQueryService>();
            services.AddScoped<IRegistrationService, RegistrationService>();

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

            return services;
        }
    }
}
