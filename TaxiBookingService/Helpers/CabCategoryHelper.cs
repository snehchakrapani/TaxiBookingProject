namespace TaxiBookingService.Helpers
{
    public static class CabCategoryHelper
    {
        public static int GetCapacity(string cabType)
        {
            return Normalize(cabType) switch
            {
                "mini" => 4,
                "sedan" => 4,
                "suv" => 6,
                _ => 4
            };
        }

        public static string GetLabel(string cabType)
        {
            return Normalize(cabType) switch
            {
                "mini" => "Mini",
                "sedan" => "Sedan",
                "suv" => "SUV",
                _ => string.IsNullOrWhiteSpace(cabType) ? "Standard" : cabType
            };
        }

        private static string Normalize(string cabType) =>
            cabType.Trim().ToLowerInvariant();
    }
}
