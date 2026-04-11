namespace TaxiBookingService.Helpers
{
    // Calculates straight-line distance between two GPS points
    // Used in BookingService LINQ query to sort drivers by proximity
    public static class DistanceHelper
    {
        // Returns distance in kilometers between two lat/lng points
        // Formula used: Haversine Formula (standard GPS distance calculation)
        public static double Calculate(
            double lat1, double lon1,
            double lat2, double lon2)
        {
            const double EarthRadiusKm = 6371.0;

            // Convert degrees to radians 
            double dLat = ToRad(lat2 - lat1);
            double dLon = ToRad(lon2 - lon1);

            // Haversine formula core
            double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                       Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2)) *
                       Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return EarthRadiusKm * c;  // Distance in km
        }

        // ETA in minutes = distance / assumed average speed (30 km/h in city)
        public static int EstimateMinutes(double distanceKm)
        {
            const double AvgSpeedKmPerHour = 30.0;
            return (int)Math.Ceiling((distanceKm / AvgSpeedKmPerHour) * 60);
        }

        // Fare = base fare + per km rate × distance
        // Mini: ₹50 base + ₹10/km | Sedan: ₹80 + ₹14/km | SUV: ₹120 + ₹18/km
        public static decimal CalculateFare(string cabType, double distanceKm)
        {
            return cabType.ToLower() switch
            {
                "mini" => 50 + (decimal)(distanceKm * 10),
                "sedan" => 80 + (decimal)(distanceKm * 14),
                "suv" => 120 + (decimal)(distanceKm * 18),
                _ => 50 + (decimal)(distanceKm * 10)   
            };
        }

        private static double ToRad(double degrees) =>
            degrees * (Math.PI / 180.0);
    }
}