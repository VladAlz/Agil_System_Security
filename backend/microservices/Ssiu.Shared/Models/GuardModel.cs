using System.ComponentModel.DataAnnotations;

namespace Ssiu.Shared.Models
{
    /// <summary>
    /// Modelo de guardia compartido entre todos los microservicios.
    /// </summary>
    public class GuardModel
    {
        [Key]
        public int Id { get; set; }

        public int UsuarioId { get; set; }

        public int? ZonaId { get; set; }

        // "En Servicio" o "Descansando"
        [Required]
        public string Estado { get; set; } = "Descansando";
    }
}
