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

            if (string.IsNullOrWhiteSpace(prescription.PatientId))
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
        public async Task<IEnumerable<Prescription>> GetByPatientAsync(string id)
        {
            // Search prescription by patient id
            return await _dbcontext.Prescriptions.Include(p => p.PrescriptionMedicines).ThenInclude(pm => pm.Medicine).Where(p => p.PatientId == id).ToListAsync();
        }
        public async Task<IEnumerable<Prescription>> GetByDoctorAsync(string name)
        {
            // Case-insensitive search by doctor name
            return await _dbcontext.Prescriptions.Include(p => p.PrescriptionMedicines).ThenInclude(pm => pm.Medicine).Where(d => d.DoctorName.ToLower() == name.ToLower()).ToListAsync();
        }
        public async Task<IEnumerable<Prescription>> GetExpiredPrescriptions()
        {
            return await _dbcontext.Prescriptions.Include(p => p.PrescriptionMedicines).ThenInclude(pm => pm.Medicine).Where(d => d.DateIssued.AddDays(30) < DateTime.UtcNow).ToListAsync();
        }
        public async Task<bool> IsExpired(int id)
        {
            var prescription = await GetByIdAsync(id);
            if (prescription == null)
                throw new Exception("Prescription not found");
            return prescription.DateIssued.AddDays(30) < DateTime.UtcNow;       // Expired if its older than 30 days
        }
    }
}
