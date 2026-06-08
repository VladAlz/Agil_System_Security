using System.ComponentModel.DataAnnotations;

namespace Alerts.Service.Models
{
    public class Alert
    {
        [Key]
        public int Id { get; set; }

        public int UsuarioId { get; set; }

        public int ZonaId { get; set; }

        public double Lat { get; set; }
        public double Lng { get; set; }

        // ─── Máquina de estados: Activa → Asumida → En Camino → Resuelta → Cerrada ─
        public string Estado { get; set; } = "Activa";

        public DateTime FechaHora { get; set; } = DateTime.UtcNow;

        // ─── Guardia asignado (lo asume quien primero presione "Asumir caso") ──────
        public int? GuardiaAsignadoId { get; set; }
        public string GuardiaAsignadoNombre { get; set; } = string.Empty;

        // ─── Marcas de tiempo para cada transición de estado (útiles para estadísticas) ─
        public DateTime? FechaAsumida  { get; set; }
        public DateTime? FechaEnCamino { get; set; }
        public DateTime? FechaResuelta { get; set; }
        public DateTime? FechaCerrada  { get; set; }

        // ─── Datos desnormalizados (obtenidos de otros servicios al crear la alerta) ─
        public string NombreUsuario { get; set; } = string.Empty;
        public string NombreZona    { get; set; } = string.Empty;
        public string ColorZona     { get; set; } = string.Empty;
        public string Facultad      { get; set; } = string.Empty;
        public string CorreoUsuario { get; set; } = string.Empty;

        // ─── Reporte final del incidente ─────────────────────────────────────────────
        public string? ObservacionesGuardia { get; set; }
    }
}
