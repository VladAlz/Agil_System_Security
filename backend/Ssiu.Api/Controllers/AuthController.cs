using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Ssiu.Api.Data;
using Ssiu.Api.Dtos;
using Ssiu.Api.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Ssiu.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var correo = request.Correo.Trim().ToLower();

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Correo.ToLower() == correo);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Unauthorized(new { mensaje = "Correo o contraseña incorrectos" });
            }

            var token = GenerateJwt(user);

            // Buscar si es guardia para devolver detalles extra necesarios por la Guard App
            var guard = await _context.Guards
                .Include(g => g.Zona)
                .FirstOrDefaultAsync(g => g.UsuarioId == user.Id);

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
                    GuardId = guard != null ? guard.Id : (int?)null,
                    ZonaId = guard != null ? guard.ZonaId : (int?)null,
                    ZonaNombre = guard != null && guard.Zona != null ? guard.Zona.Nombre : null,
                    ZonaColor = guard != null && guard.Zona != null ? guard.Zona.Color : null,
                    Estado = guard != null ? guard.Estado : null
                }
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var correo = request.Correo.Trim().ToLower();

            var existeUsuario = await _context.Users
                .AnyAsync(u => u.Correo.ToLower() == correo);

            if (existeUsuario)
            {
                return BadRequest(new { mensaje = "El correo ya está registrado" });
            }

            var user = new User
            {
                Nombre = request.Nombre.Trim(),
                Correo = correo,
                Rol = request.Rol ?? "Estudiante",
                Facultad = request.Facultad?.Trim() ?? "General",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Usuario registrado correctamente" });
        }

        [HttpPost("register-guard")]
        public async Task<IActionResult> RegisterGuard([FromBody] RegisterGuardRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre) ||
                string.IsNullOrWhiteSpace(request.Correo) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { mensaje = "Nombre, correo y contraseña son obligatorios" });
            }

            var correo = request.Correo.Trim().ToLower();

            var existeUsuario = await _context.Users
                .AnyAsync(u => u.Correo.ToLower() == correo);

            if (existeUsuario)
            {
                return BadRequest(new { mensaje = "Ya existe un usuario con ese correo" });
            }

            var nuevoUsuario = new User
            {
                Nombre = request.Nombre.Trim(),
                Correo = correo,
                Rol = "Guardia",
                Facultad = string.IsNullOrWhiteSpace(request.Facultad)
                    ? "General"
                    : request.Facultad.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
            };

            _context.Users.Add(nuevoUsuario);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Guardia registrado correctamente",
                usuario = new
                {
                    nuevoUsuario.Id,
                    nuevoUsuario.Nombre,
                    nuevoUsuario.Correo,
                    nuevoUsuario.Rol,
                    nuevoUsuario.Facultad
                }
            });
        }

        private string GenerateJwt(User user)
        {
            var securityKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    _config["Jwt:Key"] 
                    ?? "ClaveSuperSecretaParaDesarrolloDeSsiuCon32CaracteresMinimo"
                )
            );

            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Correo),
                new Claim(ClaimTypes.Role, user.Rol),
                new Claim("nombre", user.Nombre)
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
