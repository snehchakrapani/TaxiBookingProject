namespace TaxiBookingService.Helpers
{
    public static class DistanceHelper
    {
        public static double Calculate(double lat1, double lon1, double lat2, double lon2)
        {
            const double EarthRadiusKm = 6371.0;
            double dLat = ToRad(lat2 - lat1);
            double dLon = ToRad(lon2 - lon1);
            double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                       Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2)) *
                       Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return EarthRadiusKm * c;
        }

        public static int EstimateMinutes(double distanceKm)
        {
            const double AvgSpeedKmPerHour = 30.0;
            return (int)Math.Ceiling((distanceKm / AvgSpeedKmPerHour) * 60);
        }

        public static decimal CalculateFare(string cabType, double distanceKm)
        {
            return cabType.ToLower() switch
            {
                "mini"  => 50  + (decimal)(distanceKm * 10),
                "sedan" => 80  + (decimal)(distanceKm * 14),
                "suv"   => 120 + (decimal)(distanceKm * 18),
                _       => 50  + (decimal)(distanceKm * 10)
            };
        }

        private static double ToRad(double degrees) => degrees * (Math.PI / 180.0);
    }
}