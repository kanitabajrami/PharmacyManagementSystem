using PharmacyManagmentSystem.DTOs;
using PharmacyManagmentSystem.Models;

namespace PharmacyManagmentSystem.Helpers
{
    public class PrescriptionMapper
    {
        // This is used for POST
        public static Prescription ToEntity(PrescriptionDto dto)
        {
            return new Prescription
            {
                EMBG = dto.EMBG?.Trim(),
                PatientName = dto.PatientName,
                DoctorName = dto.DoctorName,
                DateIssued = dto.DateIssued,
                PrescriptionMedicines = new List<PrescriptionMedicine>(), // important
                Status = PrescriptionStatus.Pending
            };
        }



        // This is used for PUT
        public static void UpdateEntity(Prescription entity, PrescriptionDto dto)
        {
            entity.EMBG = dto.EMBG;
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

        // This is used for GET and API responses
        public static PrescriptionResponseDto toDto(Prescription entity)
        {
            return new PrescriptionResponseDto
            {
                Id = entity.Id,
                EMBG = entity.EMBG,
                PatientName = entity.PatientName,
                DoctorName = entity.DoctorName,
                DateIssued = entity.DateIssued,
                Status = entity.Status.ToString(),
                Medicines = entity.PrescriptionMedicines
                    .Select(pm => new PrescriptionMedicineResponseDto
                    {
                        MedicineId = pm.MedicineId,
                        MedicineName = pm.Medicine != null ? pm.Medicine.Name : null,
                        Quantity = pm.Quantity
                    })
                    .ToList()
            };
        }
    }
}
