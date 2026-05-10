using Alerts.Service.Models;
using Microsoft.EntityFrameworkCore;

namespace Alerts.Service.Data
{
    public class AlertsDbContext : DbContext
    {
        public AlertsDbContext(DbContextOptions<AlertsDbContext> options) : base(options) { }

        public DbSet<Alert> Alerts { get; set; }
    }
}
