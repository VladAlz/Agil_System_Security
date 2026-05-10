using Campus.Service.Data;
using Campus.Service.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ssiu.Shared.Dtos;

namespace Campus.Service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GuardsController : ControllerBase
    {
        private readonly CampusDbContext _context;

        public GuardsController(CampusDbContext context)
        {
            _context = context;
        }

        /// <summary>GET api/guards — Lista todos los guardias.</summary>
        [HttpGet]
        public async Task<IActionResult> GetGuards()
        {
            var guards = await _context.Guards
                .Include(g => g.Zona)
                .ToListAsync();
            return Ok(guards);
        }

        /// <summary>PUT api/guards/{id}/status — Actualiza el estado de disponibilidad del guardia.</summary>
        [HttpPut("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateGuardStatusDto dto)
        {
            var guard = await _context.Guards
                .Include(g => g.Zona)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (guard == null)
                return NotFound(new { mensaje = "Guardia no encontrado" });

            var estadosPermitidos = new[] { "En Servicio", "Descansando" };
            if (!estadosPermitidos.Contains(dto.Estado))
                return BadRequest(new { mensaje = "Estado no válido. Use: En Servicio o Descansando" });

            guard.Estado = dto.Estado;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                guard.Id,
                guard.UsuarioId,
                guard.ZonaId,
                guard.Estado,
                guard.NombreGuardia,
                Zona = guard.Zona == null ? null : new
                {
                    guard.Zona.Id,
                    guard.Zona.Nombre,
                    guard.Zona.Color
                }
            });
        }
    }
}
