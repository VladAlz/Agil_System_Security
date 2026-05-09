using Ssiu.Api.Helpers;
using Ssiu.Api.Models;
using Ssiu.Api.Repositories;

namespace Ssiu.Api.Services
{
    public interface IZoneService
    {
        Task<List<Zone>> GetZonesAsync();
        Task<Zone?> AssignZoneAsync(double lat, double lng);
    }

    public class ZoneService : IZoneService
    {
        private readonly IZoneRepository _zoneRepository;

        public ZoneService(IZoneRepository zoneRepository)
        {
            _zoneRepository = zoneRepository;
        }

        public async Task<List<Zone>> GetZonesAsync()
        {
            return await _zoneRepository.GetAllAsync();
        }

        public async Task<Zone?> AssignZoneAsync(double lat, double lng)
        {
            var zones = await _zoneRepository.GetAllAsync();
            foreach (var zone in zones)
            {
                if (GeoHelper.IsPointInPolygon(lat, lng, zone.CoordenadasJson))
                {
                    return zone;
                }
            }
            return null;
        }
    }
}
