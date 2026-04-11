using TaxiBookingService.Data;
using TaxiBookingService.DTOs.Auth;
using TaxiBookingService.DTOs.Driver;
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
            bool emailExists = await _context.Users
                .AnyAsync(u => u.Email == dto.Email);

            if (emailExists)
                throw new Exception("Email is already registered.");

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Phone = dto.Phone
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

           
            var token = _jwtHelper.GenerateToken(user.Id, user.Email, "User");

            return new AuthResponseDto
            {
                Token = token,
                Name = user.Name,
                Email = user.Email,
                Role = "User"
            };
        }

        public async Task<AuthResponseDto> RegisterDriverAsync(DriverRegisterDto dto)
        {
            bool emailExists = await _context.Drivers
                .AnyAsync(d => d.Email == dto.Email);

            if (emailExists)
                throw new Exception("Email is already registered.");

            var driver = new Driver
            {
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Phone = dto.Phone,
                CabType = dto.CabType,
                City = dto.City,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                IsAvailable = true,
                Rating = 5.0
            };

            _context.Drivers.Add(driver);
            await _context.SaveChangesAsync();

            var token = _jwtHelper.GenerateToken(driver.Id, driver.Email, "Driver");

            return new AuthResponseDto
            {
                Token = token,
                Name = driver.Name,
                Email = driver.Email,
                Role = "Driver"
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            // Try User table first
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user != null)
            {
                // BCrypt.Verify compares plain password against stored hash
                bool passwordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);

                if (!passwordValid)
                    throw new Exception("Invalid password.");

                var token = _jwtHelper.GenerateToken(user.Id, user.Email, "User");

                return new AuthResponseDto
                {
                    Token = token,
                    Name = user.Name,
                    Email = user.Email,
                    Role = "User"
                };
            }

            // If not a User, check Driver table
            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.Email == dto.Email);

            if (driver != null)
            {
                bool passwordValid = BCrypt.Net.BCrypt.Verify(dto.Password, driver.PasswordHash);

                if (!passwordValid)
                    throw new Exception("Invalid password.");

                var token = _jwtHelper.GenerateToken(driver.Id, driver.Email, "Driver");

                return new AuthResponseDto
                {
                    Token = token,
                    Name = driver.Name,
                    Email = driver.Email,
                    Role = "Driver"
                };
            }

            throw new Exception("No account found with this email.");
        }
    }
}