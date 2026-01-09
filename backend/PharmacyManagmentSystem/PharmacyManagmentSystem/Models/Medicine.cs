using System.ComponentModel.DataAnnotations;

namespace PharmacyManagmentSystem.Models
{
    public class Medicine
    {
        public int Id { get; set; }

        [Required]
        public  string Name { get; set; }

        public string Category {  get; set; }

        [Required]
        public string BatchNumber { get; set; } 

        [Required]
        public DateTime ExpiryDate { get; set; }

        [Required]
        public decimal Price { get; set; }

        [Required]  
        public int Quantity { get; set; }

        // Foreign key
        // Each medicine belongs to one supplier
        public int SupplierId { get; set; }
        public Supplier Supplier { get; set; }

        public ICollection<InvoiceItem> InvoiceItems { get; set; }      // Medicine can appear in many invoices
        public ICollection<PrescriptionMedicine> PrescriptionMedicines { get; set; }        // Many-to-many: medicine can be in many prescriptions


    }
}
