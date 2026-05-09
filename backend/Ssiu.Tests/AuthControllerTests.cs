using Microsoft.AspNetCore.Mvc;
using Moq;
using Ssiu.Api.Controllers;
using Ssiu.Api.Dtos;
using Ssiu.Api.Services;
using System.Threading.Tasks;
using Xunit;

namespace Ssiu.Tests
{
    public class AuthControllerTests
    {
        private readonly Mock<IAuthService> _authServiceMock;
        private readonly AuthController _controller;

        public AuthControllerTests()
        {
            _authServiceMock = new Mock<IAuthService>();
            _controller = new AuthController(_authServiceMock.Object);
        }

        [Fact]
        public async Task Login_WithValidCredentials_ReturnsOk()
        {
            // Arrange
            var request = new LoginRequest { Correo = "test@uta.edu.ec", Password = "password123" };
            var response = new LoginResponse { Token = "mock-token", Usuario = new { Nombre = "Test" } };
            
            _authServiceMock.Setup(s => s.LoginAsync(request))
                .ReturnsAsync(response);

            // Act
            var result = await _controller.Login(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(response, okResult.Value);
        }

        [Fact]
        public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
        {
            // Arrange
            var request = new LoginRequest { Correo = "test@uta.edu.ec", Password = "wrong" };
            
            _authServiceMock.Setup(s => s.LoginAsync(request))
                .ReturnsAsync((LoginResponse?)null);

            // Act
            var result = await _controller.Login(request);

            // Assert
            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        [Fact]
        public async Task Register_ReturnsOk()
        {
            // Arrange
            var request = new RegisterRequest { Nombre = "Nuevo", Correo = "nuevo@uta.edu.ec", Password = "123", Rol = "Estudiante" };
            var response = new LoginResponse { Token = "token", Usuario = new { Nombre = "Nuevo" } };
            
            _authServiceMock.Setup(s => s.RegisterAsync(request))
                .ReturnsAsync(response);

            // Act
            var result = await _controller.Register(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Equal(response, okResult.Value);
        }
    }
}
