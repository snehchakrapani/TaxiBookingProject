using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaxiBookingService.DTOs.Driver;
using TaxiBookingService.Interfaces;

namespace TaxiBookingService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Driver")]
    public class DriverController : ControllerBase
    {
        private readonly IDriverService _driverService;

        public DriverController(IDriverService driverService)
        {
            _driverService = driverService;
        }

        [HttpGet("requests")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var driverId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _driverService.GetPendingRequestsAsync(driverId);
            return Ok(result);
        }

        [HttpPut("accept/{bookingId}")]
        public async Task<IActionResult> AcceptBooking(int bookingId)
        {
            var driverId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var message = await _driverService.AcceptBookingAsync(driverId, bookingId);
            return Ok(new { Message = message });
        }

        [HttpPut("decline/{bookingId}")]
        public async Task<IActionResult> DeclineBooking(int bookingId)
        {
            var driverId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var message = await _driverService.DeclineBookingAsync(driverId, bookingId);
            return Ok(new { Message = message });
        }

        [HttpPut("location")]
        public async Task<IActionResult> UpdateLocation([FromBody] UpdateLocationDto dto)
        {
            var driverId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var message = await _driverService.UpdateLocationAsync(driverId, dto);
            return Ok(new { Message = message });
        }

        [HttpPut("availability")]
        public async Task<IActionResult> UpdateAvailability([FromBody] UpdateAvailabilityDto dto)
        {
            var driverId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var message = await _driverService.UpdateAvailabilityAsync(driverId, dto);
            return Ok(new { Message = message });
        }

        [HttpPut("verify-start-otp")]
        public async Task<IActionResult> VerifyStartOtp([FromBody] VerifyStartOtpDto dto)
        {
            var driverId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var message = await _driverService.VerifyStartOtpAsync(driverId, dto);
            return Ok(new { Message = message });
        }

        [HttpPut("complete/{bookingId}")]
        public async Task<IActionResult> CompleteRide(int bookingId)
        {
            var driverId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var message = await _driverService.CompleteRideAsync(driverId, bookingId);
            return Ok(new { Message = message });
        }
    }
}
