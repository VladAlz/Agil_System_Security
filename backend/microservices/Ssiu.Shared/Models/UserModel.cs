using System.ComponentModel.DataAnnotations;

namespace Ssiu.Shared.Models
{
    /// <summary>
    /// Modelo de usuario compartido entre todos los microservicios.
    /// </summary>
    public class UserModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        public string Correo { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public string Facultad { get; set; } = string.Empty;

        [Required]
        public string Rol { get; set; } = string.Empty; // "Estudiante", "Guardia", "Administrador"
    }
}
