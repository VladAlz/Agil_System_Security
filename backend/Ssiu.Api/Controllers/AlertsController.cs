using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Ssiu.Api.Data;
using Ssiu.Api.Hubs;
using Ssiu.Api.Models;

namespace Ssiu.Api.Controllers
{
    public class CreateAlertDto
    {
        public int UsuarioId { get; set; }
        public double Lat { get; set; }
        public double Lng { get; set; }
    }

    public class UpdateAlertStatusDto
    {
        public string Estado { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class AlertsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<AlertHub> _hubContext;

        public AlertsController(AppDbContext context, IHubContext<AlertHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpPost]
        public async Task<IActionResult> CreateAlert([FromBody] CreateAlertDto dto)
        {
            var zonaAsignada = 1;

            var alert = new Alert
            {
                UsuarioId = dto.UsuarioId,
                ZonaId = zonaAsignada,
                Lat = dto.Lat,
                Lng = dto.Lng,
                Estado = "Activa",
                FechaHora = DateTime.UtcNow
            };

            _context.Alerts.Add(alert);
            await _context.SaveChangesAsync();

            var alertWithDetails = await _context.Alerts
                .Include(a => a.Usuario)
                .Include(a => a.Zona)
                .FirstOrDefaultAsync(a => a.Id == alert.Id);

            await _hubContext.Clients.Group($"zona_{zonaAsignada}")
                .SendAsync("ReceiveAlert", alertWithDetails);

            await _hubContext.Clients.Group("admins")
                .SendAsync("ReceiveAlert", alertWithDetails);

            return Ok(alertWithDetails);
        }

        [HttpGet]
        public async Task<IActionResult> GetAlerts()
        {
            var alerts = await _context.Alerts
                .Include(a => a.Usuario)
                .Include(a => a.Zona)
                .OrderByDescending(a => a.FechaHora)
                .ToListAsync();

            return Ok(alerts);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAlertById(int id)
        {
            var alert = await _context.Alerts
                .Include(a => a.Usuario)
                .Include(a => a.Zona)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (alert == null)
            {
                return NotFound(new { mensaje = "Alerta no encontrada" });
            }

            return Ok(alert);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateAlertStatus(int id, [FromBody] UpdateAlertStatusDto dto)
        {
            var alert = await _context.Alerts
                .Include(a => a.Usuario)
                .Include(a => a.Zona)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (alert == null)
            {
                return NotFound(new { mensaje = "Alerta no encontrada" });
            }

            var estadosPermitidos = new[] 
            { 
                "Activa", 
                "En Camino", 
                "Atendida", 
                "Cancelada" 
            };

            if (!estadosPermitidos.Contains(dto.Estado))
            {
                return BadRequest(new
                {
                    mensaje = "Estado no válido. Use: Activa, En Camino, Atendida o Cancelada"
                });
            }

            alert.Estado = dto.Estado;
            await _context.SaveChangesAsync();

            return Ok(alert);
        }
    }
}