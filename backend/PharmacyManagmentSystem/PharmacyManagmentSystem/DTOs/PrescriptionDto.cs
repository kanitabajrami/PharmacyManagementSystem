using System.ComponentModel.DataAnnotations;

namespace PharmacyManagmentSystem.DTOs
{
    public class PrescriptionDto
    {
        [Required]
        public string PatientId { get; set; }
        [Required]
        public string PatientName { get; set; }
        [Required]
        public string DoctorName { get; set; }
        public DateTime DateIssued { get; set; } = DateTime.UtcNow;

        [Required]
        public List<PrescriptionMedicineCreateDto> Medicines { get; set; }
    }

    public class PrescriptionMedicineCreateDto
    {
        [Required]
        public int MedicineId { get; set; }
        [Required]
        public int Quantity { get; set; }
    }
}
