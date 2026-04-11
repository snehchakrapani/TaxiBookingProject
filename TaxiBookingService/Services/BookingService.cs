using Microsoft.EntityFrameworkCore;
using TaxiBookingService.Data;
using TaxiBookingService.DTOs.Booking;
using TaxiBookingService.Helpers;
using TaxiBookingService.Interfaces;
using TaxiBookingService.Models;

namespace TaxiBookingService.Services
{
    public class BookingService : IBookingService
    {
        private readonly AppDbContext _context;

        public BookingService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<BookingResponseDto> BookRideAsync(int userId, BookingRequestDto dto)
        {
            var allDrivers = await _context.Drivers
                .Where(d => d.IsAvailable
                         && d.CabType.ToLower() == dto.CabType.ToLower()
                         && d.City.ToLower() == dto.City.ToLower())
                .ToListAsync();

            var bestDriver = allDrivers
                .OrderBy(d => DistanceHelper.Calculate(
                    d.Latitude, d.Longitude,
                    dto.PickupLatitude, dto.PickupLongitude))
                .ThenByDescending(d => d.Rating)
                .FirstOrDefault();

            if (bestDriver == null)
                throw new Exception("No drivers available in your area for the selected cab type.");

            double distance = DistanceHelper.Calculate(
                bestDriver.Latitude, bestDriver.Longitude,
                dto.PickupLatitude, dto.PickupLongitude);

            int eta = DistanceHelper.EstimateMinutes(distance);
            decimal fare = DistanceHelper.CalculateFare(dto.CabType, distance);

            var booking = new Booking
            {
                UserId = userId,
                DriverId = null,
                City = dto.City,
                PickupLocation = dto.PickupLocation,
                DropLocation = dto.DropLocation,
                CabType = dto.CabType,
                Status = BookingStatus.Pending,
                Fare = fare,
                EstimatedMinutes = eta,
                StartOtp = null,
                StartOtpGeneratedAt = null,
                IsStartOtpVerified = false
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            return MapToResponseDto(booking, null, includeStartOtp: true);
        }

        public async Task<BookingResponseDto> GetBookingStatusAsync(int bookingId, int requesterId, string role)
        {
            var booking = await _context.Bookings
                .Include(b => b.Driver)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking == null)
                throw new Exception("Booking not found.");

            bool isUser = string.Equals(role, "User", StringComparison.OrdinalIgnoreCase);
            bool isDriver = string.Equals(role, "Driver", StringComparison.OrdinalIgnoreCase);

            if (isUser && booking.UserId != requesterId)
                throw new Exception("Booking not found.");

            if (isDriver && booking.DriverId != requesterId)
                throw new Exception("Booking not found.");

            return MapToResponseDto(booking, booking.Driver, includeStartOtp: isUser);
        }

        public async Task<string> CancelBookingAsync(int userId, CancelBookingDto dto)
        {
            var booking = await _context.Bookings
                .Include(b => b.Driver)
                .FirstOrDefaultAsync(b => b.Id == dto.BookingId && b.UserId == userId);

            if (booking == null)
                throw new Exception("Booking not found.");

            if (booking.Status == BookingStatus.Completed ||
                booking.Status == BookingStatus.Cancelled)
                throw new Exception("This booking cannot be cancelled.");

            if (booking.Status == BookingStatus.Confirmed ||
                booking.Status == BookingStatus.InProgress)
            {
                booking.CancellationFee = booking.Fare * 0.05m;
            }

            booking.Status = BookingStatus.Cancelled;
            booking.CancelReason = dto.CancelReason;
            booking.StartOtp = null;
            booking.StartOtpGeneratedAt = null;
            booking.IsStartOtpVerified = false;

            if (booking.Driver != null)
                booking.Driver.IsAvailable = true;

            await _context.SaveChangesAsync();

            string feeMsg = booking.CancellationFee > 0
                ? $" Cancellation fee of Rs.{booking.CancellationFee:F2} applied."
                : " No cancellation fee charged.";

            return "Booking cancelled successfully." + feeMsg;
        }

        public async Task<List<BookingResponseDto>> GetUserHistoryAsync(int userId)
        {
            var bookings = await _context.Bookings
                .Include(b => b.Driver)
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.BookedAt)
                .ToListAsync();

            return bookings
                .Select(b => MapToResponseDto(b, b.Driver, includeStartOtp: true))
                .ToList();
        }

        private static BookingResponseDto MapToResponseDto(Booking booking, Driver? driver, bool includeStartOtp)
        {
            return new BookingResponseDto
            {
                BookingId = booking.Id,
                Status = booking.Status.ToString(),
                CabCategoryLabel = CabCategoryHelper.GetLabel(booking.CabType),
                CabCapacity = CabCategoryHelper.GetCapacity(booking.CabType),
                DriverName = driver?.Name ?? "Not assigned",
                DriverPhone = driver?.Phone ?? "-",
                DriverRating = driver?.Rating ?? 0,
                CabType = booking.CabType,
                PickupLocation = booking.PickupLocation,
                DropLocation = booking.DropLocation,
                Fare = booking.Fare,
                EstimatedMinutes = booking.EstimatedMinutes,
                StartOtp = includeStartOtp ? booking.StartOtp : null,
                IsStartOtpVerified = booking.IsStartOtpVerified,
                BookedAt = booking.BookedAt
            };
        }
    }
}
