using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PharmacyManagmentSystem.Migrations
{
    /// <inheritdoc />
    public partial class CascadeDeleteMedicineLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PrescriptionMedicines_Medicines_MedicineId",
                table: "PrescriptionMedicines");

            migrationBuilder.AddForeignKey(
                name: "FK_PrescriptionMedicines_Medicines_MedicineId",
                table: "PrescriptionMedicines",
                column: "MedicineId",
                principalTable: "Medicines",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PrescriptionMedicines_Medicines_MedicineId",
                table: "PrescriptionMedicines");

            migrationBuilder.AddForeignKey(
                name: "FK_PrescriptionMedicines_Medicines_MedicineId",
                table: "PrescriptionMedicines",
                column: "MedicineId",
                principalTable: "Medicines",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
