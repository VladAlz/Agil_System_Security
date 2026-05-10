using System.ComponentModel.DataAnnotations;

namespace Identity.Service.Models
{
    /// <summary>
    /// Tabla local de guardias en Identity.Service.
    /// Replica mínima para el login: no contiene polígonos ni datos de Campus.
    /// </summary>
    public class Guard
    {
        [Key]
        public int Id { get; set; }

        public int UsuarioId { get; set; }

        public int? ZonaId { get; set; }

        [Required]
        public string Estado { get; set; } = "Descansando";
    }
}
