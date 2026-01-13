using PharmacyManagmentSystem.DTOs;
using PharmacyManagmentSystem.Models;

namespace PharmacyManagmentSystem.Helpers
{
    public class PrescriptionMapper
    {
        // This is used for POST
        public static Prescription ToEntity (PrescriptionDto dto)
        {
            return new Prescription
            {
                PatientId = dto.PatientId,
                PatientName = dto.PatientName,
                DoctorName = dto.DoctorName,
                DateIssued = dto.DateIssued,
                PrescriptionMedicines = dto.Medicines.Select(m => new PrescriptionMedicine
                {
                    MedicineId = m.MedicineId,
                    Quantity = m.Quantity
                }).ToList(),
                Status = PrescriptionStatus.Pending
            };
        }

        // This is used for PUT
        public static void UpdateEntity(Prescription entity, PrescriptionDto dto)
        {
            entity.PatientId = dto.PatientId;
            entity.PatientName = dto.PatientName;
            entity.DoctorName = dto.DoctorName;
            entity.DateIssued = dto.DateIssued;

            entity.PrescriptionMedicines.Clear();
            foreach (var m in dto.Medicines)
            {
                entity.PrescriptionMedicines.Add(new PrescriptionMedicine
                {
                    MedicineId = m.MedicineId,
                    Quantity = m.Quantity
                });
            }
        }
    }
}
