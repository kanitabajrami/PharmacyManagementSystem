using System.ComponentModel.DataAnnotations;

namespace PharmacyManagmentSystem.Models
{
    public class Supplier
    {
        public int Id { get; set; }
        [Required] 
        public string Name { get; set; }
       
        public string Phone { get; set; }
        public string Email { get; set; }
        public bool IsActive { get; set; } = true;

        public ICollection<Medicine> Medicines { get; set; }    // One-to-many (one supplier -> many medicines)
    }
}
