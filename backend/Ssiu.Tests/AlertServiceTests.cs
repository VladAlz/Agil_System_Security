using Moq;
using Xunit;
using Ssiu.Api.Services;
using Ssiu.Api.Repositories;
using Ssiu.Api.Models;
using Microsoft.AspNetCore.SignalR;
using Ssiu.Api.Hubs;

namespace Ssiu.Tests
{
    public class AlertServiceTests
    {
        private readonly Mock<IAlertRepository> _alertRepoMock;
        private readonly Mock<IZoneService> _zoneServiceMock;
        private readonly Mock<IHubContext<AlertHub>> _hubContextMock;
        private readonly Mock<IHubClients> _clientsMock;
        private readonly Mock<IClientProxy> _clientProxyMock;
        private readonly AlertService _alertService;

        public AlertServiceTests()
        {
            _alertRepoMock = new Mock<IAlertRepository>();
            _zoneServiceMock = new Mock<IZoneService>();
            _hubContextMock = new Mock<IHubContext<AlertHub>>();
            _clientsMock = new Mock<IHubClients>();
            _clientProxyMock = new Mock<IClientProxy>();

            // Setup SignalR Mocks
            _hubContextMock.Setup(h => h.Clients).Returns(_clientsMock.Object);
            _clientsMock.Setup(c => c.Group(It.IsAny<string>())).Returns(_clientProxyMock.Object);

            _alertService = new AlertService(
                _alertRepoMock.Object, 
                _zoneServiceMock.Object, 
                _hubContextMock.Object
            );
        }

        [Fact]
        public async Task CreateAlertAsync_Should_AssignZone_And_NotifySignalR()
        {
            // Arrange
            int userId = 3;
            double lat = -1.2675;
            double lng = -78.6245;
            var mockZone = new Zone { Id = 2, Nombre = "Zona Test" };
            
            _zoneServiceMock.Setup(z => z.AssignZoneAsync(lat, lng))
                .ReturnsAsync(mockZone);

            _alertRepoMock.Setup(r => r.AddAsync(It.IsAny<Alert>()))
                .Callback<Alert>(a => a.Id = 1)
                .ReturnsAsync((Alert a) => a);

            _alertRepoMock.Setup(r => r.GetByIdWithDetailsAsync(1))
                .ReturnsAsync(new Alert { Id = 1, UsuarioId = userId, ZonaId = 2 });

            // Act
            var result = await _alertService.CreateAlertAsync(userId, lat, lng);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(userId, result.UsuarioId);
            Assert.Equal(2, result.ZonaId);
            
            // Verify Zone Assignment was called
            _zoneServiceMock.Verify(z => z.AssignZoneAsync(lat, lng), Times.Once);
            
            // Verify Repository Add was called
            _alertRepoMock.Verify(r => r.AddAsync(It.IsAny<Alert>()), Times.Once);

            // Verify SignalR groups were notified
            _clientsMock.Verify(c => c.Group("zona-2"), Times.Once);
            _clientsMock.Verify(c => c.Group("admins"), Times.Once);
        }

        [Fact]
        public async Task CreateAlertAsync_Should_FallbackToZone1_If_NoZoneFound()
        {
            // Arrange
            _zoneServiceMock.Setup(z => z.AssignZoneAsync(It.IsAny<double>(), It.IsAny<double>()))
                .ReturnsAsync((Zone?)null);

            _alertRepoMock.Setup(r => r.GetByIdWithDetailsAsync(It.IsAny<int>()))
                .ReturnsAsync(new Alert { Id = 1, ZonaId = 1 });

            // Act
            var result = await _alertService.CreateAlertAsync(1, 0, 0);

            // Assert
            Assert.Equal(1, result.ZonaId);
        }
    }
}
