using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ssiu.Api.Data;
using Ssiu.Api.Services;

namespace Ssiu.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ZonesController : ControllerBase
    {
        private readonly IZoneService _zoneService;

        public ZonesController(IZoneService zoneService)
        {
            _zoneService = zoneService;
        }

        [HttpGet]
        public async Task<IActionResult> GetZones()
        {
            var zones = await _zoneService.GetZonesAsync();
            return Ok(zones);
        }

        [HttpGet("asignar")]
        public async Task<IActionResult> AsignarZona(double lat, double lng)
        {
            var zone = await _zoneService.AssignZoneAsync(lat, lng);
            if (zone == null)
            {
                return NotFound(new { mensaje = "Ubicación fuera de las zonas monitoreadas" });
            }
            return Ok(zone);
        }
    }
}
