using Alerts.Service.Data;
using Alerts.Service.Hubs;
using Alerts.Service.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Ssiu.Shared.Dtos;

namespace Alerts.Service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AlertsController : ControllerBase
    {
        private readonly AlertsDbContext        _context;
        private readonly IHubContext<AlertHub>  _hubContext;
        private readonly IHttpClientFactory     _httpFactory;
        private readonly IConfiguration         _config;

        public AlertsController(
            AlertsDbContext       context,
            IHubContext<AlertHub> hubContext,
            IHttpClientFactory    httpFactory,
            IConfiguration        config)
        {
            _context     = context;
            _hubContext  = hubContext;
            _httpFactory = httpFactory;
            _config      = config;
        }

        // ─── POST api/alerts ──────────────────────────────────────────────────

        /// <summary>Crea una nueva alerta de pánico. Valida el usuario en Identity.Service y obtiene zona de Campus.Service.</summary>
        [HttpPost]
        public async Task<IActionResult> CreateAlert([FromBody] CreateAlertDto dto)
        {
            var http = _httpFactory.CreateClient();

            // 1. Validar que el usuario existe (comunicación con Identity.Service)
            var identityBase = _config["Services:IdentityService"];
            var userResp = await http.GetAsync($"{identityBase}/api/auth/validate/{dto.UsuarioId}");
            if (!userResp.IsSuccessStatusCode)
                return BadRequest(new { mensaje = "No se pudo validar el usuario con Identity.Service" });

            var userDto = await userResp.Content.ReadFromJsonAsync<UserValidationDto>();
            if (userDto == null || !userDto.Existe)
                return NotFound(new { mensaje = $"Usuario con Id={dto.UsuarioId} no encontrado" });

            // 2. Obtener zona de Campus.Service
            var campusBase  = _config["Services:CampusService"];
            var zonaResp    = await http.GetAsync($"{campusBase}/api/zones/asignar?lat={dto.Lat}&lng={dto.Lng}");
            int  zonaId     = 1;
            string zonaNombre = "Zona 1";
            string zonaColor  = "Azul";

            if (zonaResp.IsSuccessStatusCode)
            {
                var zonaData = await zonaResp.Content.ReadFromJsonAsync<ZoneDto>();
                if (zonaData != null)
                {
                    zonaId    = zonaData.Id;
                    zonaNombre = zonaData.Nombre;
                    zonaColor  = zonaData.Color;
                }
            }

            // 3. Persistir alerta con datos desnormalizados
            var alert = new Alert
            {
                UsuarioId    = dto.UsuarioId,
                ZonaId       = zonaId,
                Lat          = dto.Lat,
                Lng          = dto.Lng,
                Estado       = "Activa",
                FechaHora    = DateTime.UtcNow,
                NombreUsuario = userDto.Nombre,
                NombreZona    = zonaNombre,
                ColorZona     = zonaColor,
                Facultad      = userDto.Facultad ?? "FISEI",
                CorreoUsuario = userDto.Correo ?? ""
            };

            _context.Alerts.Add(alert);
            await _context.SaveChangesAsync();

            // 4. Notificar en tiempo real vía SignalR
            await _hubContext.Clients.Group($"zona_{zonaId}").SendAsync("ReceiveAlert", alert);
            await _hubContext.Clients.Group("admins").SendAsync("ReceiveAlert", alert);

            return Ok(alert);
        }

        // ─── GET api/alerts ───────────────────────────────────────────────────

        [HttpGet]
        public async Task<IActionResult> GetAlerts()
        {
            var alerts = await _context.Alerts
                .OrderByDescending(a => a.FechaHora)
                .ToListAsync();
            return Ok(alerts);
        }

        // ─── GET api/alerts/{id} ──────────────────────────────────────────────

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetAlertById(int id)
        {
            var alert = await _context.Alerts.FindAsync(id);
            if (alert == null)
                return NotFound(new { mensaje = "Alerta no encontrada" });
            return Ok(alert);
        }

        // ─── PUT api/alerts/{id}/status ───────────────────────────────────────

        [HttpPut("{id:int}/status")]
        public async Task<IActionResult> UpdateAlertStatus(int id, [FromBody] UpdateAlertStatusDto dto)
        {
            var alert = await _context.Alerts.FindAsync(id);
            if (alert == null)
                return NotFound(new { mensaje = "Alerta no encontrada" });

            var estadosPermitidos = new[] { "Activa", "En Camino", "Atendida", "Cancelada" };
            if (!estadosPermitidos.Contains(dto.Estado))
                return BadRequest(new { mensaje = "Estado no válido. Use: Activa, En Camino, Atendida o Cancelada" });

            alert.Estado = dto.Estado;
            await _context.SaveChangesAsync();

            // Notificar cambio de estado en tiempo real
            await _hubContext.Clients.Group("admins").SendAsync("AlertUpdated", alert);
            await _hubContext.Clients.Group($"zona_{alert.ZonaId}").SendAsync("AlertUpdated", alert);

            if (dto.Estado == "En Camino")
                await _hubContext.Clients.All.SendAsync("AlertAssumed", alert.Id.ToString(), "Un guardia");
            else if (dto.Estado is "Atendida" or "Cancelada")
                await _hubContext.Clients.All.SendAsync("AlertClosed", alert.Id.ToString(), "Situación controlada");

            return Ok(alert);
        }
    }

    // ─── DTO interno para deserializar respuesta de Campus.Service ─────────────
    internal class ZoneDto
    {
        public int    Id     { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Color  { get; set; } = string.Empty;
    }
}
