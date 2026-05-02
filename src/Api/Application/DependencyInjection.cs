using Application.Features.Implementations;
using Application.Features.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddScoped<IWorkshopService, WorkshopService>();
            services.AddScoped<IRegistrationService, RegistrationService>();
            services.AddScoped<IPaymentService, PaymentService>();

            return services;
        }
    }
}
