using Microsoft.EntityFrameworkCore;
using PharmacyManagmentSystem.Data;
using PharmacyManagmentSystem.DTOs;
using PharmacyManagmentSystem.Models;

namespace PharmacyManagmentSystem.Helpers
{
    public class PrescriptionHelper
    {
        private readonly ApplicationDbContext _dbcontext;
        public PrescriptionHelper (ApplicationDbContext dbcontext)
        {
            _dbcontext = dbcontext;
        }

        // Check if medicines in the prescription are not in the database
        public async Task<List<PrescriptionMedicineCreateDto>> HandleMissingMedicines (Prescription prescription, PrescriptionDto dto)
        {
            var missing = new List<PrescriptionMedicineCreateDto>();

            // Loop through all medicines in the DTO and check if they exist in the database
            foreach (var pm in dto.Medicines)
            {
                var exists = await _dbcontext.Medicines.AnyAsync(x => x.Id == pm.MedicineId);
                if (!exists)
                    missing.Add(pm);        // Add missing medicines to the list
            }

            // Remove any missing medicines from the prescription
            foreach (var m in missing)
            {
                var toRemove = prescription.PrescriptionMedicines.FirstOrDefault(x => x.MedicineId == m.MedicineId);
                if(toRemove != null)
                {
                    prescription.PrescriptionMedicines.Remove(toRemove);
                }
            }

            // Set the prescriptions status ready if all the medicines exsit, otherwise set it to pending
            prescription.Status = missing.Count == 0 ? PrescriptionStatus.Ready : PrescriptionStatus.Pending;

            // Log missing medicines
            if (missing.Count > 0)
            {
                // Ensure the folder exists
                var logFolder = Path.Combine(Directory.GetCurrentDirectory(), "Logs");
                Directory.CreateDirectory(logFolder); 
                var path = Path.Combine(logFolder, "missing_medicines.txt");


                //BETER TO LOG NAME CHECK LATER
                var lines = missing.Select(m => $"[{DateTime.UtcNow}] Patient: {dto.PatientName}, Doctor: {dto.DoctorName}, MedicineId: {m.MedicineId}, Quantity: {m.Quantity}");
                
                // Append all the missing medicines to the log file
                File.AppendAllLines(path, lines);
            }

            return missing;     // Return the list of missing medicines
        }
    }
}
