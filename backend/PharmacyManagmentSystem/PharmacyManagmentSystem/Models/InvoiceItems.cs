using System.ComponentModel.DataAnnotations;

namespace PharmacyManagmentSystem.Models
{
    public class InvoiceItems
    {
        public int Id { get; set; }
        public int InvoiceId { get; set; }
        public Invoice Invoice { get; set; }

        public int MedicineId { get; set; }
        public Medicine Medicine { get; set; }

        [Required]
        public int Quantity { get; set; }
        [Required]
        public decimal Price { get; set; }
    }
}
