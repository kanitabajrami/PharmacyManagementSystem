using PharmacyManagmentSystem.Models;
using System.ComponentModel.DataAnnotations;

public class Invoice
{
    public int Id { get; set; }
    public DateTime DateCreated { get; set; } = DateTime.UtcNow;

    public string? CustomerName { get; set; }

    public decimal TotalAmount { get; set; }

    public ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();


    [Required]
    public int UserId { get; set; } 
    public User User { get; set; } 

    // Optional: link prescription
    public int? PrescriptionId { get; set; }
    public Prescription? Prescription { get; set; }
}
