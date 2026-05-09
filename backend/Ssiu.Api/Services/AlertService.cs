using Microsoft.AspNetCore.SignalR;
using Ssiu.Api.Hubs;
using Ssiu.Api.Models;
using Ssiu.Api.Repositories;

namespace Ssiu.Api.Services
{
    public interface IAlertService
    {
        Task<Alert> CreateAlertAsync(int usuarioId, double lat, double lng);
        Task<List<Alert>> GetAlertsAsync();
        Task ClearAllAlertsAsync();
    }

    public class AlertService : IAlertService
    {
        private readonly IAlertRepository _alertRepository;
        private readonly IZoneService _zoneService;
        private readonly IHubContext<AlertHub> _hubContext;

        public AlertService(IAlertRepository alertRepository, IZoneService zoneService, IHubContext<AlertHub> hubContext)
        {
            _alertRepository = alertRepository;
            _zoneService = zoneService;
            _hubContext = hubContext;
        }

        public async Task<Alert> CreateAlertAsync(int usuarioId, double lat, double lng)
        {
            var zone = await _zoneService.AssignZoneAsync(lat, lng);
            int? zonaId = zone?.Id;

            var alert = new Alert
            {
                UsuarioId = usuarioId,
                ZonaId = zonaId ?? 1, // Fallback to Zone 1 if outside
                Lat = lat,
                Lng = lng,
                Estado = "Activa",
                FechaHora = DateTime.UtcNow
            };

            await _alertRepository.AddAsync(alert);
            
            var alertWithDetails = await _alertRepository.GetByIdWithDetailsAsync(alert.Id);

            // Notify via SignalR
            if (alertWithDetails != null)
            {
                await _hubContext.Clients.Group($"zona-{alert.ZonaId}").SendAsync("ReceiveAlert", alertWithDetails);
                await _hubContext.Clients.Group("admins").SendAsync("ReceiveAlert", alertWithDetails);
            }

            return alertWithDetails ?? alert;
        }

        public async Task<List<Alert>> GetAlertsAsync()
        {
            return await _alertRepository.GetAllWithDetailsAsync();
        }

        public async Task ClearAllAlertsAsync()
        {
            await _alertRepository.DeleteAllAsync();
        }
    }
}
