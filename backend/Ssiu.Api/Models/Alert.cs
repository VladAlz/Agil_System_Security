using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ssiu.Api.Models
{
    public class Alert
    {
        [Key]
        public int Id { get; set; }
        
        public int UsuarioId { get; set; }
        
        [ForeignKey("UsuarioId")]
        public User? Usuario { get; set; }
        
        public int ZonaId { get; set; }
        
        [ForeignKey("ZonaId")]
        public Zone? Zona { get; set; }
        
        public double Lat { get; set; }
        public double Lng { get; set; }
        
        // "Activa", "Atendida", "Cancelada"
        public string Estado { get; set; } = "Activa";
        
        public DateTime FechaHora { get; set; } = DateTime.UtcNow;
    }
}
