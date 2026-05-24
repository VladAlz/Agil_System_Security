namespace Ssiu.Shared.Dtos
{
    // ─── Auth DTOs ────────────────────────────────────────────────────────────

    public class LoginRequest
    {
        public string Correo { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginResponse
    {
        public string Token { get; set; } = string.Empty;
        public object Usuario { get; set; } = null!;
    }

    public class RegisterRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Facultad { get; set; } = string.Empty;
        public string? Rol { get; set; } = "Estudiante";
    }

    public class RegisterGuardRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? Facultad { get; set; }
    }

    // ─── Alert DTOs ───────────────────────────────────────────────────────────

    public class CreateAlertDto
    {
        public int UsuarioId { get; set; }
        public double Lat { get; set; }
        public double Lng { get; set; }
    }

    public class UpdateAlertStatusDto
    {
        public string Estado { get; set; } = string.Empty;
    }

    /// <summary>DTO para que un guardia asuma una alerta (HU-09).</summary>
    public class AssumeAlertDto
    {
        public int GuardiaId { get; set; }
    }

    // ─── Guard DTOs ───────────────────────────────────────────────────────────

    public class UpdateGuardStatusDto
    {
        public string Estado { get; set; } = string.Empty;
    }

    // ─── Inter-Service DTOs (usados en comunicación HTTP entre microservicios) ─

    /// <summary>
    /// DTO mínimo que Identity.Service expone para que otros servicios validen un usuario.
    /// </summary>
    public class UserValidationDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;
        public string Facultad { get; set; } = string.Empty;
        public bool Existe { get; set; }
    }
}
