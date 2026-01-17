using System.ComponentModel.DataAnnotations;

namespace PharmacyManagmentSystem.DTOs
{
    public class AuthDto
    {
        public class RegisterDto
        {
            [Required]
            public string UserName { get; set; } = default!;

            [Required, EmailAddress] 
            public string Email { get; set; } = default!;
            [Required, MinLength(6)] 
            public string Password { get; set; } = default!;
        }

        public class LoginDto
        {
            [Required] 
            public string UserNameOrEmail { get; set; } = default!;
            [Required] 
            public string Password { get; set; } = default!;
        }
    }
}
