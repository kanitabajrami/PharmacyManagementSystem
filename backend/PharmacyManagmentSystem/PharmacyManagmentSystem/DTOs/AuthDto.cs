namespace PharmacyManagmentSystem.DTOs
{
    public class AuthDto
    {
        public class RegisterDto
        {
            public string Email { get; set; }
            public string Password { get; set; }
        }

        public class LoginDto
        {
            public string Email { get; set; }
            public string Password { get; set; }
        }
    }
}
