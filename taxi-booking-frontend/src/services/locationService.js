import axios from "axios";
import { NOMINATIM_URL, OSRM_URL, PHOTON_URL } from "../config/mapConfig";

const nominatim = axios.create({ baseURL: NOMINATIM_URL, timeout: 10000 });
const photon = axios.create({ baseURL: PHOTON_URL, timeout: 10000 });
const osrm = axios.create({ timeout: 10000 });
const cache = new Map();

function buildShortLabel(item) {
  const address = item.address || {};
  const parts = [
    address.name || address.road || address.neighbourhood || address.suburb,
    address.city || address.town || address.village || address.county,
    address.state,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : item.display_name.split(",").slice(0, 3).join(", ");
}

function toPlace(item) {
  return {
    id: `n-${item.place_id}`,
    label: item.display_name,
    shortLabel: buildShortLabel(item),
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  };
}

function photonToPlace(feature, index) {
  const coords = feature?.geometry?.coordinates || [];
  const props = feature?.properties || {};
  const parts = [props.name, props.street, props.district || props.suburb, props.city || props.county, props.state].filter(Boolean);
  return {
    id: `p-${props.osm_id || index}`,
    label: parts.join(", ") || props.name || "",
    shortLabel: [props.name, props.city || props.county, props.state].filter(Boolean).join(", "),
    lat: Number(coords[1]),
    lng: Number(coords[0]),
  };
}

function dedup(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.lat.toFixed(4)}|${item.lng.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function rank(items, query) {
  const q = query.trim().toLowerCase();
  return items
    .map((item) => {
      const label = (item.shortLabel || item.label).toLowerCase();
      let score = 0;
      if (label.startsWith(q)) score += 60;
      else if (label.includes(q)) score += 35;
      q.split(/\s+/).forEach((t) => { if (t.length > 1 && label.includes(t)) score += 10; });
      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ score, ...item }) => item);
}

async function fromPhoton(query) {
  const { data } = await photon.get("", { params: { q: `${query}, India`, limit: 12, lang: "en" } });
  return Array.isArray(data?.features)
    ? data.features.map(photonToPlace).filter((i) => Number.isFinite(i.lat) && Number.isFinite(i.lng))
    : [];
}

async function fromNominatim(query) {
  const { data } = await nominatim.get("/search", {
    params: { q: query, format: "jsonv2", addressdetails: 1, limit: 12, countrycodes: "in", dedupe: 1, "accept-language": "en-IN" },
  });
  return Array.isArray(data) ? data.map(toPlace) : [];
}

export async function searchPlaces(query, city = "") {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) return [];

  const key = `${city}::${normalizedQuery}`.toLowerCase();
  if (cache.has(key)) return cache.get(key);

  let photonResults = [], nominatimResults = [];
  try {
    [photonResults, nominatimResults] = await Promise.all([
      fromPhoton(normalizedQuery).catch(() => []),
      fromNominatim(normalizedQuery).catch(() => []),
    ]);
  } catch { /* handled above */ }

  let results = [...photonResults, ...nominatimResults];
  if (!results.length) {
    try {
      [photonResults, nominatimResults] = await Promise.all([
        fromPhoton(normalizedQuery).catch(() => []),
        fromNominatim(`${normalizedQuery}, India`).catch(() => []),
      ]);
      results = [...photonResults, ...nominatimResults];
    } catch { /* all attempts failed */ }
  }

  const finalResults = rank(dedup(results), normalizedQuery).slice(0, 8);
  if (finalResults.length) cache.set(key, finalResults);
  return finalResults;
}

export async function reverseGeocode(lat, lng) {
  try {
    const { data } = await nominatim.get("/reverse", {
      params: { lat, lon: lng, format: "jsonv2", addressdetails: 1, "accept-language": "en-IN" },
    });
    return buildShortLabel(data) || data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export async function fetchRoute(origin, destination) {
  if (!origin || !destination) return null;
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const { data } = await osrm.get(`${OSRM_URL}/${coords}`, {
    params: { overview: "full", geometries: "geojson", steps: false },
  });
  const route = data?.routes?.[0];
  if (!route) return null;
  return {
    points: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
    distanceKm: Math.round(route.distance / 100) / 10,
    durationMin: Math.round(route.duration / 60),
  };
}

export function estimateFare(cabType, distanceKm) {
  const d = Number(distanceKm) || 0;
  const t = (cabType || "").trim().toLowerCase();
  if (t === "sedan") return Math.round((80 + d * 14) * 100) / 100;
  if (t === "suv") return Math.round((120 + d * 18) * 100) / 100;
  return Math.round((50 + d * 10) * 100) / 100;
}

export function getApiError(error, fallback = "Something went wrong.") {
  if (error?.status === "FETCH_ERROR")
    return "Cannot reach backend API. Start backend in Visual Studio and try again.";
  return error?.data?.message || error?.data?.title || fallback;
}
