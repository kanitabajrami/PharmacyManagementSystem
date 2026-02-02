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

        //Task<IEnumerable<Prescription>> GetExpiredPrescriptions();      //mund te largohet
        //Task<bool> IsExpiredAsync(int id);    //mund te largohet
    }
}
