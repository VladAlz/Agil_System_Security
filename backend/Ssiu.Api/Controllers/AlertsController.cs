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
            // En un sistema real se usa punto-en-polígono, aquí asignamos estáticamente por demo
            // o lo simulamos. Buscamos la zona aproximada o por defecto Zona 1
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

            // Notificar vía SignalR a los guardias de esa zona y a admins
            await _hubContext.Clients.Group($"zona-{zonaAsignada}").SendAsync("ReceiveAlert", alertWithDetails);
            await _hubContext.Clients.Group("admins").SendAsync("ReceiveAlert", alertWithDetails);

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
    }
}
