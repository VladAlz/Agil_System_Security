using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Identity.Service.Models
{
    /// <summary>
    /// Representa un contacto de confianza registrado por un usuario para recibir
    /// notificaciones cuando dicho usuario activa una alerta de emergencia.
    /// Límite: máximo 5 contactos por usuario.
    /// </summary>
    public class TrustContact
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UsuarioId { get; set; }

        [Required]
        [MaxLength(120)]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        [MaxLength(254)]
        [EmailAddress]
        public string Correo { get; set; } = string.Empty;

        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

        // Navegación
        [ForeignKey(nameof(UsuarioId))]
        public User? Usuario { get; set; }
    }
}
