namespace TaxiBookingService.DTOs.Booking
{
    public class PaymentModeDto
    {
        public int BookingId { get; set; }
        public string PaymentMode { get; set; } = "Cash";
    }
}

