using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ssiu.Api.Data;
using Ssiu.Api.Services;

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
        private readonly IGuardService _guardService;

        public GuardsController(IGuardService guardService)
        {
            _guardService = guardService;
        }

        [HttpPut("{id}/estado")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            var success = await _guardService.UpdateStatusAsync(id, dto.Estado);
            if (!success) return NotFound();

            return Ok(new { mensaje = "Estado actualizado correctamente" });
        }
    }
}
