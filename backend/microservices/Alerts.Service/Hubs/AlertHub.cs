using Microsoft.AspNetCore.SignalR;

namespace Alerts.Service.Hubs
{
    /// <summary>
    /// Hub de SignalR para comunicación en tiempo real de alertas.
    /// Los clientes se suscriben a grupos por zona o al grupo "admins".
    /// </summary>
    public class AlertHub : Hub
    {
        public async Task JoinZoneGroup(int zonaId)
            => await Groups.AddToGroupAsync(Context.ConnectionId, $"zona_{zonaId}");

        public async Task LeaveZoneGroup(int zonaId)
            => await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"zona_{zonaId}");

        public async Task JoinAdminGroup()
            => await Groups.AddToGroupAsync(Context.ConnectionId, "admins");

        public async Task UpdateGuardLocation(string guardName, int zoneId, double lat, double lng)
        {
            // Retransmitir la ubicación a todos los clientes (principalmente admins)
            await Clients.All.SendAsync("ReceiveGuardLocation", new 
            {
                GuardName = guardName,
                ZoneId = zoneId,
                Lat = lat,
                Lng = lng,
                Timestamp = DateTime.UtcNow
            });
        }
    }
}
