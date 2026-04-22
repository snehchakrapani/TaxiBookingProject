using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaxiBookingService.Data;
using TaxiBookingService.DTOs.Profile;
using TaxiBookingService.Exceptions;

namespace TaxiBookingService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProfileController(AppDbContext context) => _context = context;

        [HttpGet("me")]
        public async Task<IActionResult> GetMe()
        {
            var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

            if (string.Equals(role, "Driver", StringComparison.OrdinalIgnoreCase))
            {
                var driver = await _context.Drivers.FirstOrDefaultAsync(d => d.Id == id)
                    ?? throw new AppException("Driver not found.");

                return Ok(new ProfileDto
                {
                    Role = "Driver",
                    Name = driver.Name,
                    Email = driver.Email,
                    Phone = driver.Phone,
                    CabType = driver.CabType,
                    VehicleName = driver.VehicleName,
                    VehicleNumber = driver.VehicleNumber,
                    City = driver.City
                });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id)
                ?? throw new AppException("User not found.");

            var balance = await _context.Bookings
                .Where(b => b.UserId == id && b.Status == Models.BookingStatus.Cancelled && b.CancellationFee > 0)
                .SumAsync(b => b.CancellationFee);

            return Ok(new ProfileDto
            {
                Role = "User",
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                OutstandingBalance = balance
            });
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileDto dto)
        {
            var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

            if (string.Equals(role, "Driver", StringComparison.OrdinalIgnoreCase))
            {
                var driver = await _context.Drivers.FirstOrDefaultAsync(d => d.Id == id)
                    ?? throw new AppException("Driver not found.");

                driver.Name = dto.Name.Trim();
                driver.Phone = dto.Phone.Trim();
                driver.CabType = dto.CabType?.Trim() ?? driver.CabType;
                driver.VehicleName = dto.VehicleName?.Trim() ?? driver.VehicleName;
                driver.VehicleNumber = dto.VehicleNumber?.Trim().ToUpperInvariant() ?? driver.VehicleNumber;
                driver.City = dto.City?.Trim() ?? driver.City;
            }
            else
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id)
                    ?? throw new AppException("User not found.");

                user.Name = dto.Name.Trim();
                user.Phone = dto.Phone.Trim();
            }

            await _context.SaveChangesAsync();
            return await GetMe();
        }
    }
}
