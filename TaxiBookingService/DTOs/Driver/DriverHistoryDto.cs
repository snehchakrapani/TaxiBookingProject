using TaxiBookingService.DTOs.Booking;

namespace TaxiBookingService.DTOs.Driver
{
    public class DriverHistoryDto
    {
        public decimal TotalEarnings { get; set; }
        public int CompletedTrips { get; set; }
        public List<BookingResponseDto> RecentCompletedRides { get; set; } = new();
    }
}
