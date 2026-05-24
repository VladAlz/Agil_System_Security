using Microsoft.EntityFrameworkCore;
using Report.API.Models;

namespace Report.API.Data
{
    public class ReportDbContext : DbContext
    {
        public ReportDbContext(DbContextOptions<ReportDbContext> options) : base(options) { }

        public DbSet<ShiftReport> ShiftReports { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ─── Índices para consultas de estadísticas ────────────────────────
            // HU-07/09: Filtrar turnos por zona (dashboard por zona)
            modelBuilder.Entity<ShiftReport>()
                .HasIndex(r => r.ZonaId)
                .HasDatabaseName("IX_ShiftReports_ZonaId");

            // HU-07: Filtrar por guardia y rango de fechas
            modelBuilder.Entity<ShiftReport>()
                .HasIndex(r => r.GuardiaId)
                .HasDatabaseName("IX_ShiftReports_GuardiaId");

            // HU-07: Ordenar y filtrar por fecha de inicio de turno
            modelBuilder.Entity<ShiftReport>()
                .HasIndex(r => r.InicioTurno)
                .HasDatabaseName("IX_ShiftReports_InicioTurno");

            // Índice compuesto para estadísticas por zona + fecha
            modelBuilder.Entity<ShiftReport>()
                .HasIndex(r => new { r.ZonaId, r.InicioTurno })
                .HasDatabaseName("IX_ShiftReports_ZonaId_InicioTurno");
        }
    }
}
