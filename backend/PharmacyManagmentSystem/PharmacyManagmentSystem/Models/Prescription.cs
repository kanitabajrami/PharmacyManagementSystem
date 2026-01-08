using System.ComponentModel.DataAnnotations;

namespace PharmacyManagmentSystem.Models
{
    public class Prescription
    {
        public int Id { get; set; }

        [Required]
        public string PatientName { get; set; }

        [Required]
        public string DoctorName { get; set; }

        [Required]

        public DateTime DateIssued { get; set; }=DateTime.Now;

        public ICollection<Medicine> Medicines { get; set; } //many-to-many


    }
}
