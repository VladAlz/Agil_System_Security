using Campus.Service.Models;
using Microsoft.EntityFrameworkCore;

namespace Campus.Service.Data
{
    public class CampusDbContext : DbContext
    {
        public CampusDbContext(DbContextOptions<CampusDbContext> options) : base(options) { }

        public DbSet<Zone>  Zones  { get; set; }
        public DbSet<Guard> Guards { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Semilla de Zonas del Campus UTA Huachi (coordenadas reales)
            modelBuilder.Entity<Zone>().HasData(
                new Zone
                {
                    Id = 1, Nombre = "Zona 1", Color = "Azul",
                    CoordenadasJson = "[{\"lat\":-1.266403, \"lng\":-78.625312}, {\"lat\":-1.267693, \"lng\":-78.624075}, {\"lat\":-1.266470, \"lng\":-78.624768}]"
                },
                new Zone
                {
                    Id = 2, Nombre = "Zona 2", Color = "Verde",
                    CoordenadasJson = "[{\"lat\":-1.267714, \"lng\":-78.625654}, {\"lat\":-1.268798, \"lng\":-78.624850}, {\"lat\":-1.268746, \"lng\":-78.625922}]"
                },
                new Zone
                {
                    Id = 3, Nombre = "Zona 3", Color = "Naranja",
                    CoordenadasJson = "[{\"lat\":-1.268034, \"lng\":-78.623935}, {\"lat\":-1.266572, \"lng\":-78.623173}, {\"lat\":-1.266471, \"lng\":-78.624359}]"
                },
                new Zone
                {
                    Id = 4, Nombre = "Zona 4", Color = "Rojo",
                    CoordenadasJson = "[{\"lat\":-1.268747, \"lng\":-78.625948}, {\"lat\":-1.270194, \"lng\":-78.622425}, {\"lat\":-1.270364, \"lng\":-78.626346}]"
                }
            );

            // Semilla de Guardia inicial
            modelBuilder.Entity<Guard>().HasData(
                new Guard { Id = 1, UsuarioId = 2, ZonaId = 1, Estado = "En Servicio", NombreGuardia = "Guardia Pedro" }
            );
        }
    }
}
