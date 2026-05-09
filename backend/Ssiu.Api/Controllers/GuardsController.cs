using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ssiu.Api.Data;

namespace Ssiu.Api.Controllers
{
    public class UpdateStatusDto
    {
        public string Estado { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class GuardsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public GuardsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPut("{id}/estado")]
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            var guard = await _context.Guards
                .Include(g => g.Usuario)
                .Include(g => g.Zona)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (guard == null)
            {
                return NotFound(new { mensaje = "Guardia no encontrado" });
            }

            var estadosPermitidos = new[] { "En Servicio", "Descansando" };

            if (!estadosPermitidos.Contains(dto.Estado))
            {
                return BadRequest(new
                {
                    mensaje = "Estado no válido. Use: En Servicio o Descansando"
                });
            }

            guard.Estado = dto.Estado;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                guard.Id,
                guard.UsuarioId,
                guard.ZonaId,
                Estado = guard.Estado,
                Usuario = guard.Usuario == null ? null : new
                {
                    guard.Usuario.Id,
                    guard.Usuario.Nombre,
                    guard.Usuario.Correo,
                    guard.Usuario.Rol
                },
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