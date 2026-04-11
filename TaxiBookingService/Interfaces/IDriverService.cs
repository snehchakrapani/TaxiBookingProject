using TaxiBookingService.DTOs.Booking;
using TaxiBookingService.DTOs.Driver;

namespace TaxiBookingService.Interfaces
{
    public interface IDriverService
    {
        Task<List<BookingResponseDto>> GetPendingRequestsAsync(int driverId);
        Task<string> AcceptBookingAsync(int driverId, int bookingId);
        Task<string> DeclineBookingAsync(int driverId, int bookingId);
        Task<string> UpdateLocationAsync(int driverId, UpdateLocationDto dto);
        Task<string> UpdateAvailabilityAsync(int driverId, UpdateAvailabilityDto dto);
        Task<string> VerifyStartOtpAsync(int driverId, VerifyStartOtpDto dto);
        Task<string> CompleteRideAsync(int driverId, int bookingId);
    }
}
