using Ssiu.Api.Models;
using Ssiu.Api.Repositories;

namespace Ssiu.Api.Services
{
    public interface IGuardService
    {
        Task<bool> UpdateStatusAsync(int id, string nuevoEstado);
    }

    public class GuardService : IGuardService
    {
        private readonly IGuardRepository _guardRepository;

        public GuardService(IGuardRepository guardRepository)
        {
            _guardRepository = guardRepository;
        }

        public async Task<bool> UpdateStatusAsync(int id, string nuevoEstado)
        {
            var guard = await _guardRepository.GetByIdAsync(id);
            if (guard == null) return false;

            guard.Estado = nuevoEstado;
            await _guardRepository.UpdateAsync(guard);
            return true;
        }
    }
}
