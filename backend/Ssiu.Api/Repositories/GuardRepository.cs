using Ssiu.Api.Models;
using Ssiu.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Ssiu.Api.Repositories
{
    public interface IGuardRepository
    {
        Task<Guard?> GetByIdAsync(int id);
        Task UpdateAsync(Guard guard);
    }

    public class GuardRepository : IGuardRepository
    {
        private readonly AppDbContext _context;

        public GuardRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Guard?> GetByIdAsync(int id)
        {
            return await _context.Guards.FindAsync(id);
        }

        public async Task UpdateAsync(Guard guard)
        {
            _context.Guards.Update(guard);
            await _context.SaveChangesAsync();
        }
    }
}
