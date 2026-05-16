using Application;
using Infrastructure;
using Infrastructure.Persistence.Seed;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.OpenApi;
using System.Security.Claims;
using System.Threading.RateLimiting;

using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var problem = new ValidationProblemDetails(context.ModelState)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Yeu cau khong hop le.",
            Type = "https://httpstatuses.com/400"
        };
        problem.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
        return new BadRequestObjectResult(problem);
    };
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "UniHub API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Chi dan chuoi JWT vao o Authorize, khong them tien to Bearer."
    });

    options.AddSecurityRequirement(doc =>
    {
        var requirement = new OpenApiSecurityRequirement();
        requirement.Add(new OpenApiSecuritySchemeReference("Bearer", doc), new List<string>());
        return requirement;
    });
});

var clientUrl = builder.Configuration["ClientUrl"];
var allowedOrigins = new List<string>
{
    "http://localhost:5125",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "http://localhost:3003",
        "http://127.0.0.1:3003",
        "http://localhost:3004",
        "http://127.0.0.1:3004",
        "http://localhost:3005",
        "http://127.0.0.1:3005",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:8082",
    "http://127.0.0.1:8082",
};

if (!string.IsNullOrWhiteSpace(clientUrl))
{
    allowedOrigins.Add(clientUrl);
}

allowedOrigins = allowedOrigins.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost", policy =>
    {
        policy.WithOrigins(allowedOrigins.ToArray())
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();
builder.Services.AddInfrastructureDependencies(builder.Configuration);
builder.Services.AddApplicationServices();

builder.Services.AddRateLimiter(options =>
{
    // Policy 1: AuthByIp — Fixed Window giới hạn theo IP cho auth endpoints
    options.AddPolicy("AuthByIp", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));

    // Policy 2: ApiByToken — Token Bucket per user (sub claim) cho authenticated endpoints
    options.AddPolicy("ApiByToken", httpContext =>
    {
        var partitionKey = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? httpContext.Connection.RemoteIpAddress?.ToString()
            ?? "anon";
        return RateLimitPartition.GetTokenBucketLimiter(
            partitionKey: partitionKey,
            factory: _ => new TokenBucketRateLimiterOptions
            {
                TokenLimit = 120,
                ReplenishmentPeriod = TimeSpan.FromSeconds(10),
                TokensPerPeriod = 10,
                AutoReplenishment = true,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.Headers.RetryAfter = "60";
        Log.Warning(
            "Rate limit rejected. Path: {Path}, Method: {Method}, IP: {IP}",
            context.HttpContext.Request.Path,
            context.HttpContext.Request.Method,
            context.HttpContext.Connection.RemoteIpAddress);
        context.HttpContext.Response.ContentType = "application/problem+json";
        await context.HttpContext.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = StatusCodes.Status429TooManyRequests,
            Title = "Qua nhieu yeu cau.",
            Detail = "Vui long thu lai sau.",
            Type = "https://httpstatuses.com/429",
            Extensions = { ["traceId"] = context.HttpContext.TraceIdentifier }
        }, cancellationToken);
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CanCheckIn", policy =>
        policy.RequireClaim("permission", "checkin"));

    options.AddPolicy("CanManageWorkshop", policy =>
        policy.RequireClaim("permission", "manage_workshop"));

    options.AddPolicy("CanViewCheckins", policy =>
        policy.RequireAssertion(ctx =>
            ctx.User.HasClaim("permission", "checkin") ||
            ctx.User.HasClaim("permission", "view_checkins")));
});

var app = builder.Build();

await SystemRoleSeeder.SeedAsync(app.Services);
await SeedUserSeeder.SeedAsync(app.Services);

app.UseCors("AllowLocalhost");
app.UseSerilogRequestLogging();
app.UseExceptionHandler(exceptionApp =>
{
    exceptionApp.Run(async context =>
    {
        var feature = context.Features.Get<IExceptionHandlerFeature>();
        if (feature?.Error is not null)
        {
            Log.Error(feature.Error, "Unhandled exception at {Path}", context.Request.Path);
        }

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/problem+json";

        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "Loi he thong.",
            Detail = "Da xay ra loi ngoai du kien. Vui long thu lai sau.",
            Type = "https://httpstatuses.com/500"
        };
        problem.Extensions["traceId"] = context.TraceIdentifier;

        await context.Response.WriteAsJsonAsync(problem);
    });
});
app.UseStatusCodePages(async statusContext =>
{
    var response = statusContext.HttpContext.Response;
    if (response.HasStarted)
    {
        return;
    }

    var shouldWriteProblem = response.StatusCode is
        StatusCodes.Status400BadRequest or
        StatusCodes.Status401Unauthorized or
        StatusCodes.Status403Forbidden or
        StatusCodes.Status404NotFound or
        StatusCodes.Status409Conflict;

    if (!shouldWriteProblem)
    {
        return;
    }

    if (response.ContentLength.HasValue && response.ContentLength.Value > 0)
    {
        return;
    }

    response.ContentType = "application/problem+json";

    var title = response.StatusCode switch
    {
        StatusCodes.Status400BadRequest => "Yeu cau khong hop le.",
        StatusCodes.Status401Unauthorized => "Chua xac thuc.",
        StatusCodes.Status403Forbidden => "Khong co quyen truy cap.",
        StatusCodes.Status404NotFound => "Khong tim thay tai nguyen.",
        StatusCodes.Status409Conflict => "Xung dot du lieu.",
        _ => "Request khong thanh cong."
    };

    var problem = new ProblemDetails
    {
        Status = response.StatusCode,
        Title = title,
        Type = $"https://httpstatuses.com/{response.StatusCode}"
    };
    problem.Extensions["traceId"] = statusContext.HttpContext.TraceIdentifier;

    await response.WriteAsJsonAsync(problem);
});
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapOpenApi();
}

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapMethods("/", new[] { "GET", "HEAD" }, () => Results.Ok(new
{
    service = "UniHub API",
    status = "live",
    timestampUtc = DateTime.UtcNow
}));

app.MapMethods("/health", new[] { "GET", "HEAD" }, () => Results.Ok(new
{
    status = "healthy"
}));

app.MapControllers();

app.Run();
