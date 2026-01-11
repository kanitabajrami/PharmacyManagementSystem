using PharmacyManagmentSystem.Models;

namespace PharmacyManagmentSystem.Repositories
{
    public interface IUserRepository
    {
        Task<User?>GetByIdAsync(int id);
        Task<User?>GetByUsernameAsync(string username);
        Task<IEnumerable<User>> GetAllAsync();

        Task AddUser(User user);
        Task UpdateUser(User user);
        Task DeleteUser(int id);

        Task <bool> UsernameExistsAsync(string username);
        Task UpdateRoleAsync(int userId, string role);
        Task UpdatePasswordHashAsync(int userId, string newPasswordHash);


    }
}
