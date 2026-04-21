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

        public DriverController(IDriverService driverService) => _driverService = driverService;

        private int DriverId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet("requests")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var result = await _driverService.GetPendingRequestsAsync(DriverId);
            return Ok(result);
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetDriverHistory()
        {
            var result = await _driverService.GetDriverHistoryAsync(DriverId);
            return Ok(result);
        }

        [HttpGet("current-booking")]
        public async Task<IActionResult> GetCurrentBooking()
        {
            var result = await _driverService.GetCurrentBookingAsync(DriverId);
            return Ok(result);
        }

        [HttpPut("accept/{bookingId}")]
        public async Task<IActionResult> AcceptBooking(int bookingId)
        {
            var message = await _driverService.AcceptBookingAsync(DriverId, bookingId);
            return Ok(new { Message = message });
        }

        [HttpPut("decline/{bookingId}")]
        public async Task<IActionResult> DeclineBooking(int bookingId)
        {
            var message = await _driverService.DeclineBookingAsync(DriverId, bookingId);
            return Ok(new { Message = message });
        }

        [HttpPut("location")]
        public async Task<IActionResult> UpdateLocation([FromBody] UpdateLocationDto dto)
        {
            var message = await _driverService.UpdateLocationAsync(DriverId, dto);
            return Ok(new { Message = message });
        }

        [HttpPut("availability")]
        public async Task<IActionResult> UpdateAvailability([FromBody] UpdateAvailabilityDto dto)
        {
            var message = await _driverService.UpdateAvailabilityAsync(DriverId, dto);
            return Ok(new { Message = message });
        }

        [HttpPut("verify-start-otp")]
        public async Task<IActionResult> VerifyStartOtp([FromBody] VerifyStartOtpDto dto)
        {
            var message = await _driverService.VerifyStartOtpAsync(DriverId, dto);
            return Ok(new { Message = message });
        }

        [HttpPut("complete/{bookingId}")]
        public async Task<IActionResult> CompleteRide(int bookingId)
        {
            var message = await _driverService.CompleteRideAsync(DriverId, bookingId);
            return Ok(new { Message = message });
        }

        [HttpPut("cancel-ride")]
        public async Task<IActionResult> CancelAcceptedRide([FromBody] DriverCancelRideDto dto)
        {
            var message = await _driverService.CancelAcceptedRideAsync(DriverId, dto.BookingId, dto.Reason);
            return Ok(new { Message = message });
        }
    }
}
