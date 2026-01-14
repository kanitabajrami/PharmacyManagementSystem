using PharmacyManagmentSystem.DTOs;
using PharmacyManagmentSystem.Models;
using System.Text;
using System.Security.Cryptography;

namespace PharmacyManagmentSystem.Helpers
{
    public class UserMapper
    {
        public static UserReadDto toDto (User user) 
        {
            return new UserReadDto
            {
                Id = user.Id,
                Username = user.Username,
                Role = user.Role
            };
        }

        public static User toEntity (UserCreateUpdateDto dto)
        {
            return new User
            {
                Username = dto.Username,
                PasswordHash = HashPassword(dto.Password),
                Role = dto.Role,
            };
        }

        public static void UpdateUser (User user, UserCreateUpdateDto dto)
        {
            if (!string.IsNullOrEmpty(dto.Username)) 
                user.Username = dto.Username;

            if (!string.IsNullOrEmpty(dto.Password))
                user.PasswordHash = HashPassword(dto.Password);

            if(!string.IsNullOrEmpty(dto.Role))
                user.Role = dto.Role;
        }

        public static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            byte[] bytes = Encoding.UTF8.GetBytes(password);
            byte[] hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }
    }
}
