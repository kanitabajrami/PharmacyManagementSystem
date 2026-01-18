using Microsoft.EntityFrameworkCore;
using PharmacyManagmentSystem.Data;
using PharmacyManagmentSystem.Models;

namespace PharmacyManagmentSystem.Repositories
{
    public class InvoiceRepository : IInvoiceRepository
    {
        private readonly ApplicationDbContext _dbcontext;

        public InvoiceRepository(ApplicationDbContext dbcontext)
        {
            _dbcontext = dbcontext;
        }

        public async Task<IEnumerable<Invoice>> GetAllAsync()
        {
            // Load all invoices + their items and the user who created them
            return await _dbcontext.Invoices.AsNoTracking().Include(i => i.User).Include(i => i.InvoiceItems).ThenInclude(ii => ii.Medicine)
                .OrderByDescending(i => i.DateCreated)
                .ToListAsync();
        }
        public async Task<Invoice?> GetByIdAsync(int id)
        {
            // Load a single invoice + its items and the user 
            return await _dbcontext.Invoices.AsNoTracking().Include(i => i.User).Include(i => i.InvoiceItems).ThenInclude(ii => ii.Medicine)
            .FirstOrDefaultAsync(i => i.Id == id);
        }
        public async Task AddAsync(Invoice invoice)
        {
            // Ensure invoice has at least one item
            if (invoice.InvoiceItems == null || !invoice.InvoiceItems.Any())
                throw new ArgumentException("Invoice must have at least one item");

            foreach (var item in invoice.InvoiceItems)
                item.LineTotal = item.UnitPrice * item.Quantity;

            invoice.TotalAmount = invoice.InvoiceItems.Sum(i => i.LineTotal);

            _dbcontext.Invoices.Add(invoice);
            await _dbcontext.SaveChangesAsync();
        }
     
        public async Task DeleteAsync(int id)
        {
            // Delete invoice if it exists
            var invoice = await _dbcontext.Invoices.FindAsync(id);
            if (invoice != null)
            {
                _dbcontext.Invoices.Remove(invoice);
                await _dbcontext.SaveChangesAsync();
            }
        }
        public async Task<IEnumerable<Invoice>> GetByUserAsync(string id)
        {
            // Get the invoices created by a specific user
            return await _dbcontext.Invoices.Include(i => i.InvoiceItems).ThenInclude(ii => ii.Medicine).Where(i => i.UserId == id).ToListAsync();
        }
        public async Task<IEnumerable<Invoice>> GetByDateRangeAsync(DateTime start, DateTime end)
        {
            // Get invoices within a specific date range
            return await _dbcontext.Invoices
                    .AsNoTracking()
                    .Include(i => i.User)
                    .Include(i => i.InvoiceItems)
                        .ThenInclude(ii => ii.Medicine)
                    .Where(i => i.DateCreated >= start && i.DateCreated <= end)
                    .OrderByDescending(i => i.DateCreated)
                    .ToListAsync();
        }
    }
}
