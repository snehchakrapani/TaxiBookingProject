namespace TaxiBookingService.DTOs.Profile
{
    public class ProfileDto
    {
        public string Role { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public decimal OutstandingBalance { get; set; }
        public string? CabType { get; set; }
        public string? VehicleName { get; set; }
        public string? VehicleNumber { get; set; }
        public string? City { get; set; }
    }
}
