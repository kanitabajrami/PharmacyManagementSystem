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
        public int SupplierId { get; set; }
        public Supplier Supplier { get; set; }

        public ICollection<InvoiceItem> InoviceItems { get; set; }
        public ICollection <Prescription> Prescriptions { get; set; }   


    }
}
