using TaxiBookingService.Models;

namespace TaxiBookingService.DTOs.Booking
{
    public class BookingResponseDto
    {
        public int BookingId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string CabCategoryLabel { get; set; } = string.Empty;
        public int CabCapacity { get; set; }

        public string DriverName { get; set; } = string.Empty;
        public string DriverPhone { get; set; } = string.Empty;
        public double DriverRating { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserPhone { get; set; } = string.Empty;
        public string VehicleName { get; set; } = string.Empty;
        public string VehicleNumber { get; set; } = string.Empty;
        public double? DriverLatitude { get; set; }
        public double? DriverLongitude { get; set; }
        public string CabType { get; set; } = string.Empty;

        public string PickupLocation { get; set; } = string.Empty;
        public string DropLocation { get; set; } = string.Empty;
        public double PickupLatitude { get; set; }
        public double PickupLongitude { get; set; }
        public double DropLatitude { get; set; }
        public double DropLongitude { get; set; }

        public decimal Fare { get; set; }
        public decimal CancellationFee { get; set; }
        public decimal OutstandingBalance { get; set; }
        public int EstimatedMinutes { get; set; }   
        public string PaymentMode { get; set; } = "Cash";
        public int? RiderRating { get; set; }
        public string? StartOtp { get; set; }
        public bool IsStartOtpVerified { get; set; }

        public DateTime BookedAt { get; set; }
    }
}
