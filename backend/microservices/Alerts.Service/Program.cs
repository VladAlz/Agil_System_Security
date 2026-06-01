using Alerts.Service.Data;
using Alerts.Service.Hubs;
using Alerts.Service.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// HU-16 — Secretos fuera del repo: archivo opcional no versionado (SMTP, etc.)
builder.Configuration.AddJsonFile("appsettings.Secrets.json", optional: true, reloadOnChange: true);

// ─── Base de Datos ────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AlertsDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ─── SignalR ──────────────────────────────────────────────────────────────────
builder.Services.AddSignalR();

// ─── JWT ──────────────────────────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]
             ?? throw new InvalidOperationException("Falta Jwt:Key en la configuración (appsettings o variable de entorno Jwt__Key).");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"],
            ValidAudience            = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };

        // Soporte JWT en WebSockets para SignalR
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/alerthub"))
                    context.Token = accessToken;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Alerts.Service", Version = "v1" });
});

// ─── HttpClient para comunicación inter-servicios ─────────────────────────────
builder.Services.AddHttpClient();

// ─── Servicios ────────────────────────────────────────────────────────────────
builder.Services.AddTransient<IEmailService, SmtpEmailService>();

// ─── CORS ─────────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy
            .AllowAnyMethod()
            .AllowAnyHeader()
            .SetIsOriginAllowed(_ => true)
            .AllowCredentials());
});

var app = builder.Build();

// ─── Migraciones automáticas ──────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AlertsDbContext>();
    try
    {
        try
        {
            db.Database.Migrate();
            Console.WriteLine("✓ Migraciones aplicadas correctamente.");
        }
        catch (Exception ex)
        {
            // La BD existe pero __EFMigrationsHistory está vacía o inconsistente.
            // Para desarrollo: recrear BD desde cero.
            Console.WriteLine($"⚠ Migración falló: {ex.Message}");
            Console.WriteLine("  Recreando BD desde cero...");
            try
            {
                db.Database.EnsureDeleted();
                db.Database.Migrate();
                Console.WriteLine("✓ BD recreada y migrada correctamente.");
            }
            catch (Exception ex2)
            {
                Console.WriteLine($"⚠ No se pudo inicializar la BD: {ex2.Message}");
                Console.WriteLine("  El servicio iniciará igual, sin persistencia.");
            }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠ No se pudo asegurar la BD: {ex.Message}");
        Console.WriteLine("  El servicio iniciará igual.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<AlertHub>("/alerthub");

app.Run();
