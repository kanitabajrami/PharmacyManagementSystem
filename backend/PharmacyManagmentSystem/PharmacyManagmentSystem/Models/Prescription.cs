using System.ComponentModel.DataAnnotations;

namespace PharmacyManagmentSystem.Models
{
    public enum PrescriptionStatus
    {
        Pending,    // Medicine not available
        Ready,      // Medicine available
        Dispensed   // Patient already recieved the medicine
    }
    public class Prescription
    {
        public int Id { get; set; }

        [Required]
        [RegularExpression(@"^\d{13}$", ErrorMessage = "EMBG must be exactly 13 digits.")]
        public string EMBG { get; set; }

        [Required]
        public string PatientName { get; set; }

        [Required]
        public string DoctorName { get; set; }

        [Required]

        public DateTime DateIssued { get; set; } = DateTime.UtcNow;
        public PrescriptionStatus Status { get; set; } = PrescriptionStatus.Pending;

        public ICollection<PrescriptionMedicine> PrescriptionMedicines { get; set; }     // Many-to-many: prescription contains multiple medicines


    }
}
