using Microsoft.EntityFrameworkCore;
using PharmacyManagmentSystem.Data;
using PharmacyManagmentSystem.Models;

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
            return await _dbcontext.Suppliers.Include(s=>s.Medicines).ToListAsync();
        }

        public async Task<Supplier?> GetByIdAsync(int id)
        {
            return await _dbcontext.Suppliers.Include(s => s.Medicines).FirstOrDefaultAsync(s => s.Id == id);

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
        public async Task DeleteAsync(int id)
        {
            var supplier=await _dbcontext.Suppliers.FindAsync(id);

            if (supplier == null) return;

            _dbcontext.Suppliers.Remove(supplier);
            await _dbcontext.SaveChangesAsync();
        }

      
    }
}
