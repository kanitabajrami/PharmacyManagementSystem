using PharmacyManagmentSystem.Models;

namespace PharmacyManagmentSystem.Repositories
{
    public interface IMedicineRepository
    {
        Task<IEnumerable<Medicine>> GetAllAsync();
        Task<Medicine?> GetByIdAsync(int id);
        Task AddAsync (Medicine medicine);
        Task UpdateAsync (Medicine medicine);
        Task DeleteAsync (int id);
        Task<IEnumerable<Medicine>> SearchAsync(string? name, string? category);
        Task<IEnumerable<Medicine>> GetLowStockAsync(int threshold);
        Task<IEnumerable<Medicine>> GetExpiringSoonAsync(int days);
      
    }
}
