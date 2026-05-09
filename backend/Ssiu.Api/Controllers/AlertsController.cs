using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Ssiu.Api.Data;
using Ssiu.Api.Hubs;
using Ssiu.Api.Models;
using Ssiu.Api.Services;

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
        private readonly IAlertService _alertService;

        public AlertsController(IAlertService alertService)
        {
            _alertService = alertService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateAlert([FromBody] CreateAlertDto dto)
        {
            var alert = await _alertService.CreateAlertAsync(dto.UsuarioId, dto.Lat, dto.Lng);
            return Ok(alert);
        }

        [HttpGet]
        public async Task<IActionResult> GetAlerts()
        {
            var alerts = await _alertService.GetAlertsAsync();
            return Ok(alerts);
        }
    }
}
