using TaxiBookingService.DTOs.Auth;
using TaxiBookingService.DTOs.Driver;

namespace TaxiBookingService.Interfaces
{
    
    public interface IAuthService
    {
      
        Task<AuthResponseDto> RegisterUserAsync(RegisterDto dto);

        // Register a new driver
        Task<AuthResponseDto> RegisterDriverAsync(DriverRegisterDto dto);

        
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
    }
}