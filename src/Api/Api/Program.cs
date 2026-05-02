using Application;
using Infrastructure;
using Infrastructure.Persistence.Seed;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi;

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

var clientUrl = builder.Configuration["ClientUrl"] ?? "http://localhost:5173";
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5125",   // Backend or Swagger UI
                 clientUrl    // Vite frontend
            )
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

var app = builder.Build();

await SystemRoleSeeder.SeedAsync(app.Services);

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
else
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
