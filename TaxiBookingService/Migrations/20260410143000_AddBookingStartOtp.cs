using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using TaxiBookingService.Data;

#nullable disable

namespace TaxiBookingService.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260410143000_AddBookingStartOtp")]
    public partial class AddBookingStartOtp : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsStartOtpVerified",
                table: "Bookings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "StartOtp",
                table: "Bookings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartOtpGeneratedAt",
                table: "Bookings",
                type: "datetime2",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsStartOtpVerified",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "StartOtp",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "StartOtpGeneratedAt",
                table: "Bookings");
        }
    }
}
