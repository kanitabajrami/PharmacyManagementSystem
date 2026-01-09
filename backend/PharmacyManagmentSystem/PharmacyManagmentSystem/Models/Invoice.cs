namespace PharmacyManagmentSystem.Models
{
    public class Invoice
    {
        public int Id { get; set; }
        public DateTime DateCreated { get; set; } = DateTime.Now;

        //Foreign key
        public int UserId { get; set; }
        public User User { get; set; }
        public ICollection<InvoiceItem> InvoiceItems { get; set; }      // One invoice has many invoice items
    }
}
