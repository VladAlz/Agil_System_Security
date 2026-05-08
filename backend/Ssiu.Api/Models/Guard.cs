using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ssiu.Api.Models
{
    public class Guard
    {
        [Key]
        public int Id { get; set; }
        
        public int UsuarioId { get; set; }
        
        [ForeignKey("UsuarioId")]
        public User? Usuario { get; set; }
        
        public int? ZonaId { get; set; }
        
        [ForeignKey("ZonaId")]
        public Zone? Zona { get; set; }
        
        // "En Servicio" o "Descansando"
        [Required]
        public string Estado { get; set; } = "Descansando";
    }
}
