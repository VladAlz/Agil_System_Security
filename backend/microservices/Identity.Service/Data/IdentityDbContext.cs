using Microsoft.EntityFrameworkCore;
using Identity.Service.Models;

namespace Identity.Service.Data
{
    public class IdentityDbContext : DbContext
    {
        public IdentityDbContext(DbContextOptions<IdentityDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Guard> Guards { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Semilla de Usuarios — contraseñas en texto plano (modo desarrollo)
            modelBuilder.Entity<User>().HasData(
                new User { Id = 1, Nombre = "Admin UTA",      Correo = "admin@uta.edu.ec",      PasswordHash = "admin123",    Rol = "Administrador", Facultad = "FISEI" },
                new User { Id = 2, Nombre = "Guardia Pedro",  Correo = "guardia1@uta.edu.ec",   PasswordHash = "guard123",    Rol = "Guardia",       Facultad = "" },
                new User { Id = 3, Nombre = "Estudiante Ana", Correo = "estudiante@uta.edu.ec", PasswordHash = "student123",  Rol = "Estudiante",    Facultad = "FCA" }
            );

            // Semilla de Guardias — ZonaId = 1 se valida en Campus.Service
            modelBuilder.Entity<Guard>().HasData(
                new Guard { Id = 1, UsuarioId = 2, ZonaId = 1, Estado = "En Servicio" }
            );
        }
    }
}
