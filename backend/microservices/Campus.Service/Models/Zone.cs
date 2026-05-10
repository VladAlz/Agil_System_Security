using System.ComponentModel.DataAnnotations;

namespace Campus.Service.Models
{
    public class Zone
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        public string Color { get; set; } = string.Empty;

        // Coordenadas representadas como JSON: Array de {lat, lng}
        [Required]
        public string CoordenadasJson { get; set; } = "[]";
    }
}
