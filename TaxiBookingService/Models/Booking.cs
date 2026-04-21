namespace TaxiBookingService.Models
{
    public class Booking
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int? DriverId { get; set; }
        public string City { get; set; } = string.Empty;
        public string PaymentMode { get; set; } = "Cash";
        public int? RiderRating { get; set; }
        public string? StartOtp { get; set; }
        public DateTime? StartOtpGeneratedAt { get; set; }
        public bool IsStartOtpVerified { get; set; }
        public string PickupLocation { get; set; } = string.Empty;
        public string DropLocation { get; set; } = string.Empty;
        public double PickupLatitude { get; set; }
        public double PickupLongitude { get; set; }
        public double DropLatitude { get; set; }
        public double DropLongitude { get; set; }
        public string CabType { get; set; } = string.Empty;
        public BookingStatus Status { get; set; } = BookingStatus.Pending;
        public decimal Fare { get; set; }
        public decimal CancellationFee { get; set; }
        public string? CancelReason { get; set; }
        public int EstimatedMinutes { get; set; }
        public DateTime BookedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }

        public User User { get; set; } = null!;
        public Driver? Driver { get; set; }
    }
}
