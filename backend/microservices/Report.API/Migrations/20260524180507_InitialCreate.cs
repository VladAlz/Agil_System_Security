using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Report.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ShiftReports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GuardiaId = table.Column<int>(type: "int", nullable: false),
                    NombreGuardia = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ZonaId = table.Column<int>(type: "int", nullable: false),
                    NombreZona = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InicioTurno = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FinTurno = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AlertasAtendidas = table.Column<int>(type: "int", nullable: false),
                    AlertasResueltas = table.Column<int>(type: "int", nullable: false),
                    TiempoRespuestaPromedio = table.Column<double>(type: "float", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Observaciones = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftReports", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ShiftReports_GuardiaId",
                table: "ShiftReports",
                column: "GuardiaId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftReports_InicioTurno",
                table: "ShiftReports",
                column: "InicioTurno");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftReports_ZonaId",
                table: "ShiftReports",
                column: "ZonaId");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftReports_ZonaId_InicioTurno",
                table: "ShiftReports",
                columns: new[] { "ZonaId", "InicioTurno" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ShiftReports");
        }
    }
}
