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

        Task<IEnumerable<Prescription>> GetByPatientAsync(string id);
        Task<IEnumerable<Prescription>> GetByDoctorAsync(string name);
        //Task<IEnumerable<Prescription>> GetExpiredPrescriptions();      //mund te largohet
        //Task<bool> IsExpiredAsync(int id);    //mund te largohet
    }
}
