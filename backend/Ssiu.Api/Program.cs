using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Ssiu.Api.Data;
using Ssiu.Api.Hubs;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configurar DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configurar SignalR
builder.Services.AddSignalR();

// Configurar JWT
var jwtKey = builder.Configuration["Jwt:Key"] ?? "ClaveSuperSecretaParaDesarrolloDeSsiuCon32CaracteresMinimo";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
        
        // Configurar SignalR para soportar JWT en WebSockets
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/alerthub"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Inyección de Dependencias
builder.Services.AddScoped<Ssiu.Api.Repositories.IUserRepository, Ssiu.Api.Repositories.UserRepository>();
builder.Services.AddScoped<Ssiu.Api.Services.IAuthService, Ssiu.Api.Services.AuthService>();
builder.Services.AddScoped<Ssiu.Api.Repositories.IZoneRepository, Ssiu.Api.Repositories.ZoneRepository>();
builder.Services.AddScoped<Ssiu.Api.Services.IZoneService, Ssiu.Api.Services.ZoneService>();
builder.Services.AddScoped<Ssiu.Api.Repositories.IAlertRepository, Ssiu.Api.Repositories.AlertRepository>();
builder.Services.AddScoped<Ssiu.Api.Services.IAlertService, Ssiu.Api.Services.AlertService>();
builder.Services.AddScoped<Ssiu.Api.Repositories.IGuardRepository, Ssiu.Api.Repositories.GuardRepository>();
builder.Services.AddScoped<Ssiu.Api.Services.IGuardService, Ssiu.Api.Services.GuardService>();

// CORS para permitir a los frontend conectarse
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder => builder
            .AllowAnyMethod()
            .AllowAnyHeader()
            .SetIsOriginAllowed(origin => true) // allow any origin
            .AllowCredentials());
});

var app = builder.Build();

// Crear base de datos y aplicar migraciones automáticamente
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // db.Database.EnsureDeleted(); // Descomentar para limpiar DB en cada inicio
    db.Database.EnsureCreated(); // Crea la base de datos con la semilla de datos si no existe
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

// Para usar la web por la red local sin forzar HTTPS en dev
// app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<AlertHub>("/alerthub");

app.Run();
