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

        public async Task<Medicine?> GetByIdAsync(int id)
        {
            // Get a single medicine with supplier details
            return await _dbcontext.Medicines.Include(m => m.Supplier).FirstOrDefaultAsync(m  => m.Id == id);
        }

        public async Task AddAsync(Medicine medicine)
        {
            if (medicine.ExpiryDate.Date <= DateTime.UtcNow.Date)
                throw new ArgumentException("Expiry date must be in the future.");

            if (medicine.Price < 0)
                throw new ArgumentException("Price cannot be negative.");

            if (medicine.Quantity < 0)
                throw new ArgumentException("Quantity cannot be negative.");

            if (string.IsNullOrWhiteSpace(medicine.BatchNumber))
                throw new ArgumentException("Batch number is required.");

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

        public async Task<IEnumerable<Medicine>> SearchAsync(string? name, string? category)
        {
            var query = _dbcontext.Medicines
                .AsNoTracking()
                .Include(m => m.Supplier)
                .AsQueryable();


            if (!string.IsNullOrWhiteSpace(name))
                query = query.Where(m => m.Name.ToLower().Contains(name.ToLower()));

            if (!string.IsNullOrWhiteSpace(category))
                query = query.Where(m => m.Category.ToLower().Contains(category.ToLower()));

            return await query.ToListAsync();
        }
        public async Task<IEnumerable<Medicine>> GetLowStockAsync(int threshold)
        {
            return await _dbcontext.Medicines
               .AsNoTracking()
               .Include(m => m.Supplier)
               .Where(m => m.Quantity <= threshold)
               .ToListAsync();
        }
        public async Task<IEnumerable<Medicine>> GetExpiringSoonAsync(int days)
        {
            var limit = DateTime.UtcNow.Date.AddDays(days);

            return await _dbcontext.Medicines
                .AsNoTracking()
                .Include(m => m.Supplier)
                .Where(m => m.ExpiryDate.Date <= limit)
                .ToListAsync();
        }
    }
}
