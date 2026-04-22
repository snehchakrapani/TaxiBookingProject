namespace TaxiBookingService.DTOs.Profile
{
    public class UpdateProfileDto
    {
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? CabType { get; set; }
        public string? VehicleName { get; set; }
        public string? VehicleNumber { get; set; }
        public string? City { get; set; }
    }
}
