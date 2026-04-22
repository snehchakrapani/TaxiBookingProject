export const CITIES = [
  "Jaipur",
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata",
  "Ahmedabad",
  "Lucknow",
  "Indore",
  "Chandigarh",
];

export const CAB_TYPES = ["Mini", "Sedan", "SUV"];

export const CITY_COORDINATES = {
  Jaipur: { latitude: 26.9124, longitude: 75.7873 },
  Delhi: { latitude: 28.6139, longitude: 77.209 },
  Mumbai: { latitude: 19.076, longitude: 72.8777 },
  Bangalore: { latitude: 12.9716, longitude: 77.5946 },
  Hyderabad: { latitude: 17.385, longitude: 78.4867 },
  Chennai: { latitude: 13.0827, longitude: 80.2707 },
  Pune: { latitude: 18.5204, longitude: 73.8567 },
  Kolkata: { latitude: 22.5726, longitude: 88.3639 },
  Ahmedabad: { latitude: 23.0225, longitude: 72.5714 },
  Lucknow: { latitude: 26.8467, longitude: 80.9462 },
  Indore: { latitude: 22.7196, longitude: 75.8577 },
  Chandigarh: { latitude: 30.7333, longitude: 76.7794 },
};

export const STATUS_COLOR = {
  Pending: "warning",
  Confirmed: "info",
  InProgress: "primary",
  Completed: "success",
  Cancelled: "error",
};

export const CANCEL_REASONS = [
  "Change of plans",
  "Wrong location entered",
  "Emergency",
  "Driver took too long",
  "Other",
];

export const getApiError = (error, fallback = "Something went wrong.") => {
  if (error?.status === "FETCH_ERROR") {
    return "Cannot reach backend API. Start backend in Visual Studio and try again.";
  }
  return error?.data?.message || error?.data?.title || fallback;
};

