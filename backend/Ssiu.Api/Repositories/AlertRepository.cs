using Ssiu.Api.Models;
using Ssiu.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Ssiu.Api.Repositories
{
    public interface IAlertRepository
    {
        Task<Alert> AddAsync(Alert alert);
        Task<Alert?> GetByIdWithDetailsAsync(int id);
        Task<List<Alert>> GetAllWithDetailsAsync();
        Task DeleteAllAsync();
    }

    public class AlertRepository : IAlertRepository
    {
        private readonly AppDbContext _context;

        public AlertRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Alert> AddAsync(Alert alert)
        {
            _context.Alerts.Add(alert);
            await _context.SaveChangesAsync();
            return alert;
        }

        public async Task<Alert?> GetByIdWithDetailsAsync(int id)
        {
            return await _context.Alerts
                .Include(a => a.Usuario)
                .Include(a => a.Zona)
                .FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<List<Alert>> GetAllWithDetailsAsync()
        {
            return await _context.Alerts
                .Include(a => a.Usuario)
                .Include(a => a.Zona)
                .OrderByDescending(a => a.FechaHora)
                .ToListAsync();
        }

        public async Task DeleteAllAsync()
        {
            await _context.Alerts.ExecuteDeleteAsync();
        }
    }
}
