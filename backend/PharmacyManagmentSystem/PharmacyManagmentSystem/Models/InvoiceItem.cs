using System.ComponentModel.DataAnnotations;

namespace PharmacyManagmentSystem.Models
{
    public class InvoiceItem
    {
        public int Id { get; set; }

        public int InvoiceId { get; set; }
        public Invoice? Invoice { get; set; }

        public int MedicineId { get; set; }
        public Medicine? Medicine { get; set; }

        [Required]
        public int Quantity { get; set; }

        [Required]
        public decimal UnitPrice { get; set; }   // price per 1 unit at sale time

        public decimal LineTotal { get; set; }   // Quantity * UnitPrice
    }
}
