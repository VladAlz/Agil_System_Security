using System.ComponentModel.DataAnnotations;

namespace Report.API.Models
{
    /// <summary>
    /// Registro de turno de guardia (HU-08).
    /// Un turno cubre el ciclo completo: inicio → patrullaje → fin de guardia.
    /// </summary>
    public class ShiftReport
    {
        [Key]
        public int Id { get; set; }

        // ─── Identidad del guardia ─────────────────────────────────────────────
        public int    GuardiaId     { get; set; }
        public string NombreGuardia { get; set; } = string.Empty;

        // ─── Zona patrullada ───────────────────────────────────────────────────
        public int    ZonaId     { get; set; }
        public string NombreZona { get; set; } = string.Empty;

        // ─── Tiempos del turno ─────────────────────────────────────────────────
        public DateTime InicioTurno { get; set; } = DateTime.UtcNow;
        public DateTime? FinTurno   { get; set; }

        // ─── Métricas del turno ────────────────────────────────────────────────
        /// <summary>Número de alertas atendidas durante el turno.</summary>
        public int AlertasAtendidas { get; set; } = 0;

        /// <summary>Número de alertas resueltas durante el turno.</summary>
        public int AlertasResueltas { get; set; } = 0;

        /// <summary>
        /// Tiempo promedio de respuesta en minutos durante este turno.
        /// Se calcula como promedio de (FechaAsumida - FechaHora) de las alertas.
        /// </summary>
        public double TiempoRespuestaPromedio { get; set; } = 0;

        // ─── Estado del turno ──────────────────────────────────────────────────
        /// <summary>Activo | Cerrado</summary>
        public string Estado { get; set; } = "Activo";

        // ─── Observaciones ────────────────────────────────────────────────────
        public string Observaciones { get; set; } = string.Empty;

        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    }
}
