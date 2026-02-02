using PharmacyManagmentSystem.DTOs;
using PharmacyManagmentSystem.Models;

namespace PharmacyManagmentSystem.Helpers
{
    public static class InvoiceMapper
    {
        public static InvoiceResponseDto ToResponseDto(Invoice inv) => new InvoiceResponseDto
        {
            Id = inv.Id,
            DateCreated = inv.DateCreated,
            TotalAmount = inv.TotalAmount,

            UserId = inv.UserId,
            UserName = inv.User != null ? (inv.User.UserName ?? "") : "",

            PrescriptionId = inv.PrescriptionId,

            Items = inv.InvoiceItems.Select(ToItemResponseDto).ToList()
        };

        public static InvoiceItemResponseDto ToItemResponseDto(InvoiceItem item) => new InvoiceItemResponseDto
        {
            Id = item.Id,
            MedicineId = item.MedicineId ?? null,
            MedicineName = item.Medicine != null ? (item.Medicine.Name ?? "") : "",

            Quantity = item.Quantity,
            UnitPrice = item.UnitPrice,
            LineTotal = item.LineTotal
        };

        // for lightweight invoice list endpoint
        public static InvoiceListItemDto ToListItemDto(Invoice inv) => new InvoiceListItemDto
        {
            Id = inv.Id,
            DateCreated = inv.DateCreated,
            TotalAmount = inv.TotalAmount,
            UserId = inv.UserId,
            UserName = inv.User != null ? (inv.User.UserName ?? "") : "",
            PrescriptionId = inv.PrescriptionId,
            ItemsCount = inv.InvoiceItems?.Count ?? 0
        };
    }
}
