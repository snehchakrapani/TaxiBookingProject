namespace TaxiBookingService.Exceptions
{
    /// <summary>
    /// Thrown for known business-logic violations (returns HTTP 400).
    /// Anything else propagates as HTTP 500.
    /// </summary>
    public class AppException : Exception
    {
        public AppException(string message) : base(message) { }
    }
}
