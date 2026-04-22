import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  ClickAwayListener, Grid, IconButton, List, ListItemButton, MenuItem,
  Stack, TextField, Typography,
} from "@mui/material";
import { CloseRounded as CloseRoundedIcon, MyLocation as MyLocationIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import LeafletTripMap from "../components/LeafletTripMap";
import { useBookRideMutation, useGetNearbyDriversQuery } from "../features/booking/bookingApi";
import { CAB_TYPES, CITIES, CITY_COORDINATES } from "../constants/ride";
import { estimateFare, fetchRoute, reverseGeocode, searchPlaces, getApiError } from "../services/locationService";

const CAB_CAPACITY = { Mini: 4, Sedan: 4, SUV: 6 };
const CAB_INFO = {
  Mini:  { emoji: "🚗", desc: " hatchback", seats: 4 },
  Sedan: { emoji: "🚙", desc: " sedan",    seats: 4 },
  SUV:   { emoji: "🚐", desc: " SUV",         seats: 6 },
};

const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "rgba(255,255,255,0.04)", py: 0.3 } };

const dropdownSx = {
  position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 20,
  borderRadius: 3, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", bgcolor: "#1b2332",
};

const LocationSearchField = ({ label, open, value, options, loading, onInputChange, onClose, onSelect, sx, endAdornment, onClear }) => (
  <ClickAwayListener onClickAway={onClose}>
    <Box sx={{ position: "relative" }}>
      <TextField label={label} value={value} fullWidth sx={sx}
        onFocus={() => onInputChange(value, true)}
        onChange={(e) => onInputChange(e.target.value, true)}
        slotProps={{ input: { endAdornment: loading ? <CircularProgress size={16} /> : (
          <>
            {value ? <IconButton size="small" onClick={onClear} sx={{ color: "rgba(255,255,255,0.55)" }}><CloseRoundedIcon fontSize="small" /></IconButton> : null}
            {endAdornment}
          </>
        ) } }} />

      {open && value.trim().length >= 2 && (
        <Box component="div" elevation={8} sx={dropdownSx}>
          {loading ? (
            <Box sx={{ px: 2, py: 1.5 }}><Typography variant="body2" color="text.secondary">Searching locations...</Typography></Box>
          ) : options.length ? (
            <List disablePadding>
              {options.map((opt) => (
                <ListItemButton key={opt.id} onMouseDown={(e) => e.preventDefault()} onClick={() => onSelect(opt)}
                  sx={{ alignItems: "flex-start", px: 2, py: 1.2, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <Typography sx={{ color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    📍 {opt.shortLabel || opt.label}
                  </Typography>
                </ListItemButton>
              ))}
            </List>
          ) : (
            <Box sx={{ px: 2, py: 1.5 }}><Typography variant="body2" color="text.secondary">No locations found</Typography></Box>
          )}
        </Box>
      )}
    </Box>
  </ClickAwayListener>
);

function useAutocomplete(query, city) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen,  setIsOpen]  = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) { setOptions([]); setLoading(false); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const r = await searchPlaces(query, city);
        if (!cancelled) { setOptions(r); setIsOpen(true); }
      } catch { if (!cancelled) setOptions([]); }
      finally   { if (!cancelled) setLoading(false); }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, city]);

  return { options, loading, isOpen, setIsOpen };
}

const BookRidePage = () => {
  const navigate = useNavigate();
  const [bookRide, { isLoading }] = useBookRideMutation();
  const [error, setError] = useState("");

  const [form, setForm] = useState({ pickupLocation: "", dropLocation: "", cabType: "Sedan", city: "Jaipur", arrivalPreference: "As soon as possible" });
  const onChange = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const [pickupQuery,    setPickupQuery]    = useState("");
  const [dropQuery,      setDropQuery]      = useState("");
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [selectedDrop,   setSelectedDrop]   = useState(null);
  const [detectingLoc,   setDetectingLoc]   = useState(false);

  const pickup = useAutocomplete(pickupQuery, form.city);
  const drop   = useAutocomplete(dropQuery,   form.city);

  const [routeResult,    setRouteResult]    = useState(null);
  const [wanderingPoint, setWanderingPoint] = useState(null);
  const wanderingRef = useRef({ pos: null, target: null });

  const { data: nearbyDrivers } = useGetNearbyDriversQuery(form.city, { pollingInterval: 30000 });

  const toPoint = (sel) => {
    if (!sel) return null;
    const lat = Number(sel.lat), lng = Number(sel.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  };

  const pickupPoint   = useMemo(() => toPoint(selectedPickup), [selectedPickup]);
  const dropPoint     = useMemo(() => toPoint(selectedDrop),   [selectedDrop]);
  const estimatedFare = useMemo(() => routeResult ? estimateFare(form.cabType, routeResult.distanceKm) : null, [form.cabType, routeResult]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    setDetectingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        try {
          const label = await reverseGeocode(lat, lng);
          const loc = { id: "gps", label, shortLabel: label, lat, lng };
          setSelectedPickup(loc); setPickupQuery(label);
          setForm((p) => ({ ...p, pickupLocation: label }));
        } catch { }
        finally { setDetectingLoc(false); }
      },
      () => setDetectingLoc(false),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    setSelectedPickup(null); setSelectedDrop(null);
    setPickupQuery(""); setDropQuery("");
    setRouteResult(null);
    pickup.setIsOpen(false); drop.setIsOpen(false);
    setForm((p) => ({ ...p, pickupLocation: "", dropLocation: "" }));
  }, [form.city]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pickupPoint || !dropPoint) { setRouteResult(null); return; }
    let cancelled = false;
    fetchRoute(pickupPoint, dropPoint)
      .then((r) => { if (!cancelled) setRouteResult(r); })
      .catch(() => { if (!cancelled) setRouteResult(null); });
    return () => { cancelled = true; };
  }, [pickupPoint, dropPoint]);

  useEffect(() => {
    const cityCoords = CITY_COORDINATES[form.city];
    const ref = pickupPoint || { lat: cityCoords.latitude, lng: cityCoords.longitude };
    const rand = () => (Math.random() - 0.5) * 0.035;

    let pos = { lat: ref.lat + rand(), lng: ref.lng + rand() };
    let tgt = { lat: ref.lat + rand(), lng: ref.lng + rand() };
    wanderingRef.current = { pos, target: tgt };
    setWanderingPoint({ ...pos });

    const timer = setInterval(() => {
      const { pos: cur, target } = wanderingRef.current;
      const dlat = target.lat - cur.lat, dlng = target.lng - cur.lng;
      const dist = Math.sqrt(dlat * dlat + dlng * dlng);
      if (dist < 0.0015) {
        wanderingRef.current.target = { lat: ref.lat + rand(), lng: ref.lng + rand() };
      } else {
        const step = Math.min(0.0025, dist);
        const newPos = { lat: cur.lat + (dlat / dist) * step, lng: cur.lng + (dlng / dist) * step };
        wanderingRef.current.pos = newPos;
        setWanderingPoint({ ...newPos });
      }
    }, 1200);

    return () => clearInterval(timer);
  }, [form.city, pickupPoint?.lat, pickupPoint?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectPickup = (v) => { setSelectedPickup(v); setPickupQuery(v.shortLabel || v.label); pickup.setIsOpen(false); setForm((p) => ({ ...p, pickupLocation: v.shortLabel || v.label })); };
  const selectDrop   = (v) => { setSelectedDrop(v);   setDropQuery(v.shortLabel || v.label);   drop.setIsOpen(false);   setForm((p) => ({ ...p, dropLocation:   v.shortLabel || v.label })); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (!form.pickupLocation.trim() || !form.dropLocation.trim()) { setError("Pickup and drop locations are required."); return; }
    if (!pickupPoint || !dropPoint || !selectedPickup || !selectedDrop) { setError("Please select both locations from Indian suggestions."); return; }
    try {
      const result = await bookRide({
        ...form,
        pickupLocation: form.pickupLocation.trim(), dropLocation: form.dropLocation.trim(),
        pickupLatitude: pickupPoint.lat, pickupLongitude: pickupPoint.lng,
        dropLatitude: dropPoint.lat, dropLongitude: dropPoint.lng,
      }).unwrap();
      localStorage.setItem(`booking_map_${result.bookingId}`, JSON.stringify({
        pickup: pickupPoint, drop: dropPoint,
        route: routeResult?.points ?? [],
        summary: routeResult ? { distance: routeResult.distanceKm * 1000, duration: routeResult.durationMin * 60 } : null,
      }));
      navigate(`/ride-status/${result.bookingId}`);
    } catch (err) { setError(getApiError(err, "Unable to create booking.")); }
  };

  const nearbyChips = nearbyDrivers ? Object.entries(nearbyDrivers).map(([type, count]) => ({ type, count })) : [];

  return (
    <DashboardLayout title="Book Your Ride" subtitle="Choose your route and request a cab." links={[{ label: "Book", to: "/book" }, { label: "History", to: "/history" }]}>
      <Grid container spacing={{ xs: 4, md: 6 }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)" }}>
            <CardContent component="form" onSubmit={handleSubmit} sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
              <Typography variant="h6" sx={{ mb: 3.5, fontWeight: 700, fontSize: 20 }}>Trip Details</Typography>
              {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}
              <Stack spacing={3}>
                <LocationSearchField label="Pickup location" sx={inputSx}
                  open={pickup.isOpen} value={pickupQuery} options={pickup.isOpen ? pickup.options : []}
                  loading={pickup.loading || detectingLoc}
                  endAdornment={detectingLoc ? <CircularProgress size={16} /> : <MyLocationIcon sx={{ fontSize: 18, color: "rgba(255,255,255,0.5)" }} />}
                  onInputChange={(v, o) => { setPickupQuery(v); pickup.setIsOpen(o); setSelectedPickup(null); setForm((p) => ({ ...p, pickupLocation: v })); }}
                  onClear={() => { setPickupQuery(""); setSelectedPickup(null); setForm((p) => ({ ...p, pickupLocation: "" })); pickup.setIsOpen(false); }}
                  onClose={() => pickup.setIsOpen(false)} onSelect={selectPickup} />

                <LocationSearchField label="Drop location" sx={inputSx}
                  open={drop.isOpen} value={dropQuery} options={drop.isOpen ? drop.options : []}
                  loading={drop.loading}
                  onInputChange={(v, o) => { setDropQuery(v); drop.setIsOpen(o); setSelectedDrop(null); setForm((p) => ({ ...p, dropLocation: v })); }}
                  onClear={() => { setDropQuery(""); setSelectedDrop(null); setForm((p) => ({ ...p, dropLocation: "" })); drop.setIsOpen(false); }}
                  onClose={() => drop.setIsOpen(false)} onSelect={selectDrop} />

                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 6 }}>
                    <TextField select label="City" value={form.city} onChange={onChange("city")} fullWidth sx={inputSx}>
                      {CITIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField select label="Cab Type" value={form.cabType} onChange={onChange("cabType")} fullWidth sx={inputSx}>
                      {CAB_TYPES.map((t) => <MenuItem key={t} value={t}>{CAB_INFO[t]?.emoji} {t}</MenuItem>)}
                    </TextField>
                  </Grid>
                </Grid>

                <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                  Service available in {CITIES.length} Indian cities. Please choose pickup and drop from Indian suggestions only.
                </Typography>

                {CAB_INFO[form.cabType] && (
                  <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography sx={{ fontSize: 28 }}>{CAB_INFO[form.cabType].emoji}</Typography>
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{form.cabType} — {CAB_INFO[form.cabType].desc}</Typography>
                        <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.55)", mt: 0.3 }}>👤 {CAB_INFO[form.cabType].seats} seats</Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}

                <TextField label="Arrival preference (optional)" value={form.arrivalPreference} onChange={onChange("arrivalPreference")} fullWidth sx={inputSx} />

                <Button type="submit" variant="contained" fullWidth disabled={isLoading}
                  sx={{ py: 1.8, mt: 1, borderRadius: 3, fontWeight: 700, fontSize: 16, background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#0a0a1a" }}>
                  {isLoading ? <CircularProgress size={22} sx={{ color: "#0a0a1a" }} /> : "🚖 Confirm Ride"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ borderRadius: 5, height: "100%", border: "1px solid rgba(255,255,255,0.08)" }}>
            <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, fontSize: 20 }}>Route Preview</Typography>

              {nearbyChips.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.5)", mb: 1, fontWeight: 700, letterSpacing: 0.5 }}>
                    DRIVERS NEARBY IN {form.city.toUpperCase()}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={0.8}>
                    {nearbyChips.map(({ type, count }) => (
                      <Chip key={type} size="small"
                        label={`${CAB_INFO[type.charAt(0).toUpperCase() + type.slice(1)]?.emoji ?? "🚗"} ${count} ${type}${count !== 1 ? "s" : ""}`}
                        sx={{ bgcolor: count > 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.15)", color: count > 0 ? "#4ade80" : "#f87171", border: `1px solid ${count > 0 ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.25)"}`, fontWeight: 600, fontSize: 11 }} />
                    ))}
                  </Stack>
                </Box>
              )}

              {pickupPoint || wanderingPoint ? (
                <>
                  <LeafletTripMap pickup={pickupPoint} drop={dropPoint} routePoints={routeResult?.points ?? []} driver={wanderingPoint} height={500} />
                  {routeResult && (
                    <Stack direction="row" spacing={1.5} sx={{ mt: 3, flexWrap: "wrap", rowGap: 1.5 }}>
                      <Chip label={`📏 ${routeResult.distanceKm} km`} color="info" size="small" />
                      <Chip label={`⏱ ${routeResult.durationMin} min`} color="secondary" size="small" />
                      {estimatedFare !== null && <Chip label={`💰 Est. ₹${estimatedFare}`} size="small" sx={{ bgcolor: "rgba(34,197,94,0.2)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.35)", fontWeight: 700 }} />}
                      <Chip label={`👤 ${CAB_CAPACITY[form.cabType] ?? 4} seats`} size="small" sx={{ bgcolor: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)", fontWeight: 600 }} />
                    </Stack>
                  )}
                  {!pickupPoint && <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.45)", mt: 1, textAlign: "center" }}>🚕 Cabs are active in {form.city} — select pickup & drop to see your route</Typography>}
                </>
              ) : (
                <Box sx={{ height: 500, borderRadius: 3, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.15)" }}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography sx={{ fontSize: 40, mb: 1 }}>🗺️</Typography>
                    <Typography variant="body2" color="text.secondary">Select a city to preview the map</Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
};

export default BookRidePage;
