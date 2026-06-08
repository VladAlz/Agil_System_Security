using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Alerts.Service.Migrations
{
    /// <inheritdoc />
    public partial class AddObservacionesGuardiaToAlert : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ObservacionesGuardia",
                table: "Alerts",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ObservacionesGuardia",
                table: "Alerts");
        }
    }
}
