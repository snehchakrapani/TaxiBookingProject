import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const circleIcon = (color, size = 18) =>
  L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.45)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

const carIcon = () =>
  L.divIcon({
    className: "",
    html: `<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#ef4444);border:3px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;">🚕</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

const driverPinIcon = () =>
  L.divIcon({
    className: "",
    html: `<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#38bdf8,#0ea5e9);border:3px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1;">🧑</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

export default function LeafletTripMap({
  pickup, drop, routePoints = [], driverToPickupRoute = [],
  driver, driverOnly = false, height = 460,
}) {
  const containerRef   = useRef(null);
  const mapRef         = useRef(null);
  const pickupMarker   = useRef(null);
  const dropMarker     = useRef(null);
  const driverMarker   = useRef(null);
  const mainRoute      = useRef(null);
  const d2pRoute       = useRef(null);
  const fitKeyRef      = useRef("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const center = driver ? [driver.lat, driver.lng] : pickup ? [pickup.lat, pickup.lng] : [26.9124, 75.7873];
    const map = L.map(containerRef.current, { center, zoom: 13, zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors", maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    setReady(true);
    return () => { map.remove(); mapRef.current = null; setReady(false); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    if (mainRoute.current) { map.removeLayer(mainRoute.current); mainRoute.current = null; }
    const mainPts = routePoints.length >= 2 ? routePoints : (pickup && drop ? [pickup, drop] : []);
    if (mainPts.length >= 2) {
      mainRoute.current = L.polyline(mainPts.map((p) => [p.lat, p.lng]), {
        color: "#f59e0b", weight: 6, opacity: 1, lineJoin: "round", lineCap: "round",
      }).addTo(map);
    }

    if (d2pRoute.current) { map.removeLayer(d2pRoute.current); d2pRoute.current = null; }
    if (!driverOnly && driverToPickupRoute.length >= 2) {
      d2pRoute.current = L.polyline(driverToPickupRoute.map((p) => [p.lat, p.lng]), {
        color: "#38bdf8", weight: 4, opacity: 0.9, dashArray: "10 8", lineJoin: "round",
      }).addTo(map);
    }

    if (!driverOnly && pickup) {
      const ll = [pickup.lat, pickup.lng];
      if (!pickupMarker.current) {
        pickupMarker.current = L.marker(ll, { icon: circleIcon("#22c55e", 20) }).addTo(map);
        pickupMarker.current.bindTooltip("📍 Pickup", { direction: "top" });
      } else { pickupMarker.current.setLatLng(ll); }
    }

    if (!driverOnly && drop) {
      const ll = [drop.lat, drop.lng];
      if (!dropMarker.current) {
        dropMarker.current = L.marker(ll, { icon: circleIcon("#ef4444", 20) }).addTo(map);
        dropMarker.current.bindTooltip("🏁 Drop", { direction: "top" });
      } else { dropMarker.current.setLatLng(ll); }
    }

    const allPts = [
      ...(mainPts.length >= 2 ? mainPts : []),
      ...(driverToPickupRoute.length >= 2 ? driverToPickupRoute : []),
    ];
    const fitKey = JSON.stringify({ pickup, drop, mainPts, driverToPickupRoute, driverOnly });
    if (allPts.length >= 2 && fitKeyRef.current !== fitKey) {
      fitKeyRef.current = fitKey;
      map.fitBounds(L.latLngBounds(allPts.map((p) => [p.lat, p.lng])), {
        padding: [52, 52], animate: true, duration: 0.8,
      });
    }
  }, [pickup, drop, routePoints, driverToPickupRoute, driverOnly, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (!driver) {
      if (driverMarker.current) { map.removeLayer(driverMarker.current); driverMarker.current = null; }
      return;
    }
    const ll = [driver.lat, driver.lng];
    const icon = driverOnly ? driverPinIcon() : carIcon();
    if (!driverMarker.current) {
      driverMarker.current = L.marker(ll, { icon, zIndexOffset: 1000 }).addTo(map);
      driverMarker.current.bindTooltip(driverOnly ? "📍 You" : "🚕 Driver", { direction: "top" });
    } else {
      driverMarker.current.setLatLng(ll);
    }
    if (driverOnly) map.setView(ll, map.getZoom(), { animate: true });
  }, [driver, driverOnly, ready]);

  return (
    <Box ref={containerRef} sx={{ width: "100%", height, borderRadius: 3, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.28)" }} />
  );
}
