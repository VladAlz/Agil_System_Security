using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Alerts.Service.Migrations
{
    /// <inheritdoc />
    public partial class AddAlertIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Estado",
                table: "Alerts",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateIndex(
                name: "IX_Alerts_Estado",
                table: "Alerts",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_Alerts_FechaHora",
                table: "Alerts",
                column: "FechaHora");

            migrationBuilder.CreateIndex(
                name: "IX_Alerts_UsuarioId",
                table: "Alerts",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Alerts_ZonaId",
                table: "Alerts",
                column: "ZonaId");

            migrationBuilder.CreateIndex(
                name: "IX_Alerts_ZonaId_FechaHora",
                table: "Alerts",
                columns: new[] { "ZonaId", "FechaHora" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Alerts_Estado",
                table: "Alerts");

            migrationBuilder.DropIndex(
                name: "IX_Alerts_FechaHora",
                table: "Alerts");

            migrationBuilder.DropIndex(
                name: "IX_Alerts_UsuarioId",
                table: "Alerts");

            migrationBuilder.DropIndex(
                name: "IX_Alerts_ZonaId",
                table: "Alerts");

            migrationBuilder.DropIndex(
                name: "IX_Alerts_ZonaId_FechaHora",
                table: "Alerts");

            migrationBuilder.AlterColumn<string>(
                name: "Estado",
                table: "Alerts",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");
        }
    }
}
