using Microsoft.EntityFrameworkCore;
using Ssiu.Api.Models;

namespace Ssiu.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Zone> Zones { get; set; }
        public DbSet<Guard> Guards { get; set; }
        public DbSet<Alert> Alerts { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Semilla de Zonas (UTA)
            modelBuilder.Entity<Zone>().HasData(
                new Zone { Id = 1, Nombre = "Zona 1", Color = "Azul", CoordenadasJson = "[{\"lat\":-1.266, \"lng\":-78.625}, {\"lat\":-1.267, \"lng\":-78.625}, {\"lat\":-1.267, \"lng\":-78.624}, {\"lat\":-1.266, \"lng\":-78.624}]" },
                new Zone { Id = 2, Nombre = "Zona 2", Color = "Verde", CoordenadasJson = "[{\"lat\":-1.267, \"lng\":-78.625}, {\"lat\":-1.268, \"lng\":-78.625}, {\"lat\":-1.268, \"lng\":-78.624}, {\"lat\":-1.267, \"lng\":-78.624}]" },
                new Zone { Id = 3, Nombre = "Zona 3", Color = "Naranja", CoordenadasJson = "[{\"lat\":-1.266, \"lng\":-78.624}, {\"lat\":-1.267, \"lng\":-78.624}, {\"lat\":-1.267, \"lng\":-78.623}, {\"lat\":-1.266, \"lng\":-78.623}]" },
                new Zone { Id = 4, Nombre = "Zona 4", Color = "Rojo", CoordenadasJson = "[{\"lat\":-1.267, \"lng\":-78.624}, {\"lat\":-1.268, \"lng\":-78.624}, {\"lat\":-1.268, \"lng\":-78.623}, {\"lat\":-1.267, \"lng\":-78.623}]" }
            );

            // Semilla de Usuarios
            var hasher = new BCrypt.Net.BCrypt();
            string adminPassword = BCrypt.Net.BCrypt.HashPassword("admin123");
            string guardPassword = BCrypt.Net.BCrypt.HashPassword("guard123");
            string studentPassword = BCrypt.Net.BCrypt.HashPassword("student123");

            modelBuilder.Entity<User>().HasData(
                new User { Id = 1, Nombre = "Admin UTA", Correo = "admin@uta.edu.ec", PasswordHash = adminPassword, Rol = "Administrador", Facultad = "FISEI" },
                new User { Id = 2, Nombre = "Guardia Pedro", Correo = "guardia1@uta.edu.ec", PasswordHash = guardPassword, Rol = "Guardia", Facultad = "" },
                new User { Id = 3, Nombre = "Estudiante Ana", Correo = "estudiante@uta.edu.ec", PasswordHash = studentPassword, Rol = "Estudiante", Facultad = "FCA" }
            );

            // Semilla de Guardias
            modelBuilder.Entity<Guard>().HasData(
                new Guard { Id = 1, UsuarioId = 2, ZonaId = 1, Estado = "En Servicio" }
            );
        }
    }
}
