using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Ssiu.Api.Data;
using Ssiu.Api.Services;
using Ssiu.Api.Dtos;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Ssiu.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var response = await _authService.LoginAsync(request);
            if (response == null)
            {
                return Unauthorized(new { mensaje = "Correo o contraseña incorrectos" });
            }
            
            return Ok(response);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var response = await _authService.RegisterAsync(request);
            if (response == null)
            {
                return BadRequest(new { mensaje = "El correo ya está registrado" });
            }
            
            return Ok(response);
        }

        [HttpPost("refresh")]
        public IActionResult Refresh([FromBody] TokenRequest request)
        {
            // Simulación de refresh token para Sprint 1
            return Ok(new { token = "new-simulated-token", refreshToken = "new-simulated-refresh" });
        }
    }
}
