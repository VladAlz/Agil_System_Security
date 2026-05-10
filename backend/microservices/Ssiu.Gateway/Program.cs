using Ocelot.DependencyInjection;
using Ocelot.Middleware;

var builder = WebApplication.CreateBuilder(args);

// ─── Carga configuración de Ocelot ────────────────────────────────────────────
builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);

// ─── CORS — permite a los frontend conectarse directamente al Gateway ─────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy
            .AllowAnyMethod()
            .AllowAnyHeader()
            .SetIsOriginAllowed(_ => true)
            .AllowCredentials());
});

builder.Services.AddOcelot();

var app = builder.Build();

app.UseCors("AllowAll");

// ─── Ocelot actúa como proxy inverso para todas las rutas ─────────────────────
await app.UseOcelot();

app.Run();
