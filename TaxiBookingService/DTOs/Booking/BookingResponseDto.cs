using TaxiBookingService.Models;

namespace TaxiBookingService.DTOs.Booking
{
    // Output shape returned to user after booking is created
    // Contains driver info + ETA — everything user needs to see
    public class BookingResponseDto
    {
        public int BookingId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string CabCategoryLabel { get; set; } = string.Empty;
        public int CabCapacity { get; set; }

        // Driver details shown to user after match
        public string DriverName { get; set; } = string.Empty;
        public string DriverPhone { get; set; } = string.Empty;
        public double DriverRating { get; set; }
        public string CabType { get; set; } = string.Empty;

        public string PickupLocation { get; set; } = string.Empty;
        public string DropLocation { get; set; } = string.Empty;

        public decimal Fare { get; set; }
        public int EstimatedMinutes { get; set; }   
        public string? StartOtp { get; set; }
        public bool IsStartOtpVerified { get; set; }

        public DateTime BookedAt { get; set; }
    }
}
