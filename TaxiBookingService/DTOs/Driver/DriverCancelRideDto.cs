namespace TaxiBookingService.DTOs.Driver
{
    public class DriverCancelRideDto
    {
        public int BookingId { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
}
