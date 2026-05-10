using System.ComponentModel.DataAnnotations;

namespace Ssiu.Shared.Models
{
    /// <summary>
    /// Modelo de zona de campus compartido entre todos los microservicios.
    /// </summary>
    public class ZoneModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        public string Color { get; set; } = string.Empty;

        // Coordenadas del polígono representadas como JSON: Array de {lat, lng}
        [Required]
        public string CoordenadasJson { get; set; } = "[]";
    }
}
