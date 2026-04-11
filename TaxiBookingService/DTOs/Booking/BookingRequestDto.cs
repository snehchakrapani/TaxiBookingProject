namespace TaxiBookingService.DTOs.Booking
{

    public class BookingRequestDto
    {
        public string PickupLocation { get; set; } = string.Empty;
        public string DropLocation { get; set; } = string.Empty;


        public string CabType { get; set; } = string.Empty;


        public string? ArrivalPreference { get; set; }


        public string City { get; set; } = string.Empty;


        public double PickupLatitude { get; set; }
        public double PickupLongitude { get; set; }
    }
}