using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using TaxiBookingService.Data;
using TaxiBookingService.DTOs.Booking;
using TaxiBookingService.DTOs.Driver;
using TaxiBookingService.Helpers;
using TaxiBookingService.Interfaces;
using TaxiBookingService.Models;

namespace TaxiBookingService.Services
{
    public class DriverService : IDriverService
    {
        private readonly AppDbContext _context;

        public DriverService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<BookingResponseDto>> GetPendingRequestsAsync(int driverId)
        {
            var driver = await _context.Drivers.FindAsync(driverId)
                ?? throw new Exception("Driver not found.");

            var bookings = await _context.Bookings
                .Include(b => b.Driver)
                .Where(b => b.Status == BookingStatus.Pending
                         && b.CabType.ToLower() == driver.CabType.ToLower()
                         && b.City.ToLower() == driver.City.ToLower())
                .OrderBy(b => b.BookedAt)
                .ToListAsync();

            return bookings.Select(b => new BookingResponseDto
            {
                BookingId = b.Id,
                Status = b.Status.ToString(),
                CabCategoryLabel = CabCategoryHelper.GetLabel(b.CabType),
                CabCapacity = CabCategoryHelper.GetCapacity(b.CabType),
                PickupLocation = b.PickupLocation,
                DropLocation = b.DropLocation,
                CabType = b.CabType,
                Fare = b.Fare,
                EstimatedMinutes = b.EstimatedMinutes,
                BookedAt = b.BookedAt,
                IsStartOtpVerified = b.IsStartOtpVerified,
                DriverName = b.Driver?.Name ?? "-",
                DriverPhone = b.Driver?.Phone ?? "-",
                DriverRating = b.Driver?.Rating ?? 0
            }).ToList();
        }

        public async Task<string> AcceptBookingAsync(int driverId, int bookingId)
        {
            var driver = await _context.Drivers.FindAsync(driverId)
                ?? throw new Exception("Driver not found.");

            if (!driver.IsAvailable)
                throw new Exception("Driver is not available to accept a booking.");

            var booking = await _context.Bookings
                .FirstOrDefaultAsync(b => b.Id == bookingId
                                       && b.Status == BookingStatus.Pending);

            if (booking == null)
                throw new Exception("Booking not found or already taken.");

            if (!string.Equals(booking.CabType, driver.CabType, StringComparison.OrdinalIgnoreCase) ||
                !string.Equals(booking.City, driver.City, StringComparison.OrdinalIgnoreCase))
            {
                throw new Exception("This booking is not eligible for the driver.");
            }

            booking.DriverId = driverId;
            booking.Status = BookingStatus.Confirmed;
            booking.StartOtp = RandomNumberGenerator.GetInt32(0, 10000).ToString("D4");
            booking.StartOtpGeneratedAt = DateTime.UtcNow;
            booking.IsStartOtpVerified = false;

            driver.IsAvailable = false;

            await _context.SaveChangesAsync();
            return "Booking accepted successfully.";
        }

        public async Task<string> DeclineBookingAsync(int driverId, int bookingId)
        {
            var booking = await _context.Bookings
                .FirstOrDefaultAsync(b => b.Id == bookingId
                                       && b.DriverId == driverId);

            if (booking == null)
                throw new Exception("Booking not found.");

            booking.DriverId = null;
            booking.Status = BookingStatus.Pending;
            booking.StartOtp = null;
            booking.StartOtpGeneratedAt = null;
            booking.IsStartOtpVerified = false;

            var driver = await _context.Drivers.FindAsync(driverId);
            if (driver != null) driver.IsAvailable = true;

            await _context.SaveChangesAsync();
            return "Booking declined.";
        }

        public async Task<string> UpdateLocationAsync(int driverId, UpdateLocationDto dto)
        {
            var driver = await _context.Drivers.FindAsync(driverId)
                ?? throw new Exception("Driver not found.");

            driver.Latitude = dto.Latitude;
            driver.Longitude = dto.Longitude;

            await _context.SaveChangesAsync();
            return "Location updated successfully.";
        }

        public async Task<string> UpdateAvailabilityAsync(int driverId, UpdateAvailabilityDto dto)
        {
            var driver = await _context.Drivers.FindAsync(driverId)
                ?? throw new Exception("Driver not found.");

            driver.IsAvailable = dto.IsAvailable;

            await _context.SaveChangesAsync();
            return $"Availability set to {dto.IsAvailable}.";
        }

        public async Task<string> VerifyStartOtpAsync(int driverId, VerifyStartOtpDto dto)
        {
            var booking = await _context.Bookings
                .FirstOrDefaultAsync(b => b.Id == dto.BookingId
                                       && b.DriverId == driverId
                                       && b.Status == BookingStatus.Confirmed);

            if (booking == null)
                throw new Exception("Booking not found or not ready to start.");

            if (string.IsNullOrWhiteSpace(booking.StartOtp))
                throw new Exception("Start OTP is not available for this booking.");

            if (!string.Equals(booking.StartOtp, dto.Otp?.Trim(), StringComparison.Ordinal))
                throw new Exception("Invalid start OTP.");

            booking.IsStartOtpVerified = true;
            booking.Status = BookingStatus.InProgress;

            await _context.SaveChangesAsync();
            return "OTP verified. Ride started successfully.";
        }

        public async Task<string> CompleteRideAsync(int driverId, int bookingId)
        {
            var booking = await _context.Bookings
                .FirstOrDefaultAsync(b => b.Id == bookingId
                                       && b.DriverId == driverId
                                       && b.Status == BookingStatus.InProgress);

            if (booking == null)
                throw new Exception("Booking not found or ride has not started.");

            booking.Status = BookingStatus.Completed;
            booking.CompletedAt = DateTime.UtcNow;
            booking.StartOtp = null;

            var driver = await _context.Drivers.FindAsync(driverId);
            if (driver != null) driver.IsAvailable = true;

            await _context.SaveChangesAsync();
            return "Ride marked as completed.";
        }
    }
}
