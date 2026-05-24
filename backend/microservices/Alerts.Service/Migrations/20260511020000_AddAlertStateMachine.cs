using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Alerts.Service.Migrations
{
    /// <inheritdoc />
    public partial class AddAlertStateMachine : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GuardiaAsignadoId",
                table: "Alerts",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GuardiaAsignadoNombre",
                table: "Alerts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaAsumida",
                table: "Alerts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaEnCamino",
                table: "Alerts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaResuelta",
                table: "Alerts",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaCerrada",
                table: "Alerts",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GuardiaAsignadoId",
                table: "Alerts");

            migrationBuilder.DropColumn(
                name: "GuardiaAsignadoNombre",
                table: "Alerts");

            migrationBuilder.DropColumn(
                name: "FechaAsumida",
                table: "Alerts");

            migrationBuilder.DropColumn(
                name: "FechaEnCamino",
                table: "Alerts");

            migrationBuilder.DropColumn(
                name: "FechaResuelta",
                table: "Alerts");

            migrationBuilder.DropColumn(
                name: "FechaCerrada",
                table: "Alerts");
        }
    }
}
