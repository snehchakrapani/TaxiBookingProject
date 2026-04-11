using Microsoft.AspNetCore.Mvc;
using TaxiBookingService.DTOs.Auth;
using TaxiBookingService.DTOs.Driver;
using TaxiBookingService.Interfaces;

namespace TaxiBookingService.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;


        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

       
        [HttpPost("register/user")]
        public async Task<IActionResult> RegisterUser([FromBody] RegisterDto dto)
        {
          
            var result = await _authService.RegisterUserAsync(dto);

            
            return CreatedAtAction(nameof(RegisterUser), result);
        }

      
        [HttpPost("register/driver")]
        public async Task<IActionResult> RegisterDriver([FromBody] DriverRegisterDto dto)
        {
            var result = await _authService.RegisterDriverAsync(dto);
            return CreatedAtAction(nameof(RegisterDriver), result);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);

            
            return Ok(result);
        }
    }
}