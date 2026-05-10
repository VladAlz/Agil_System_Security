using System.ComponentModel.DataAnnotations;

namespace Ssiu.Shared.Models
{
    /// <summary>
    /// Modelo de alerta compartido entre todos los microservicios.
    /// </summary>
    public class AlertModel
    {
        [Key]
        public int Id { get; set; }

        public int UsuarioId { get; set; }

        public int ZonaId { get; set; }

        public double Lat { get; set; }
        public double Lng { get; set; }

        // "Activa", "En Camino", "Atendida", "Cancelada"
        public string Estado { get; set; } = "Activa";

        public DateTime FechaHora { get; set; } = DateTime.UtcNow;
    }
}
