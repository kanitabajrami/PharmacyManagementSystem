using Microsoft.EntityFrameworkCore;
using PharmacyManagmentSystem.Data;
using PharmacyManagmentSystem.Models;

namespace PharmacyManagmentSystem.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly ApplicationDbContext _dbcontext;
        
        public UserRepository(ApplicationDbContext dbContext){

            _dbcontext = dbContext;
        }

        public async Task<User?> GetByIdAsync(int id)
        {
            return await _dbcontext.Users.AsNoTracking().FirstOrDefaultAsync(u=>u.Id==id);
        }
        public async Task<User?> GetByUsernameAsync(string username)
        {
            return await _dbcontext.Users.FirstOrDefaultAsync(u => u.Username == username);
        }
        public async Task<IEnumerable<User>> GetAllAsync()
        {
            return await _dbcontext.Users.ToListAsync();
        }

        public async Task AddUser(User user)
        {
            _dbcontext.Users.Add(user);
            await _dbcontext.SaveChangesAsync();
        }
        public async Task UpdateUser(User user)
        {
            _dbcontext.Users.Update(user);
            await _dbcontext.SaveChangesAsync();
        }
        public async Task DeleteUser(int id)
        {
            var user = await _dbcontext.Users.FindAsync(id);
            if (user == null) return;

            _dbcontext.Users.Remove(user);
            await _dbcontext.SaveChangesAsync();
        }

        public async Task<bool> UsernameExistsAsync(string username)
        {
            return await _dbcontext.Users.AnyAsync(u=>u.Username==username);
        }
        
        public async Task UpdateRoleAsync(int userId, string role)
        {
            var user= await _dbcontext.Users.FindAsync(userId);

            if (user == null) return;

            user.Role = role;
            await _dbcontext.SaveChangesAsync();
        }
        public async Task UpdatePasswordHashAsync(int userId, string newPasswordHash)
        {
            var user = await _dbcontext.Users.FindAsync(userId);

            if (user == null) return;

            user.PasswordHash = newPasswordHash;
            await _dbcontext.SaveChangesAsync();
        }


    }
}
