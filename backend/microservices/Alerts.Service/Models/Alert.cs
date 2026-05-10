using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

        // "Activa", "En Camino", "Atendida", "Cancelada"
        public string Estado { get; set; } = "Activa";

        public DateTime FechaHora { get; set; } = DateTime.UtcNow;

        // ─── Datos desnormalizados (obtenidos de otros servicios al crear la alerta) ─
        public string NombreUsuario { get; set; } = string.Empty;
        public string NombreZona    { get; set; } = string.Empty;
        public string ColorZona     { get; set; } = string.Empty;
        public string Facultad      { get; set; } = string.Empty;
        public string CorreoUsuario { get; set; } = string.Empty;
    }
}
