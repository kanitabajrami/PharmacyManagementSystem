using PharmacyManagmentSystem.Models;

namespace PharmacyManagmentSystem.Repositories
{
    public interface IInvoiceRepository
    {
        Task<IEnumerable<Invoice>> GetAllAsync();
        Task<Invoice?> GetByIdAsync(int id);
        Task AddAsync(Invoice invoice);
        Task UpdateAsync(Invoice invoice);
        Task DeleteAsync(int id);

        Task<IEnumerable<Invoice>> GetByUserAsync(int id);
        Task<IEnumerable<Invoice>> GetByDateRangeAsync(DateTime start, DateTime end);
        //Task<decimal> GetTotalAmountAsync(int id);   //mund te largohet
    }
}
