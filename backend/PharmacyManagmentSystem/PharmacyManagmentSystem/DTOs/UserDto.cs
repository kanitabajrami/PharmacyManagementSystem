using System.ComponentModel.DataAnnotations;

namespace PharmacyManagmentSystem.DTOs
{
    public class UserReadDto
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Role { get; set; }
    }

    public class UserCreateUpdateDto
    {

        [Required]
        public string Username { get; set; }
        public string? Password { get; set; }
        [Required]
        public string Role { get; set; }
    }
}
