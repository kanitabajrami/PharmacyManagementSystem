using Microsoft.EntityFrameworkCore;
using PharmacyManagmentSystem.Models;

namespace PharmacyManagmentSystem.Repositories
{
    public interface IPrescriptionRepository
    {
        Task<IEnumerable<Prescription>> GetAllAsync();
        Task<Prescription?> GetByIdAsync(int id);
        Task AddAsync(Prescription prescription);
        Task UpdateAsync(Prescription prescription);
        Task DeleteAsync(int id);

        Task<IEnumerable<Prescription>> SearchAsync(string? embg, string? patientName, string? doctorName);

        Task<bool> EmbgExistsAsync(string embg);
    }
}
