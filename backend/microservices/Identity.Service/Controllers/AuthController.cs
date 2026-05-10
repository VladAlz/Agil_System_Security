using Identity.Service.Data;
using Identity.Service.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Ssiu.Shared.Dtos;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Identity.Service.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IdentityDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(IdentityDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        /// <summary>POST api/auth/login — Valida credenciales y devuelve JWT.</summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var correo = request.Correo.Trim().ToLower();

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Correo.ToLower() == correo);

            if (user == null || user.PasswordHash != request.Password)
                return Unauthorized(new { mensaje = "Correo o contraseña incorrectos" });

            var token = GenerateJwt(user);

            // Incluir datos extra de guardia en la respuesta si aplica
            var guard = await _context.Guards.FirstOrDefaultAsync(g => g.UsuarioId == user.Id);

            return Ok(new LoginResponse
            {
                Token = token,
                Usuario = new
                {
                    user.Id,
                    user.Nombre,
                    user.Correo,
                    user.Rol,
                    user.Facultad,
                    GuardId = guard?.Id,
                    ZonaId = guard?.ZonaId,
                    Estado = guard?.Estado
                }
            });
        }

        /// <summary>POST api/auth/register — Registra un nuevo estudiante.</summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var correo = request.Correo.Trim().ToLower();

            if (await _context.Users.AnyAsync(u => u.Correo.ToLower() == correo))
                return BadRequest(new { mensaje = "El correo ya está registrado" });

            var user = new User
            {
                Nombre       = request.Nombre.Trim(),
                Correo       = correo,
                Rol          = request.Rol ?? "Estudiante",
                Facultad     = request.Facultad?.Trim() ?? "General",
                PasswordHash = request.Password  // Sin hash — modo desarrollo
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Usuario registrado correctamente" });
        }

        /// <summary>POST api/auth/register-guard — Registra un nuevo guardia.</summary>
        [HttpPost("register-guard")]
        public async Task<IActionResult> RegisterGuard([FromBody] RegisterGuardRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre) ||
                string.IsNullOrWhiteSpace(request.Correo) ||
                string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { mensaje = "Nombre, correo y contraseña son obligatorios" });

            var correo = request.Correo.Trim().ToLower();

            if (await _context.Users.AnyAsync(u => u.Correo.ToLower() == correo))
                return BadRequest(new { mensaje = "Ya existe un usuario con ese correo" });

            var nuevoUsuario = new User
            {
                Nombre       = request.Nombre.Trim(),
                Correo       = correo,
                Rol          = "Guardia",
                Facultad     = string.IsNullOrWhiteSpace(request.Facultad) ? "General" : request.Facultad.Trim(),
                PasswordHash = request.Password  // Sin hash — modo desarrollo
            };

            _context.Users.Add(nuevoUsuario);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje  = "Guardia registrado correctamente",
                usuario  = new
                {
                    nuevoUsuario.Id,
                    nuevoUsuario.Nombre,
                    nuevoUsuario.Correo,
                    nuevoUsuario.Rol,
                    nuevoUsuario.Facultad
                }
            });
        }

        // ─── Inter-service endpoint ────────────────────────────────────────────

        /// <summary>GET api/auth/validate/{id} — Valida si un usuario existe (llamado por Alerts.Service).</summary>
        [HttpGet("validate/{id:int}")]
        public async Task<IActionResult> ValidateUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return Ok(new UserValidationDto { Id = id, Existe = false });

            return Ok(new UserValidationDto
            {
                Id       = user.Id,
                Nombre = user.Nombre,
                Correo = user.Correo,
                Rol    = user.Rol,
                Facultad = user.Facultad,
                Existe = true
            });
        }

        // ─── Helpers ──────────────────────────────────────────────────────────

        private string GenerateJwt(User user)
        {
            var securityKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    _config["Jwt:Key"] ?? "ClaveSuperSecretaParaDesarrolloDeSsiuCon32CaracteresMinimo"
                )
            );

            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email,          user.Correo),
                new Claim(ClaimTypes.Role,           user.Rol),
                new Claim("nombre",                  user.Nombre)
            };

            var token = new JwtSecurityToken(
                issuer:            _config["Jwt:Issuer"],
                audience:          _config["Jwt:Audience"],
                claims:            claims,
                expires:           DateTime.UtcNow.AddHours(2),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
