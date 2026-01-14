using Microsoft.EntityFrameworkCore;
using PharmacyManagmentSystem.Data;
using PharmacyManagmentSystem.Models;
using System.Linq;

namespace PharmacyManagmentSystem.Repositories
{
    public class SupplierRepository : ISupplierRepository
    {
        private readonly ApplicationDbContext _dbcontext;

        public SupplierRepository(ApplicationDbContext dbcontext)
        {
            _dbcontext = dbcontext;
        }
        public async Task<IEnumerable<Supplier>> GetAllAsync()
        {
            return await _dbcontext.Suppliers.AsNoTracking().Include(s => s.Medicines).ToListAsync();
        }

        public async Task<Supplier?> GetByIdAsync(int id)
        {
            return await _dbcontext.Suppliers.AsNoTracking() .Include(s => s.Medicines).FirstOrDefaultAsync(s=>s.Id==id);
        }
        public async Task AddAsync(Supplier supplier)
        {
            _dbcontext.Suppliers.Add(supplier);
            await _dbcontext.SaveChangesAsync();
        }
        public async Task UpdateAsync(Supplier supplier)
        {
            _dbcontext.Suppliers.Update(supplier);
            await _dbcontext.SaveChangesAsync();
        }
     
        public async Task ReactivateAsync(int id)
        {
            var supplier = await _dbcontext.Suppliers.FindAsync(id);
            if (supplier == null)
                throw new ArgumentException("Supplier not found.");

            if (supplier.IsActive)
                throw new ArgumentException("Supplier is already activated.");

            supplier.IsActive = true;
            await _dbcontext.SaveChangesAsync();
        }
        public async Task DeactivateAsync(int id)
        {
            var supplier = await _dbcontext.Suppliers.FindAsync(id);
            if (supplier == null)
                throw new ArgumentException("Supplier not found.");

            if (!supplier.IsActive)
                throw new ArgumentException("Supplier is already deactivated.");

            supplier.IsActive = false;
            await _dbcontext.SaveChangesAsync();
        }
        public async Task DeleteAsync(int id)
        {
            var supplier = await _dbcontext.Suppliers
                .Include(s => s.Medicines)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (supplier == null)
                throw new ArgumentException("Supplier not found.");

            if (supplier.Medicines.Any())
                throw new ArgumentException("Cannot delete supplier because it has medicines.");

            _dbcontext.Suppliers.Remove(supplier);
            await _dbcontext.SaveChangesAsync();
        }

    }
}
