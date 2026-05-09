namespace Ssiu.Api.Dtos
{
    public class RegisterGuardRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Facultad { get; set; } = string.Empty;
    }
}