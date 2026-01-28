using System.ComponentModel.DataAnnotations;

namespace PharmacyManagmentSystem.DTOs
{
    public class PrescriptionDto
    {
        [Required]
        [RegularExpression(@"^\d{13}$", ErrorMessage = "EMBG must be exactly 13 digits.")]
        public string EMBG { get; set; }

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
       
        public int MedicineId { get; set; }

        [Required]
        public int Quantity { get; set; }

        public string? MedicineName { get; set; }
    }

    public class PrescriptionResponseDto
    {
        public int Id { get; set; }
        public string EMBG { get; set; }
        public string PatientName { get; set; }
        public string DoctorName { get; set; }
        public DateTime DateIssued { get; set; }
        public string Status { get; set; }
        public List<PrescriptionMedicineResponseDto> Medicines { get; set; }
    }
}
public class PrescriptionMedicineResponseDto
{
    public int MedicineId { get; set; }
    public string? MedicineName { get; set; }
    public int Quantity { get; set; }
}

public class MissingMedicineDto
{
    public string MedicineName { get; set; }
    public int Quantity { get; set; }
}
