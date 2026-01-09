using System.ComponentModel.DataAnnotations;

namespace PharmacyManagmentSystem.Models
{
    public class InvoiceItem
    {
        public int Id { get; set; }

        //many inovice items belong to one invoice
        public int InvoiceId { get; set; }
        public Invoice Invoice { get; set; }

        //many inovice items reference one medicine 
        public int MedicineId { get; set; }
        public Medicine Medicine { get; set; }      

        [Required]
        public int Quantity { get; set; }
        [Required]
        public decimal Price { get; set; }
    }
}
