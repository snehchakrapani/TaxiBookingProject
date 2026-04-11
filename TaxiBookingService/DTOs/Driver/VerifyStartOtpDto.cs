namespace TaxiBookingService.DTOs.Driver
{
    public class VerifyStartOtpDto
    {
        public int BookingId { get; set; }
        public string Otp { get; set; } = string.Empty;
    }
}
