using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ssiu.Api.Data;

namespace Ssiu.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ZonesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ZonesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetZones()
        {
            var zones = await _context.Zones.ToListAsync();
            return Ok(zones);
        }

        [HttpGet("asignar")]
        public async Task<IActionResult> AsignarZona(double lat, double lng)
        {
            // Implementación simplificada
            // Lo ideal es un algoritmo Ray Casting o GeoCoordinate
            var zone = await _context.Zones.FirstOrDefaultAsync(); // Demo: devuelve la primera zona
            return Ok(zone);
        }
    }
}
