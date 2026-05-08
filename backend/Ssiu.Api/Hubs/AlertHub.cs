using Microsoft.AspNetCore.SignalR;

namespace Ssiu.Api.Hubs
{
    public class AlertHub : Hub
    {
        public async Task JoinZoneGroup(int zonaId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"zona-{zonaId}");
        }

        public async Task LeaveZoneGroup(int zonaId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"zona-{zonaId}");
        }

        public async Task JoinAdminGroup()
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "admins");
        }
    }
}
