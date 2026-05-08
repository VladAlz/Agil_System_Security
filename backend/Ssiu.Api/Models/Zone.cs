using System;
using System.ComponentModel.DataAnnotations;

namespace Ssiu.Api.Models
{
    public class Zone
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string Nombre { get; set; } = string.Empty;
        
        [Required]
        public string Color { get; set; } = string.Empty;
        
        // Coordenadas representadas como JSON para simplificar (Array de {lat, lng})
        [Required]
        public string CoordenadasJson { get; set; } = "[]";
    }
}
