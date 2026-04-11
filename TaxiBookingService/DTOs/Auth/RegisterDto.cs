namespace TaxiBookingService.DTOs.Auth
{
    
    public class RegisterDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;   // Plain text — we hash it in service
        public string Phone { get; set; } = string.Empty;
    }
}