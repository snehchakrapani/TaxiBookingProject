using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaxiBookingService.DTOs.Booking;
using TaxiBookingService.Interfaces;

namespace TaxiBookingService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingController : ControllerBase
    {
        private readonly IBookingService _bookingService;

        public BookingController(IBookingService bookingService)
        {
            _bookingService = bookingService;
        }

        [HttpPost("book")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> BookRide([FromBody] BookingRequestDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _bookingService.BookRideAsync(userId, dto);
            return CreatedAtAction(nameof(GetBookingStatus), new { id = result.BookingId }, result);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetBookingStatus(int id)
        {
            var requesterId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
            var result = await _bookingService.GetBookingStatusAsync(id, requesterId, role);
            return Ok(result);
        }

        [HttpPut("cancel")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> CancelBooking([FromBody] CancelBookingDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var message = await _bookingService.CancelBookingAsync(userId, dto);
            return Ok(new { Message = message });
        }

        [HttpGet("history")]
        [Authorize(Roles = "User")]
        public async Task<IActionResult> GetHistory()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _bookingService.GetUserHistoryAsync(userId);
            return Ok(result);
        }
    }
}
