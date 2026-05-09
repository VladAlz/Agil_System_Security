using Ssiu.Api.Models;
using Ssiu.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Ssiu.Api.Repositories
{
    public interface IZoneRepository
    {
        Task<List<Zone>> GetAllAsync();
        Task<Zone?> GetByIdAsync(int id);
    }

    public class ZoneRepository : IZoneRepository
    {
        private readonly AppDbContext _context;

        public ZoneRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Zone>> GetAllAsync()
        {
            return await _context.Zones.ToListAsync();
        }

        public async Task<Zone?> GetByIdAsync(int id)
        {
            return await _context.Zones.FindAsync(id);
        }
    }
}
