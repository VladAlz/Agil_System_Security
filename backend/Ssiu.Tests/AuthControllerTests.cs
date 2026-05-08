using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Ssiu.Api.Controllers;
using Ssiu.Api.Data;
using Ssiu.Api.Dtos;
using Ssiu.Api.Models;
using System.Threading.Tasks;
using Xunit;

namespace Ssiu.Tests
{
    public class AuthControllerTests
    {
        private async Task<AppDbContext> GetDatabaseContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: System.Guid.NewGuid().ToString())
                .Options;
            
            var databaseContext = new AppDbContext(options);
            databaseContext.Database.EnsureCreated();
            
            // Clean up and setup
            if (await databaseContext.Users.CountAsync() <= 0)
            {
                var hasher = new BCrypt.Net.BCrypt();
                var passwordHash = BCrypt.Net.BCrypt.HashPassword("password123");
                
                databaseContext.Users.Add(new User 
                { 
                    Id = 10, 
                    Nombre = "Test User", 
                    Correo = "test@uta.edu.ec", 
                    PasswordHash = passwordHash, 
                    Rol = "Estudiante" 
                });
                await databaseContext.SaveChangesAsync();
            }
            return databaseContext;
        }

        [Fact]
        public async Task Login_WithValidCredentials_ReturnsOk()
        {
            // Arrange
            var dbContext = await GetDatabaseContext();
            
            var mockConfig = new Mock<IConfiguration>();
            mockConfig.Setup(c => c["Jwt:Key"]).Returns("ClaveSuperSecretaParaDesarrolloDeSsiuCon32CaracteresMinimo");
            mockConfig.Setup(c => c["Jwt:Issuer"]).Returns("SsiuApi");
            mockConfig.Setup(c => c["Jwt:Audience"]).Returns("SsiuApp");

            var controller = new AuthController(dbContext, mockConfig.Object);
            var request = new LoginRequest { Correo = "admin@uta.edu.ec", Password = "admin123" };

            // Act
            var result = await controller.Login(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<LoginResponse>(okResult.Value);
            Assert.NotEmpty(response.Token);
        }

        [Fact]
        public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
        {
            // Arrange
            var dbContext = await GetDatabaseContext();
            var mockConfig = new Mock<IConfiguration>();
            var controller = new AuthController(dbContext, mockConfig.Object);
            var request = new LoginRequest { Correo = "test@uta.edu.ec", Password = "wrongpassword" };

            // Act
            var result = await controller.Login(request);

            // Assert
            var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
        }
        
        [Fact]
        public async Task Login_WithUnknownEmail_ReturnsUnauthorized()
        {
            // Arrange
            var dbContext = await GetDatabaseContext();
            var mockConfig = new Mock<IConfiguration>();
            var controller = new AuthController(dbContext, mockConfig.Object);
            var request = new LoginRequest { Correo = "nobody@uta.edu.ec", Password = "password123" };

            // Act
            var result = await controller.Login(request);

            // Assert
            var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result);
        }
    }
}
