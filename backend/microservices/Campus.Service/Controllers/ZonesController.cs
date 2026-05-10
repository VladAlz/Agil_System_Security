using Campus.Service.Data;
using Campus.Service.Helpers;
using Campus.Service.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ssiu.Shared.Dtos;

namespace Campus.Service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ZonesController : ControllerBase
    {
        private readonly CampusDbContext _context;

        public ZonesController(CampusDbContext context)
        {
            _context = context;
        }

        /// <summary>GET api/zones — Lista todas las zonas del campus.</summary>
        [HttpGet]
        public async Task<IActionResult> GetZones()
        {
            var zones = await _context.Zones.ToListAsync();
            return Ok(zones);
        }

        /// <summary>GET api/zones/asignar?lat=&amp;lng= — Determina a qué zona pertenecen las coordenadas.</summary>
        [HttpGet("asignar")]
        public async Task<IActionResult> AsignarZona(double lat, double lng)
        {
            var zones = await _context.Zones.ToListAsync();

            foreach (var zone in zones)
            {
                if (GeoHelper.IsPointInPolygon(lat, lng, zone.CoordenadasJson))
                    return Ok(zone);
            }

            return NotFound(new { mensaje = "Ubicación fuera de las zonas monitoreadas" });
        }
    }
}
