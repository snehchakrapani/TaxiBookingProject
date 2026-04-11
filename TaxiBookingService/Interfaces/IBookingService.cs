using TaxiBookingService.DTOs.Booking;

namespace TaxiBookingService.Interfaces
{
    public interface IBookingService
    {
        Task<BookingResponseDto> BookRideAsync(int userId, BookingRequestDto dto);
        Task<BookingResponseDto> GetBookingStatusAsync(int bookingId, int requesterId, string role);
        Task<string> CancelBookingAsync(int userId, CancelBookingDto dto);
        Task<List<BookingResponseDto>> GetUserHistoryAsync(int userId);
    }
}
