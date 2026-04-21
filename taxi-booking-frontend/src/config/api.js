const envBaseUrl = import.meta.env.VITE_API_BASE_URL;

const normalizeBaseUrl = (value) => value?.trim().replace(/\/+$/, "");

const inferLocalApiBaseUrl = () => {
  const isHttps = typeof window !== "undefined" && window.location?.protocol === "https:";
  return isHttps ? "https://localhost:7275" : "http://localhost:5257";
};

const normalizedEnvBaseUrl = normalizeBaseUrl(envBaseUrl);

if (import.meta.env.PROD && !normalizedEnvBaseUrl) {
  console.warn("VITE_API_BASE_URL is not set. Falling back to a localhost API URL.");
}

export const API_BASE_URL = normalizedEnvBaseUrl || inferLocalApiBaseUrl();

