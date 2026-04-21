const envBaseUrl = import.meta.env.VITE_API_BASE_URL;

const inferLocalApiBaseUrl = () => {
  const isHttps = typeof window !== "undefined" && window.location?.protocol === "https:";
  return isHttps ? "https://localhost:7275" : "http://localhost:5257";
};

export const API_BASE_URL = envBaseUrl || inferLocalApiBaseUrl();

