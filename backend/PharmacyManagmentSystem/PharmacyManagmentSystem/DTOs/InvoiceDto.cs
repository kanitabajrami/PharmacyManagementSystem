using System.ComponentModel.DataAnnotations;

namespace PharmacyManagmentSystem.DTOs
{
        // ========= POST (Create Invoice) =========
        public class CreateInvoiceDto
        {
            public string? CustomerName { get; set; }

            public int? PrescriptionId { get; set; }

            [Required]
            [MinLength(1)]
            public List<CreateInvoiceItemDto> Items { get; set; } = new();
        }

        public class CreateInvoiceItemDto
        {
            [Required]
            public int MedicineId { get; set; }

            [Range(1, int.MaxValue)]
            public int Quantity { get; set; }
        }

        // ========= GET (Invoice Details) =========
        public class InvoiceResponseDto
        {
            public int Id { get; set; }
            public DateTime DateCreated { get; set; }

            public string? CustomerName { get; set; }
            public decimal TotalAmount { get; set; }

            public string UserId { get; set; } = default!;
            public string UserName { get; set; } = "";

            public int? PrescriptionId { get; set; }

            public List<InvoiceItemResponseDto> Items { get; set; } = new();
        }

        public class InvoiceItemResponseDto
        {
            public int Id { get; set; }

            public int MedicineId { get; set; }
            public string MedicineName { get; set; } = "";

            public int Quantity { get; set; }
            public decimal UnitPrice { get; set; }
            public decimal LineTotal { get; set; }
        }

        // ========= GET (Invoice List - smaller payload) =========
        public class InvoiceListItemDto
        {
            public int Id { get; set; }
            public DateTime DateCreated { get; set; }

            public string? CustomerName { get; set; }
            public decimal TotalAmount { get; set; }

            public string UserId { get; set; } = default!;
            public string UserName { get; set; } = "";

            public int? PrescriptionId { get; set; }
            public int ItemsCount { get; set; }
        }
    }

