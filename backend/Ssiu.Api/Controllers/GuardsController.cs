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
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            var guard = await _context.Guards.FindAsync(id);
            if (guard == null) return NotFound();

            guard.Estado = dto.Estado;
            await _context.SaveChangesAsync();

            return Ok(guard);
        }
    }
}
