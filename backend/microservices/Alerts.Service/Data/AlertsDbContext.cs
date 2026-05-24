using Alerts.Service.Models;
using Microsoft.EntityFrameworkCore;

namespace Alerts.Service.Data
{
    public class AlertsDbContext : DbContext
    {
        public AlertsDbContext(DbContextOptions<AlertsDbContext> options) : base(options) { }

        public DbSet<Alert> Alerts { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ─── Índices para estadísticas y consultas del dashboard (HU-07) ──────
            // Filtrar alertas por zona (panel de mapa y estadísticas por zona)
            modelBuilder.Entity<Alert>()
                .HasIndex(a => a.ZonaId)
                .HasDatabaseName("IX_Alerts_ZonaId");

            // Ordenar y filtrar por fecha/hora (historial, tendencia diaria)
            modelBuilder.Entity<Alert>()
                .HasIndex(a => a.FechaHora)
                .HasDatabaseName("IX_Alerts_FechaHora");

            // Consultas por usuario (mis alertas)
            modelBuilder.Entity<Alert>()
                .HasIndex(a => a.UsuarioId)
                .HasDatabaseName("IX_Alerts_UsuarioId");

            // Filtrar por estado activo rápidamente (dashboard principal)
            modelBuilder.Entity<Alert>()
                .HasIndex(a => a.Estado)
                .HasDatabaseName("IX_Alerts_Estado");

            // Índice compuesto para estadísticas por zona + período de tiempo
            modelBuilder.Entity<Alert>()
                .HasIndex(a => new { a.ZonaId, a.FechaHora })
                .HasDatabaseName("IX_Alerts_ZonaId_FechaHora");
        }
    }
}
