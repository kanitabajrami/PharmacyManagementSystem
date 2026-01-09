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
        public DateTime ExipryDate { get; set; }

        [Required]
        public decimal Price { get; set; }

        [Required]  
        public int Quantity { get; set; }

        //Foreign key
        //each medicine belongs to one supplier
        public int SupplierId { get; set; }
        public Supplier Supplier { get; set; }

        public ICollection<InvoiceItem> InoviceItems { get; set; }      //medicine can appear in many invoices
        public ICollection<PrescriptionMedicine> PrescriptionMedicines { get; set; }        //many-to-many: medicine can be in many prescriptions


    }
}
