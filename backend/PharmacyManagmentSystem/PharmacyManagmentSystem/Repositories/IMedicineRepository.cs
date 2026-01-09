using PharmacyManagmentSystem.Models;

namespace PharmacyManagmentSystem.Repositories
{
    public interface IMedicineRepository
    {
        Task<IEnumerable<Medicine>> GetAllAsync();
        Task<Medicine> GetByIdAsync(int id);
        Task AddAsync (Medicine medicine);
        Task UpdateAsync (Medicine medicine);
        Task DeleteAsync (int id);

    }
}
