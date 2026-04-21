export const NOMINATIM_URL = import.meta.env.DEV
  ? "/nominatim-api"
  : "https://nominatim.openstreetmap.org";
export const PHOTON_URL = import.meta.env.DEV
  ? "/photon-api"
  : "https://photon.komoot.io/api";
export const OSRM_URL = import.meta.env.DEV
  ? "/osrm-api"
  : "https://router.project-osrm.org/route/v1/driving";
