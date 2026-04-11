namespace TaxiBookingService.DTOs.Booking
{
    
    public class CancelBookingDto
    {
        public int BookingId { get; set; }

        // User must select one reason from this fixed list:
        // "Change of plans", "Wrong location entered",
        // "Emergency", "Driver took too long", "Other"
        public string CancelReason { get; set; } = string.Empty;
    }
}