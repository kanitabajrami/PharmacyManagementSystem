using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PharmacyManagmentSystem.Migrations
{
    /// <inheritdoc />
    public partial class InvoiceUpdatedFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InvoiceItems_Medicines_MedicineId",
                table: "InvoiceItems");

            migrationBuilder.AlterColumn<int>(
                name: "MedicineId",
                table: "InvoiceItems",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddForeignKey(
                name: "FK_InvoiceItems_Medicines_MedicineId",
                table: "InvoiceItems",
                column: "MedicineId",
                principalTable: "Medicines",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InvoiceItems_Medicines_MedicineId",
                table: "InvoiceItems");

            migrationBuilder.AlterColumn<int>(
                name: "MedicineId",
                table: "InvoiceItems",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_InvoiceItems_Medicines_MedicineId",
                table: "InvoiceItems",
                column: "MedicineId",
                principalTable: "Medicines",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
