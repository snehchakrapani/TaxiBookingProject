using TaxiBookingService.Data;
using TaxiBookingService.DTOs.Auth;
using TaxiBookingService.DTOs.Driver;
using TaxiBookingService.Exceptions;
using TaxiBookingService.Helpers;
using TaxiBookingService.Interfaces;
using TaxiBookingService.Models;
using Microsoft.EntityFrameworkCore;

namespace TaxiBookingService.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly JwtHelper _jwtHelper;

        public AuthService(AppDbContext context, JwtHelper jwtHelper)
        {
            _context = context;
            _jwtHelper = jwtHelper;
        }

        public async Task<AuthResponseDto> RegisterUserAsync(RegisterDto dto)
        {
            bool emailExists = await _context.Users.AnyAsync(u => u.Email == dto.Email);
            if (emailExists)
                throw new AppException("Email is already registered.");

            var phone = string.IsNullOrWhiteSpace(dto.Phone)
                ? dto.PhoneNumber?.Trim() ?? string.Empty
                : dto.Phone.Trim();

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Phone = phone
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = _jwtHelper.GenerateToken(user.Id, user.Email, "User");

            return new AuthResponseDto { Token = token, Name = user.Name, Email = user.Email, Role = "User" };
        }

        public async Task<AuthResponseDto> RegisterDriverAsync(DriverRegisterDto dto)
        {
            bool emailExists = await _context.Drivers.AnyAsync(d => d.Email == dto.Email);
            if (emailExists)
                throw new AppException("Email is already registered.");

            var phone = string.IsNullOrWhiteSpace(dto.Phone)
                ? dto.PhoneNumber?.Trim() ?? string.Empty
                : dto.Phone.Trim();

            var driver = new Driver
            {
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Phone = phone,
                CabType = dto.CabType,
                VehicleName = dto.VehicleName,
                VehicleNumber = dto.VehicleNumber,
                City = dto.City,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                IsAvailable = true,
                Rating = 5.0
            };

            _context.Drivers.Add(driver);
            await _context.SaveChangesAsync();

            var token = _jwtHelper.GenerateToken(driver.Id, driver.Email, "Driver");

            return new AuthResponseDto { Token = token, Name = driver.Name, Email = driver.Email, Role = "Driver" };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user != null)
            {
                if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                    throw new AppException("Invalid password.");

                var token = _jwtHelper.GenerateToken(user.Id, user.Email, "User");
                return new AuthResponseDto { Token = token, Name = user.Name, Email = user.Email, Role = "User" };
            }

            var driver = await _context.Drivers.FirstOrDefaultAsync(d => d.Email == dto.Email);
            if (driver != null)
            {
                if (!BCrypt.Net.BCrypt.Verify(dto.Password, driver.PasswordHash))
                    throw new AppException("Invalid password.");

                var token = _jwtHelper.GenerateToken(driver.Id, driver.Email, "Driver");
                return new AuthResponseDto { Token = token, Name = driver.Name, Email = driver.Email, Role = "Driver" };
            }

            throw new AppException("No account found with this email.");
        }
    }
}
