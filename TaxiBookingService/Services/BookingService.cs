using Microsoft.EntityFrameworkCore;
using TaxiBookingService.Data;
using TaxiBookingService.DTOs.Booking;
using TaxiBookingService.Exceptions;
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
                .OrderBy(d => DistanceHelper.Calculate(d.Latitude, d.Longitude, dto.PickupLatitude, dto.PickupLongitude))
                .ThenByDescending(d => d.Rating)
                .FirstOrDefault();

            if (bestDriver == null)
                throw new AppException("No drivers available in your area for the selected cab type.");

            // Fare and ETA should reflect the rider's trip, not the selected driver's approach distance.
            double tripDistance = DistanceHelper.Calculate(
                dto.PickupLatitude, dto.PickupLongitude,
                dto.DropLatitude, dto.DropLongitude);

            int eta = DistanceHelper.EstimateMinutes(tripDistance);
            decimal fare = DistanceHelper.CalculateFare(dto.CabType, tripDistance);

            var booking = new Booking
            {
                UserId = userId,
                DriverId = null,
                City = dto.City,
                PaymentMode = "Cash",
                RiderRating = null,
                PickupLocation = dto.PickupLocation,
                DropLocation = dto.DropLocation,
                PickupLatitude = dto.PickupLatitude,
                PickupLongitude = dto.PickupLongitude,
                DropLatitude = dto.DropLatitude,
                DropLongitude = dto.DropLongitude,
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
                .FirstOrDefaultAsync(b => b.Id == bookingId)
                ?? throw new AppException("Booking not found.");

            bool isUser = string.Equals(role, "User", StringComparison.OrdinalIgnoreCase);
            bool isDriver = string.Equals(role, "Driver", StringComparison.OrdinalIgnoreCase);

            if (isUser && booking.UserId != requesterId)
                throw new AppException("Booking not found.");
            if (isDriver && booking.DriverId != requesterId)
                throw new AppException("Booking not found.");

            return MapToResponseDto(booking, booking.Driver, includeStartOtp: isUser);
        }

        public async Task<string> CancelBookingAsync(int userId, CancelBookingDto dto)
        {
            var booking = await _context.Bookings
                .Include(b => b.Driver)
                .FirstOrDefaultAsync(b => b.Id == dto.BookingId && b.UserId == userId)
                ?? throw new AppException("Booking not found.");

            if (booking.Status == BookingStatus.Completed || booking.Status == BookingStatus.Cancelled)
                throw new AppException("This booking cannot be cancelled.");

            if (booking.Status == BookingStatus.Confirmed || booking.Status == BookingStatus.InProgress)
                booking.CancellationFee = booking.Fare * 0.05m;

            booking.Status = BookingStatus.Cancelled;
            booking.CancelReason = dto.CancelReason;
            booking.StartOtp = null;
            booking.StartOtpGeneratedAt = null;
            booking.IsStartOtpVerified = false;

            if (booking.Driver != null)
                booking.Driver.IsAvailable = true;

            await _context.SaveChangesAsync();

            string feeMsg = booking.CancellationFee > 0
                ? $" Cancellation fee of ₹{booking.CancellationFee:F2} applied."
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

            return bookings.Select(b => MapToResponseDto(b, b.Driver, includeStartOtp: true)).ToList();
        }

        public async Task<string> SetPaymentModeAsync(int userId, int bookingId, string paymentMode)
        {
            var mode = (paymentMode ?? string.Empty).Trim();
            if (!string.Equals(mode, "Cash", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(mode, "UPI", StringComparison.OrdinalIgnoreCase))
                throw new AppException("Unsupported payment mode. Use Cash or UPI.");

            var booking = await _context.Bookings
                .FirstOrDefaultAsync(b => b.Id == bookingId && b.UserId == userId)
                ?? throw new AppException("Booking not found.");

            if (booking.Status != BookingStatus.Completed)
                throw new AppException("Payment mode can only be set after ride completion.");

            booking.PaymentMode = string.Equals(mode, "UPI", StringComparison.OrdinalIgnoreCase) ? "UPI" : "Cash";
            await _context.SaveChangesAsync();
            return "Payment mode updated.";
        }

        public async Task<string> RateDriverAsync(int userId, int bookingId, int rating)
        {
            if (rating < 1 || rating > 5)
                throw new AppException("Rating must be between 1 and 5.");

            var booking = await _context.Bookings
                .Include(b => b.Driver)
                .FirstOrDefaultAsync(b => b.Id == bookingId && b.UserId == userId)
                ?? throw new AppException("Booking not found.");

            if (booking.Status != BookingStatus.Completed)
                throw new AppException("You can rate the driver only after ride completion.");

            if (booking.Driver == null)
                throw new AppException("No driver assigned for this booking.");

            booking.RiderRating = rating;
            var current = booking.Driver.Rating <= 0 ? 5.0 : booking.Driver.Rating;
            booking.Driver.Rating = Math.Round((current * 0.8) + (rating * 0.2), 2);

            await _context.SaveChangesAsync();
            return "Driver rated successfully.";
        }

        public async Task<Dictionary<string, int>> GetNearbyDriverCountsAsync(string city)
        {
            var groups = await _context.Drivers
                .Where(d => d.IsAvailable && d.City.ToLower() == city.ToLower())
                .GroupBy(d => d.CabType.ToLower())
                .Select(g => new { CabType = g.Key, Count = g.Count() })
                .ToListAsync();

            return groups.ToDictionary(x => x.CabType, x => x.Count);
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
                VehicleName = driver?.VehicleName ?? "-",
                VehicleNumber = driver?.VehicleNumber ?? "-",
                DriverLatitude = driver?.Latitude,
                DriverLongitude = driver?.Longitude,
                CabType = booking.CabType,
                PickupLocation = booking.PickupLocation,
                DropLocation = booking.DropLocation,
                PickupLatitude = booking.PickupLatitude,
                PickupLongitude = booking.PickupLongitude,
                DropLatitude = booking.DropLatitude,
                DropLongitude = booking.DropLongitude,
                Fare = booking.Fare,
                CancellationFee = booking.CancellationFee,
                EstimatedMinutes = booking.EstimatedMinutes,
                PaymentMode = string.IsNullOrWhiteSpace(booking.PaymentMode) ? "Cash" : booking.PaymentMode,
                RiderRating = booking.RiderRating,
                StartOtp = includeStartOtp ? booking.StartOtp : null,
                IsStartOtpVerified = booking.IsStartOtpVerified,
                BookedAt = booking.BookedAt
            };
        }
    }
}
