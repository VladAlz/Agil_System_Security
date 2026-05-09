using Microsoft.IdentityModel.Tokens;
using Ssiu.Api.Dtos;
using Ssiu.Api.Models;
using Ssiu.Api.Repositories;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Ssiu.Api.Services
{
    public interface IAuthService
    {
        Task<LoginResponse?> LoginAsync(LoginRequest request);
        Task<LoginResponse?> RegisterAsync(RegisterRequest request);
    }

    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _config;

        public AuthService(IUserRepository userRepository, IConfiguration config)
        {
            _userRepository = userRepository;
            _config = config;
        }

        public async Task<LoginResponse?> LoginAsync(LoginRequest request)
        {
            var user = await _userRepository.GetByEmailAsync(request.Correo);
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return null;
            }

            var token = GenerateJwt(user);
            return new LoginResponse
            {
                Token = token,
                Usuario = new { user.Id, user.Nombre, user.Correo, user.Rol, user.Facultad }
            };
        }

        public async Task<LoginResponse?> RegisterAsync(RegisterRequest request)
        {
            if (await _userRepository.ExistsAsync(request.Correo))
            {
                return null;
            }

            var user = new User
            {
                Nombre = request.Nombre,
                Correo = request.Correo,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Facultad = request.Facultad,
                Rol = request.Rol
            };

            await _userRepository.AddAsync(user);
            var token = GenerateJwt(user);

            return new LoginResponse
            {
                Token = token,
                Usuario = new { user.Id, user.Nombre, user.Correo, user.Rol, user.Facultad }
            };
        }

        private string GenerateJwt(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? "ClaveSuperSecretaParaDesarrolloDeSsiuCon32CaracteresMinimo"));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Nombre),
                new Claim(ClaimTypes.Role, user.Rol),
                new Claim(ClaimTypes.Email, user.Correo)
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
