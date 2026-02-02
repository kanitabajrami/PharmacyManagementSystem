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
        public async Task<List<PrescriptionMedicineCreateDto>> HandleMissingMedicines(Prescription prescription, PrescriptionDto dto)
        {
            var missing = new List<PrescriptionMedicineCreateDto>();

            // Prevent null crash
            if (dto.Medicines == null || dto.Medicines.Count == 0)
            {
                prescription.Status = PrescriptionStatus.Pending;
                return missing;
            }

            //  One DB query instead of 1 per medicine
            var requestedIds = dto.Medicines.Select(x => x.MedicineId).Distinct().ToList();

            var existingIds = await _dbcontext.Medicines
                .Where(m => requestedIds.Contains(m.Id))
                .Select(m => m.Id)
                .ToListAsync();

            foreach (var pm in dto.Medicines)
            {
                if (!existingIds.Contains(pm.MedicineId))
                {
                    // MedicineName must be provided when not in DB
                    if (string.IsNullOrWhiteSpace(pm.MedicineName))
                        pm.MedicineName = "(missing name)"; // or throw if you want strict

                    missing.Add(pm);
                }
            }

            // Remove missing medicines from entity BEFORE saving (avoids FK error)
            prescription.PrescriptionMedicines = prescription.PrescriptionMedicines
                .Where(x => existingIds.Contains(x.MedicineId))
                .ToList();

            //  Status
            prescription.Status = missing.Count == 0 ? PrescriptionStatus.Ready : PrescriptionStatus.Pending;

            // Log missing medicines
            if (missing.Any())
            {
                var logFolder = Path.Combine(Directory.GetCurrentDirectory(), "Logs");
                Directory.CreateDirectory(logFolder);

                var path = Path.Combine(logFolder, "missing_medicines.txt");
                var timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");

                var lines = missing.Select(m =>
                    $"[{timestamp}] " +
                    $"EMBG={dto.EMBG} | Patient={dto.PatientName} | Doctor={dto.DoctorName} | " +
                    $"Medicine=\"{m.MedicineName}\" (Id={m.MedicineId}) | Qty={m.Quantity}"
                );

                await File.AppendAllLinesAsync(path, lines);
            }

            return missing;
        }
    }
}
