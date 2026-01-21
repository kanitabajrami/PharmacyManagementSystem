using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PharmacyManagmentSystem.Migrations
{
    /// <inheritdoc />
    public partial class AddEmbgWithUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EMBG",
                table: "Prescriptions",
                type: "text",
                nullable: false);

            migrationBuilder.CreateIndex(
                name: "IX_Prescriptions_EMBG",
                table: "Prescriptions",
                column: "EMBG",
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Prescriptions_EMBG",
                table: "Prescriptions");

            migrationBuilder.DropColumn(
                name: "EMBG",
                table: "Prescriptions");
        }

    }
}
