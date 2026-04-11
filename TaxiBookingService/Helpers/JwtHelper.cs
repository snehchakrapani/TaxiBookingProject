using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace TaxiBookingService.Helpers
{
    
    public class JwtHelper
    {
        private readonly IConfiguration _config;

        
        public JwtHelper(IConfiguration config)
        {
            _config = config;
        }

        public string GenerateToken(int userId, string email, string role)
        {
            
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()), 
                new Claim(ClaimTypes.Email, email),                       
                new Claim(ClaimTypes.Role, role)                           
            };

       
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_config["JwtSettings:SecretKey"]!)
            );

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            
            var token = new JwtSecurityToken(
                issuer: _config["JwtSettings:Issuer"],
                audience: _config["JwtSettings:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(
                    double.Parse(_config["JwtSettings:ExpiryInMinutes"]!)
                ),
                signingCredentials: creds
            );

           
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}