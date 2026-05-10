using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Campus.Service.Models
{
    /// <summary>Guardia — almacenado en Campus.Service para gestionar disponibilidad y zona asignada.</summary>
    public class Guard
    {
        [Key]
        public int Id { get; set; }

        public int UsuarioId { get; set; }

        public int? ZonaId { get; set; }

        [ForeignKey("ZonaId")]
        public Zone? Zona { get; set; }

        // "En Servicio" o "Descansando"
        [Required]
        public string Estado { get; set; } = "Descansando";

        // Nombre del guardia (desnormalizado desde Identity.Service)
        public string NombreGuardia { get; set; } = string.Empty;
    }
}
