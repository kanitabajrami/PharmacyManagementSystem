using System.ComponentModel.DataAnnotations;

namespace PharmacyManagmentSystem.Models
{
    public class Supplier
    {
        public int Id { get; set; }
        [Required] 
        public string Name { get; set; }
        [Required]
        public string ContactInfo { get; set; }
        public ICollection<Medicine> Medicines { get; set; }    //one to many
    }
}
