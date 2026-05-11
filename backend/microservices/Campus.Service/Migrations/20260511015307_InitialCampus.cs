using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Campus.Service.Migrations
{
    /// <inheritdoc />
    public partial class InitialCampus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Zones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Color = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CoordenadasJson = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Zones", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Guards",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    ZonaId = table.Column<int>(type: "int", nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NombreGuardia = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Guards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Guards_Zones_ZonaId",
                        column: x => x.ZonaId,
                        principalTable: "Zones",
                        principalColumn: "Id");
                });

            migrationBuilder.InsertData(
                table: "Zones",
                columns: new[] { "Id", "Color", "CoordenadasJson", "Nombre" },
                values: new object[,]
                {
                    { 1, "Azul", "[{\"lat\":-1.266403, \"lng\":-78.625312}, {\"lat\":-1.267693, \"lng\":-78.624075}, {\"lat\":-1.266470, \"lng\":-78.624768}]", "Zona 1" },
                    { 2, "Verde", "[{\"lat\":-1.267714, \"lng\":-78.625654}, {\"lat\":-1.268798, \"lng\":-78.624850}, {\"lat\":-1.268746, \"lng\":-78.625922}]", "Zona 2" },
                    { 3, "Naranja", "[{\"lat\":-1.268034, \"lng\":-78.623935}, {\"lat\":-1.266572, \"lng\":-78.623173}, {\"lat\":-1.266471, \"lng\":-78.624359}]", "Zona 3" },
                    { 4, "Rojo", "[{\"lat\":-1.268747, \"lng\":-78.625948}, {\"lat\":-1.270194, \"lng\":-78.622425}, {\"lat\":-1.270364, \"lng\":-78.626346}]", "Zona 4" }
                });

            migrationBuilder.InsertData(
                table: "Guards",
                columns: new[] { "Id", "Estado", "NombreGuardia", "UsuarioId", "ZonaId" },
                values: new object[] { 1, "En Servicio", "Guardia Pedro", 2, 1 });

            migrationBuilder.CreateIndex(
                name: "IX_Guards_ZonaId",
                table: "Guards",
                column: "ZonaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Guards");

            migrationBuilder.DropTable(
                name: "Zones");
        }
    }
}
