using Microsoft.EntityFrameworkCore;
using PharmacyManagmentSystem.Data;
using PharmacyManagmentSystem.Models;

namespace PharmacyManagmentSystem.Repositories
{
    public class PrescriptionRepository : IPrescriptionRepository
    {
        private readonly ApplicationDbContext _dbcontext;

        public PrescriptionRepository(ApplicationDbContext dbcontext)
        {
            _dbcontext = dbcontext;
        }

        public async Task<IEnumerable<Prescription>> GetAllAsync()
        {
            // Load prescriptions + their medicine
            return await _dbcontext.Prescriptions.Include(p => p.PrescriptionMedicines).ThenInclude(pm => pm.Medicine).ToListAsync();
        }
        public async Task<Prescription?> GetByIdAsync(int id)
        {
            // Load single prescription + its medicie
            return await _dbcontext.Prescriptions.Include(p => p.PrescriptionMedicines).ThenInclude(pm => pm.Medicine).FirstOrDefaultAsync(pm => pm.Id == id);
        }
        public async Task AddAsync(Prescription prescription)
        {
            // Validate required fields
            if (prescription == null)
                throw new ArgumentNullException(nameof(prescription));

            if (string.IsNullOrWhiteSpace(prescription.EMBG))
                throw new ArgumentException("Patient ID is required.");

            if (string.IsNullOrWhiteSpace(prescription.PatientName))
                throw new ArgumentException("Patient name is required.");

            if (string.IsNullOrWhiteSpace(prescription.DoctorName))
                throw new ArgumentException("Doctor name is required.");

            _dbcontext.Prescriptions.Add(prescription);
            await _dbcontext.SaveChangesAsync();
        }
        public async Task UpdateAsync(Prescription prescription)
        {
            _dbcontext.Prescriptions.Update(prescription);
            await _dbcontext.SaveChangesAsync();
        }
        public async Task DeleteAsync(int id)
        {
            var prescription = _dbcontext.Prescriptions.FirstOrDefault(p => p.Id == id);
            if (prescription != null)
            {
                _dbcontext.Prescriptions.Remove(prescription);
                await _dbcontext.SaveChangesAsync();
            }
        }
        public async Task<IEnumerable<Prescription>> SearchAsync(string? embg,  string? patientName, string? doctorName)
        {
            var q = _dbcontext.Prescriptions
                .AsNoTracking()
                .Include(p => p.PrescriptionMedicines)
                    .ThenInclude(pm => pm.Medicine)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(embg))
            {
                var e = embg.Trim();
                // exact match 
                q = q.Where(p => p.EMBG == e);
            }

            if (!string.IsNullOrWhiteSpace(patientName))
            {
                var pn = $"%{patientName.Trim()}%";
                q = q.Where(p => p.PatientName != null && EF.Functions.ILike(p.PatientName, pn));
            }

            if (!string.IsNullOrWhiteSpace(doctorName))
            {
                var dn = $"%{doctorName.Trim()}%";
                q = q.Where(p => p.DoctorName != null && EF.Functions.ILike(p.DoctorName, dn));
            }

            return await q
                .OrderByDescending(p => p.DateIssued)
                .ToListAsync();
        }
        public async Task<bool> EmbgExistsAsync(string embg)
        {
            embg = embg.Trim();
            return await _dbcontext.Prescriptions.AnyAsync(p => p.EMBG == embg);
        }
    }
}
