using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;
using TaxiBookingService.Models;

namespace TaxiBookingService.Data
{
    
    public class AppDbContext : DbContext
    {


        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

       
        public DbSet<User> Users { get; set; }
        public DbSet<Driver> Drivers { get; set; }
        public DbSet<Booking> Bookings { get; set; }

        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

           
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.User)
                .WithMany(u => u.Bookings)
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Restrict);

           
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.Driver)
                .WithMany(d => d.Bookings)
                .HasForeignKey(b => b.DriverId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            
            modelBuilder.Entity<Booking>()
                .Property(b => b.Status)
                .HasConversion<string>();

            
            modelBuilder.Entity<Booking>()
                .Property(b => b.Fare)
                .HasColumnType("decimal(18,2)");

            
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

        
            modelBuilder.Entity<Driver>()
                .HasIndex(d => d.Email)
                .IsUnique();
        }
    }
}