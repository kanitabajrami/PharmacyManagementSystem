using Microsoft.EntityFrameworkCore;
using PharmacyManagmentSystem.Data;
using PharmacyManagmentSystem.Models;

namespace PharmacyManagmentSystem.Repositories
{
    public class MedicineRepository : IMedicineRepository
    {
        private readonly ApplicationDbContext _dbcontext;   

        public MedicineRepository(ApplicationDbContext dbcontext)
        {
            _dbcontext = dbcontext;
        }

        public async Task<IEnumerable<Medicine>> GetAllAsync()
        {
            // Load medicines together with their suppliers
            return await _dbcontext.Medicines.Include(m => m.Supplier).ToListAsync();
        }

        public async Task<Medicine> GetByIdAsync(int id)
        {
            // Get a single medicine with supplier details
            return await _dbcontext.Medicines.Include(m => m.Supplier).FirstOrDefaultAsync(m  => m.Id == id);
        }

        public async Task AddAsync(Medicine medicine)
        {
            // Add new medicine to the database
            _dbcontext.Medicines.Add(medicine);
            await _dbcontext.SaveChangesAsync();
        }

        public async Task UpdateAsync(Medicine medicine)
        {
            // Update existing medicine
            _dbcontext.Medicines.Update(medicine);
            await _dbcontext.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            // Find medicine before deleting
            var medicine = _dbcontext.Medicines.FirstOrDefault(m => m.Id == id);
            if (medicine != null)
            {
                _dbcontext.Medicines.Remove(medicine);
                await _dbcontext.SaveChangesAsync();
            }
        }
    }
}
