namespace TaxiBookingService.DTOs.Auth
{
    
    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;     // JWT token
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;      // "User" or "Driver"
    }
}