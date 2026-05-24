using Alerts.Service.Data;
using Alerts.Service.Hubs;
using Alerts.Service.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Ssiu.Shared.Dtos;

namespace Alerts.Service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]                    // ← Seguridad: todos los endpoints requieren JWT válido
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

        // ═══════════════════════════════════════════════════════════════════════
        // POST api/alerts
        // ═══════════════════════════════════════════════════════════════════════

        /// <summary>Crea una nueva alerta de pánico (HU-03).</summary>
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

        // ═══════════════════════════════════════════════════════════════════════
        // GET api/alerts
        // ═══════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Lista alertas con paginación y filtros opcionales (HU-07).
        /// Parámetros: page (0-based), pageSize (1-100), estado, zonaId.
        /// Devuelve: { total, page, pageSize, totalPages, items: [...] }
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAlerts(
            [FromQuery] int     page      = 0,
            [FromQuery] int     pageSize  = 50,
            [FromQuery] string? estado    = null,
            [FromQuery] int?    zonaId    = null,
            [FromQuery] string? fechaDesde = null,
            [FromQuery] string? fechaHasta = null)
        {
            // Validar pageSize para evitar cargas masivas
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _context.Alerts.AsQueryable();

            // Filtros opcionales
            if (!string.IsNullOrWhiteSpace(estado))
                query = query.Where(a => a.Estado == estado);

            if (zonaId.HasValue)
                query = query.Where(a => a.ZonaId == zonaId.Value);

            if (DateTime.TryParse(fechaDesde, out var desde))
                query = query.Where(a => a.FechaHora >= desde);

            if (DateTime.TryParse(fechaHasta, out var hasta))
                query = query.Where(a => a.FechaHora <= hasta.AddDays(1));

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(a => a.FechaHora)
                .Skip(page * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                total,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)total / pageSize),
                items
            });
        }

        /// <summary>
        /// GET api/alerts/all — Lista TODAS las alertas sin paginar (para uso inter-servicio interno).
        /// Solo debe llamarse desde Report.API o servicios internos, no desde el frontend directamente.
        /// </summary>
        [HttpGet("all")]
        public async Task<IActionResult> GetAllAlerts()
        {
            var alerts = await _context.Alerts
                .OrderByDescending(a => a.FechaHora)
                .ToListAsync();
            return Ok(alerts);
        }

        // ═══════════════════════════════════════════════════════════════════════
        // GET api/alerts/{id}
        // ═══════════════════════════════════════════════════════════════════════

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetAlertById(int id)
        {
            var alert = await _context.Alerts.FindAsync(id);
            if (alert == null)
                return NotFound(new { mensaje = "Alerta no encontrada" });
            return Ok(alert);
        }

        // ═══════════════════════════════════════════════════════════════════════
        // HU-09: Flujo de estados de alerta
        // ═══════════════════════════════════════════════════════════════════════
        //
        //  Activa → Asumida → En Camino → Resuelta → Cerrada
        //
        // ═══════════════════════════════════════════════════════════════════════

        /// <summary>
        /// PUT api/alerts/{id}/assume — Un guardia asume una alerta activa.
        /// Regla de negocio: solo el primer guardia que presiona "Asumir caso" queda asignado.
        /// Si otro guardia ya la asumió → 409 Conflict.
        /// </summary>
        [HttpPut("{id:int}/assume")]
        public async Task<IActionResult> AssumeAlert(int id, [FromBody] AssumeAlertDto dto)
        {
            var alert = await _context.Alerts.FindAsync(id);
            if (alert == null)
                return NotFound(new { mensaje = "Alerta no encontrada" });

            // Validar transición: solo desde "Activa"
            if (alert.Estado != "Activa")
                return BadRequest(new
                {
                    mensaje = $"No se puede asumir una alerta en estado '{alert.Estado}'. Debe estar 'Activa'.",
                    estadoActual = alert.Estado
                });

            // Concurrencia: ¿ya fue asignada a otro guardia?
            if (alert.GuardiaAsignadoId.HasValue && alert.GuardiaAsignadoId.Value != dto.GuardiaId)
                return Conflict(new
                {
                    mensaje = "Otro guardia ya asumió esta alerta.",
                    guardiaAsignadoId = alert.GuardiaAsignadoId.Value,
                    guardiaAsignadoNombre = alert.GuardiaAsignadoNombre
                });

            // Si el mismo guardia vuelve a intentarlo, es idempotente (OK)
            if (alert.GuardiaAsignadoId == dto.GuardiaId)
                return Ok(alert);

            // Validar que el guardia existe en Campus.Service
            var http = _httpFactory.CreateClient();
            var campusBase = _config["Services:CampusService"];
            var guardResp = await http.GetAsync($"{campusBase}/api/guards/{dto.GuardiaId}");

            if (!guardResp.IsSuccessStatusCode)
                return BadRequest(new { mensaje = $"Guardia con Id={dto.GuardiaId} no encontrado en Campus.Service" });

            var guardData = await guardResp.Content.ReadFromJsonAsync<GuardResponseDto>();

            // Asignar la alerta al guardia
            alert.GuardiaAsignadoId = dto.GuardiaId;
            alert.GuardiaAsignadoNombre = guardData?.NombreGuardia ?? "Guardia desconocido";
            alert.Estado = "Asumida";
            alert.FechaAsumida = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // SignalR: notificar que la alerta fue asumida
            await _hubContext.Clients.Group("admins").SendAsync("onAlertAssumed", new
            {
                alert.Id,
                alert.GuardiaAsignadoId,
                alert.GuardiaAsignadoNombre,
                alert.Estado,
                alert.FechaAsumida
            });
            await _hubContext.Clients.Group($"zona_{alert.ZonaId}").SendAsync("onAlertAssumed", new
            {
                alert.Id,
                alert.GuardiaAsignadoId,
                alert.GuardiaAsignadoNombre,
                alert.Estado
            });

            return Ok(alert);
        }

        /// <summary>
        /// PUT api/alerts/{id}/enroute — El guardia va en camino a la alerta.
        /// Transición: Asumida → En Camino
        /// </summary>
        [HttpPut("{id:int}/enroute")]
        public async Task<IActionResult> EnRouteAlert(int id)
        {
            var alert = await _context.Alerts.FindAsync(id);
            if (alert == null)
                return NotFound(new { mensaje = "Alerta no encontrada" });

            if (alert.Estado != "Asumida")
                return BadRequest(new
                {
                    mensaje = $"No se puede cambiar a 'En Camino' desde '{alert.Estado}'. Debe estar 'Asumida'.",
                    estadoActual = alert.Estado
                });

            if (!alert.GuardiaAsignadoId.HasValue)
                return BadRequest(new { mensaje = "La alerta no tiene un guardia asignado." });

            alert.Estado = "En Camino";
            alert.FechaEnCamino = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // SignalR: notificar que el guardia va en camino
            await _hubContext.Clients.Group("admins").SendAsync("onGuardEnRoute", new
            {
                alert.Id,
                alert.GuardiaAsignadoId,
                alert.GuardiaAsignadoNombre,
                alert.Estado
            });
            await _hubContext.Clients.Group($"zona_{alert.ZonaId}").SendAsync("onGuardEnRoute", new
            {
                alert.Id,
                alert.GuardiaAsignadoNombre,
                alert.Estado
            });

            return Ok(alert);
        }

        /// <summary>
        /// PUT api/alerts/{id}/arrive — El guardia llegó al lugar de la alerta.
        /// Transición: En Camino → Resuelta
        /// </summary>
        [HttpPut("{id:int}/arrive")]
        public async Task<IActionResult> ArriveAlert(int id)
        {
            var alert = await _context.Alerts.FindAsync(id);
            if (alert == null)
                return NotFound(new { mensaje = "Alerta no encontrada" });

            if (alert.Estado != "En Camino")
                return BadRequest(new
                {
                    mensaje = $"No se puede marcar como 'Resuelta' desde '{alert.Estado}'. Debe estar 'En Camino'.",
                    estadoActual = alert.Estado
                });

            alert.Estado = "Resuelta";
            alert.FechaResuelta = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // SignalR: notificar que la alerta fue resuelta
            await _hubContext.Clients.Group("admins").SendAsync("onAlertResolved", new
            {
                alert.Id,
                alert.Estado,
                alert.FechaResuelta
            });
            await _hubContext.Clients.Group($"zona_{alert.ZonaId}").SendAsync("onAlertResolved", new
            {
                alert.Id,
                alert.Estado
            });

            return Ok(alert);
        }

        /// <summary>
        /// PUT api/alerts/{id}/close — Cierra la alerta definitivamente.
        /// Transición: Resuelta → Cerrada
        /// </summary>
        [HttpPut("{id:int}/close")]
        public async Task<IActionResult> CloseAlert(int id)
        {
            var alert = await _context.Alerts.FindAsync(id);
            if (alert == null)
                return NotFound(new { mensaje = "Alerta no encontrada" });

            if (alert.Estado != "Resuelta")
                return BadRequest(new
                {
                    mensaje = $"No se puede cerrar una alerta en estado '{alert.Estado}'. Debe estar 'Resuelta'.",
                    estadoActual = alert.Estado
                });

            alert.Estado = "Cerrada";
            alert.FechaCerrada = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // SignalR: notificar cierre
            await _hubContext.Clients.Group("admins").SendAsync("onAlertClosed", new
            {
                alert.Id,
                alert.Estado,
                alert.FechaCerrada,
                mensaje = "Alerta cerrada — situación controlada"
            });
            await _hubContext.Clients.Group($"zona_{alert.ZonaId}").SendAsync("onAlertClosed", new
            {
                alert.Id,
                alert.Estado
            });

            return Ok(alert);
        }

        /// <summary>
        /// PUT api/alerts/{id}/cancel — Cancela una alerta en cualquier estado
        /// antes de que sea resuelta (Activa, Asumida o En Camino).
        /// </summary>
        [HttpPut("{id:int}/cancel")]
        public async Task<IActionResult> CancelAlert(int id)
        {
            var alert = await _context.Alerts.FindAsync(id);
            if (alert == null)
                return NotFound(new { mensaje = "Alerta no encontrada" });

            var estadosCancelables = new[] { "Activa", "Asumida", "En Camino" };
            if (!estadosCancelables.Contains(alert.Estado))
                return BadRequest(new
                {
                    mensaje = $"No se puede cancelar una alerta en estado '{alert.Estado}'. Solo se puede cancelar desde: Activa, Asumida o En Camino.",
                    estadoActual = alert.Estado
                });

            alert.Estado = "Cancelada";
            await _context.SaveChangesAsync();

            // SignalR: notificar cancelación (evento distinto al cierre)
            await _hubContext.Clients.Group("admins").SendAsync("onAlertCancelled", new
            {
                alert.Id,
                alert.Estado
            });
            await _hubContext.Clients.Group($"zona_{alert.ZonaId}").SendAsync("onAlertCancelled", new
            {
                alert.Id,
                alert.Estado
            });

            return Ok(alert);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DTOs internos (no compartidos porque son de uso exclusivo de este servicio)
    // ═══════════════════════════════════════════════════════════════════════════

    internal class ZoneDto
    {
        public int    Id     { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Color  { get; set; } = string.Empty;
    }

    internal class GuardResponseDto
    {
        public int    Id            { get; set; }
        public int    UsuarioId     { get; set; }
        public int?   ZonaId        { get; set; }
        public string Estado        { get; set; } = string.Empty;
        public string NombreGuardia { get; set; } = string.Empty;
    }
}
