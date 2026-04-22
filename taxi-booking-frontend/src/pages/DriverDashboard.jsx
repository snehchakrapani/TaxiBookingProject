import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Divider, Grid, IconButton, LinearProgress, Snackbar, Stack,
  Switch, Tab, Tabs, TextField, Typography,
} from "@mui/material";
import CloseIcon       from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon      from "@mui/icons-material/Cancel";
import MyLocationIcon  from "@mui/icons-material/MyLocation";
import DashboardLayout from "../components/DashboardLayout";
import LeafletTripMap  from "../components/LeafletTripMap";
import {
  useGetPendingRequestsQuery, useGetCurrentBookingQuery, useGetDriverHistoryQuery,
  useAcceptBookingMutation, useDeclineBookingMutation, useUpdateLocationMutation,
  useUpdateAvailabilityMutation, useVerifyStartOtpMutation, useCompleteRideMutation,
  useCancelAcceptedRideMutation,
} from "../features/driver/driverApi";
import { fetchRoute } from "../services/locationService";

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[880, 0], [660, 0.28]].forEach(([freq, delay]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.5, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.22);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.22);
    });
    setTimeout(() => ctx.close(), 900);
  } catch (_) {}
}

function interpolatePoint(points, progress) {
  if (!points || points.length < 2) return null;
  const idx = Math.min(Math.floor(progress * (points.length - 1)), points.length - 2);
  const t  = (progress * (points.length - 1)) - idx;
  const p1 = points[idx], p2 = points[idx + 1];
  return { lat: p1.lat + (p2.lat - p1.lat) * t, lng: p1.lng + (p2.lng - p1.lng) * t };
}

const CANCEL_REASONS = [
  "No answer from user", "Wrong location entered by user",
  "Taking too much time to reach", "Safety concern", "Vehicle breakdown",
];

export default function DriverDashboard() {
  const [tab,           setTab]           = useState(0);
  const [isAvailable,   setIsAvailable]   = useState(true);
  const [driverLocation,setDriverLocation]= useState(null);
  const [otp,           setOtp]           = useState("");
  const [flashBooking,  setFlashBooking]  = useState(null);
  const [cancelReason,  setCancelReason]  = useState(CANCEL_REASONS[0]);
  const [declinedIds,   setDeclinedIds]   = useState([]);
  const [activeRoutePoints, setActiveRoutePoints] = useState([]);
  const [driverToPickupPts, setDriverToPickupPts] = useState([]);
  const [animProgress,  setAnimProgress]  = useState(0);
  const [routeLoading,  setRouteLoading]  = useState(false);
  const [actionMsg,     setActionMsg]     = useState("");
  const [actionErr,     setActionErr]     = useState("");
  const prevIdsRef = useRef(new Set());
  const animRef    = useRef(null);

  const { data: requests = [], isFetching: reqFetching } = useGetPendingRequestsQuery(undefined, { pollingInterval: 10000 });
  const { data: currentBooking } = useGetCurrentBookingQuery(undefined, { pollingInterval: 10000 });
  const { data: history }        = useGetDriverHistoryQuery(undefined, { pollingInterval: 20000 });

  const [acceptBooking,      { isLoading: accepting       }] = useAcceptBookingMutation();
  const [declineBooking,     { isLoading: declining       }] = useDeclineBookingMutation();
  const [updateLocation,     { isLoading: locLoading      }] = useUpdateLocationMutation();
  const [updateAvailability]                                  = useUpdateAvailabilityMutation();
  const [verifyStartOtp,     { isLoading: verifying       }] = useVerifyStartOtpMutation();
  const [completeRide,       { isLoading: completing      }] = useCompleteRideMutation();
  const [cancelAcceptedRide, { isLoading: driverCancelling}] = useCancelAcceptedRideMutation();

  const msg = (m, e = "") => { setActionMsg(m); setActionErr(e); };

  const doAction = async (fn, successMsg, errFallback = "Action failed.") => {
    msg("");
    try { await fn(); msg(successMsg); }
    catch (e) { msg("", e?.data?.message || errFallback); }
  };

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setDriverLocation({ lat, lng });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (!requests.length) { prevIdsRef.current = new Set(); return; }
    setDeclinedIds((ids) => ids.filter((id) => requests.some((r) => r.bookingId === id)));
    const currentIds = new Set(requests.map((r) => r.bookingId));
    const newOnes    = requests.filter((r) => !prevIdsRef.current.has(r.bookingId));
    if (prevIdsRef.current.size > 0 && newOnes.length > 0) { setFlashBooking(newOnes[0]); playBeep(); }
    prevIdsRef.current = currentIds;
  }, [requests]);

  useEffect(() => {
    if (!currentBooking) { setActiveRoutePoints([]); setDriverToPickupPts([]); setAnimProgress(0); return; }
    const pickup = { lat: currentBooking.pickupLatitude, lng: currentBooking.pickupLongitude };
    const drop   = { lat: currentBooking.dropLatitude,   lng: currentBooking.dropLongitude   };
    if (pickup.lat === 0 && pickup.lng === 0) return;

    setRouteLoading(true);
    const d2pPromise = (currentBooking.status === "Confirmed" && driverLocation) ? fetchRoute(driverLocation, pickup) : Promise.resolve(null);
    Promise.all([fetchRoute(pickup, drop), d2pPromise])
      .then(([main, d2p]) => { setActiveRoutePoints(main?.points ?? []); setDriverToPickupPts(d2p?.points ?? []); })
      .catch(() => {})
      .finally(() => setRouteLoading(false));
  }, [currentBooking?.bookingId, currentBooking?.status, driverLocation?.lat, driverLocation?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentBooking?.status !== "InProgress") { clearInterval(animRef.current); setAnimProgress(0); return; }
    animRef.current = setInterval(() => setAnimProgress((p) => Math.min(p + 0.003, 0.98)), 1000);
    return () => clearInterval(animRef.current);
  }, [currentBooking?.status]);

  const pickupPoint = currentBooking ? { lat: currentBooking.pickupLatitude, lng: currentBooking.pickupLongitude } : null;
  const dropPoint   = currentBooking ? { lat: currentBooking.dropLatitude,   lng: currentBooking.dropLongitude   } : null;

  const activeTripDriver = useMemo(() => {
    if (currentBooking?.status === "InProgress" && activeRoutePoints.length >= 2)
      return interpolatePoint(activeRoutePoints, animProgress);
    return driverLocation;
  }, [currentBooking?.status, activeRoutePoints, animProgress, driverLocation]);

  const handleAccept = async (bookingId) => {
    await doAction(() => acceptBooking(bookingId).unwrap(), "Booking accepted! Check Active Trip tab.");
    setFlashBooking(null); setTab(1);
  };

  const handleDecline = (bookingId) => {
    setDeclinedIds((ids) => [...new Set([...ids, bookingId])]);
    return doAction(() => declineBooking(bookingId).unwrap(), "Booking declined.");
  };

  const handleLocationUpdate = () => {
    if (!navigator.geolocation) { msg("", "Geolocation is not supported on this device."); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setDriverLocation({ lat, lng });
        doAction(() => updateLocation({ latitude: lat, longitude: lng }).unwrap(), "Location updated.");
      },
      () => msg("", "Unable to read your current location."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleAvailability = async (e) => {
    const val = e.target.checked; setIsAvailable(val);
    try { await updateAvailability({ isAvailable: val }).unwrap(); }
    catch { setIsAvailable(!val); }
  };

  const handleVerifyOtp = () => doAction(() => verifyStartOtp({ bookingId: currentBooking.bookingId, otp: otp.trim() }).unwrap(), "OTP verified! Ride is now in progress.");
  const handleComplete  = () => doAction(() => completeRide(currentBooking.bookingId).unwrap(), "Ride completed! Well done.");

  return (
    <DashboardLayout title="Driver Dashboard" subtitle="Manage your rides and earnings." links={[{ label: "Dashboard", to: "/driver" }]}>
      <Snackbar open={!!flashBooking} onClose={() => setFlashBooking(null)} anchorOrigin={{ vertical: "top", horizontal: "right" }} autoHideDuration={25000} sx={{ top: { xs: 70, sm: 80 } }}>
        <Card sx={{ minWidth: 320, borderRadius: 3, background: "linear-gradient(135deg,#1a2744,#1b2332)", border: "2px solid #f59e0b", boxShadow: "0 8px 32px rgba(245,158,11,0.3)" }}>
          <CardContent sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Typography sx={{ fontWeight: 800, color: "#f59e0b", fontSize: 14 }}>🔔 New Ride Request!</Typography>
              <IconButton size="small" onClick={() => setFlashBooking(null)} sx={{ color: "rgba(255,255,255,0.5)", mt: -0.5 }}><CloseIcon fontSize="small" /></IconButton>
            </Stack>
            {flashBooking && (
              <Box sx={{ mt: 1 }}>
                <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>📍 <strong>Pickup:</strong> {flashBooking.pickupLocation}</Typography>
                <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>🏁 <strong>Drop:</strong> {flashBooking.dropLocation}</Typography>
                <Typography sx={{ fontSize: 12, color: "#4ade80", fontWeight: 700, mt: 0.5 }}>💰 ₹{flashBooking.fare}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                  <Button size="small" variant="contained" onClick={() => handleAccept(flashBooking.bookingId)} disabled={accepting}
                    sx={{ flex: 1, borderRadius: 2, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontWeight: 700 }}>✅ Accept</Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => { handleDecline(flashBooking.bookingId); setFlashBooking(null); }} sx={{ flex: 1, borderRadius: 2 }}>✖ Decline</Button>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      </Snackbar>

      {actionMsg && <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }} onClose={() => setActionMsg("")}>{actionMsg}</Alert>}
      {actionErr && <Alert severity="error"   sx={{ mb: 3, borderRadius: 3 }} onClose={() => setActionErr("")}>{actionErr}</Alert>}

      <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)", mb: 5 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ "& .MuiTab-root": { color: "rgba(255,255,255,0.5)", fontWeight: 600, py: 2, fontSize: 14 }, "& .Mui-selected": { color: "#f59e0b" }, "& .MuiTabs-indicator": { bgcolor: "#f59e0b", height: 3, borderRadius: 2 } }}>
          <Tab label={`🚖 Requests${requests.length > 0 ? ` (${requests.length})` : ""}`} />
          <Tab label="🗺 Active Trip" />
          <Tab label="💰 Earnings" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <Grid container spacing={{ xs: 4, md: 6 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 5, mb: 4, border: "1px solid rgba(255,255,255,0.08)" }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 17 }}>Availability</Typography>
                    <Chip size="small" label={isAvailable ? "🟢 Online" : "🔴 Offline"} sx={{ mt: 1, bgcolor: isAvailable ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: isAvailable ? "#4ade80" : "#f87171", fontWeight: 600, fontSize: 12 }} />
                  </Box>
                  <Switch checked={isAvailable} onChange={handleAvailability} color="success" />
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)" }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                  <MyLocationIcon sx={{ color: "#38bdf8", fontSize: 20 }} />
                  <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Your Location</Typography>
                </Stack>
                <Stack spacing={2.5}>
                  <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                    {driverLocation ? `Current coordinates: ${driverLocation.lat.toFixed(6)}, ${driverLocation.lng.toFixed(6)}` : "Current location not available yet."}
                  </Typography>
                  <Button variant="outlined" disabled={locLoading} onClick={handleLocationUpdate} sx={{ borderRadius: 3, py: 1.2 }}>
                    {locLoading ? <CircularProgress size={16} /> : "📍 Update Location"}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            {driverLocation && (
              <Card sx={{ borderRadius: 5, mb: 4, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                <LeafletTripMap driver={driverLocation} driverOnly height={320} />
              </Card>
            )}

            {reqFetching && <LinearProgress sx={{ mb: 1, borderRadius: 2 }} />}

            {requests.length === 0 ? (
              <Card sx={{ borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)" }}>
                <CardContent sx={{ py: 8, textAlign: "center" }}>
                  <Typography sx={{ fontSize: 48, mb: 2 }}>🔍</Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>No pending requests in your area right now.</Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.35)", fontSize: 13, mt: 1 }}>Stay online and we'll notify you.</Typography>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={3}>
                {requests.filter((req) => !declinedIds.includes(req.bookingId)).map((req) => (
                  <Card key={req.bookingId} sx={{ borderRadius: 5, border: "1px solid rgba(245,158,11,0.2)" }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" gap={0.8}>
                            <Chip label={req.cabCategoryLabel || req.cabType} size="small" sx={{ bgcolor: "rgba(245,158,11,0.15)", color: "#fbbf24", fontWeight: 700 }} />
                            <Chip label={`${req.cabCapacity} seats`}          size="small" sx={{ bgcolor: "rgba(255,255,255,0.07)", fontSize: 12 }} />
                            <Chip label={`₹${req.fare}`}                      size="small" sx={{ bgcolor: "rgba(34,197,94,0.15)", color: "#4ade80", fontWeight: 700 }} />
                          </Stack>
                          <Typography sx={{ fontSize: 14, mb: 0.8 }}>📍 <strong>Pickup:</strong> {req.pickupLocation}</Typography>
                          <Typography sx={{ fontSize: 14, mb: 0.8 }}>🏁 <strong>Drop:</strong> {req.dropLocation}</Typography>
                          <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.45)", mt: 1 }}>
                            🕐 {new Date(req.bookedAt).toLocaleTimeString("en-IN")} &nbsp;|&nbsp; ⏱ {req.estimatedMinutes} min
                          </Typography>
                        </Box>
                        <Stack spacing={1.5} sx={{ minWidth: 120 }}>
                          <Button variant="contained" startIcon={<CheckCircleIcon fontSize="small" />} onClick={() => handleAccept(req.bookingId)} disabled={accepting}
                            sx={{ borderRadius: 3, py: 1.2, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontWeight: 700, whiteSpace: "nowrap" }}>Accept</Button>
                          <Button variant="outlined" color="error" startIcon={<CancelIcon fontSize="small" />} onClick={() => handleDecline(req.bookingId)} disabled={declining}
                            sx={{ borderRadius: 3, py: 1 }}>Decline</Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Grid container spacing={{ xs: 4, md: 6 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ borderRadius: 5, overflow: "hidden", mb: 4, border: "1px solid rgba(255,255,255,0.08)" }}>
              {routeLoading && <LinearProgress />}
              {pickupPoint && dropPoint ? (
                <LeafletTripMap pickup={pickupPoint} drop={dropPoint} routePoints={activeRoutePoints}
                  driverToPickupRoute={currentBooking?.status === "Confirmed" ? driverToPickupPts : []}
                  driver={activeTripDriver} height={520} />
              ) : (
                <Box sx={{ height: 420, display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,0.03)" }}>
                  <Typography color="text.secondary">No active booking map.</Typography>
                </Box>
              )}
            </Card>

            {currentBooking && (
              <Card sx={{ borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)" }}>
                <CardContent sx={{ py: 2.5, px: 4 }}>
                  <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={1}>
                    {currentBooking.status === "Confirmed" && (
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <Box sx={{ width: 28, height: 4, bgcolor: "#38bdf8", borderRadius: 1 }} />
                        <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Your route to pickup (cyan dashed)</Typography>
                      </Stack>
                    )}
                    <Stack direction="row" spacing={0.8} alignItems="center">
                      <Box sx={{ width: 28, height: 4, bgcolor: "#f59e0b", borderRadius: 1 }} />
                      <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Pickup → Drop route (amber)</Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            {currentBooking ? (
              <Stack spacing={3}>
                <Card sx={{ borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)" }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Stack direction="row" spacing={1} sx={{ mb: 3 }} flexWrap="wrap" gap={0.8}>
                      <Chip label={currentBooking.status} size="small"
                        sx={{ fontWeight: 700, bgcolor: currentBooking.status === "Confirmed" ? "rgba(245,158,11,0.2)" : "rgba(34,197,94,0.2)", color: currentBooking.status === "Confirmed" ? "#fbbf24" : "#4ade80" }} />
                      <Chip label={currentBooking.cabCategoryLabel} size="small" sx={{ bgcolor: "rgba(255,255,255,0.07)" }} />
                    </Stack>
                    {[["📍 Pickup", currentBooking.pickupLocation], ["🏁 Drop", currentBooking.dropLocation], ["💰 Fare", `₹${currentBooking.fare}`], ["⏱ Est.", `${currentBooking.estimatedMinutes} min`]].map(([label, val]) => (
                      <Stack key={label} direction="row" spacing={2} sx={{ mb: 1.5 }}>
                        <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.5)", minWidth: 80 }}>{label}</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{val}</Typography>
                      </Stack>
                    ))}
                  </CardContent>
                </Card>

                <Card sx={{ borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)" }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Typography sx={{ fontWeight: 700, mb: 2.5, fontSize: 16 }}>Rider Details</Typography>
                    {[["Name", currentBooking.userName || "-"], ["Phone", currentBooking.userPhone || "-"]].map(([label, val]) => (
                      <Stack key={label} direction="row" spacing={2} sx={{ mb: 1.5 }}>
                        <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.5)", minWidth: 80 }}>{label}</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{val}</Typography>
                      </Stack>
                    ))}
                  </CardContent>
                </Card>

                {currentBooking.status === "Confirmed" && !currentBooking.isStartOtpVerified && (
                  <Card sx={{ borderRadius: 5, border: "1px solid rgba(245,158,11,0.3)" }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Typography sx={{ fontWeight: 700, mb: 2.5, fontSize: 16 }}>🔢 Verify Start OTP</Typography>
                      <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.6)", mb: 3 }}>Ask the rider for their 4-digit OTP to start the ride.</Typography>
                      <TextField label="Enter OTP" fullWidth size="small" value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        inputProps={{ maxLength: 4, style: { letterSpacing: 8, fontSize: 22, fontWeight: 700 } }}
                        sx={{ mb: 3 }} />
                      <Button fullWidth variant="contained" onClick={handleVerifyOtp} disabled={verifying || otp.length !== 4}
                        sx={{ borderRadius: 3, py: 1.5, background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#0a0a1a", fontWeight: 700 }}>
                        {verifying ? <CircularProgress size={18} sx={{ color: "#0a0a1a" }} /> : "Verify & Start Ride"}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {currentBooking.status === "InProgress" && (
                  <Card sx={{ borderRadius: 5, border: "1px solid rgba(34,197,94,0.3)" }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 }, textAlign: "center" }}>
                      <Typography sx={{ fontWeight: 700, mb: 1.5, fontSize: 16 }}>🏁 Arrive at Destination?</Typography>
                      <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.6)", mb: 3 }}>Click when the rider has been dropped off.</Typography>
                      <Button fullWidth variant="contained" onClick={handleComplete} disabled={completing}
                        sx={{ borderRadius: 3, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#fff", fontWeight: 700, py: 1.5 }}>
                        {completing ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "✅ Mark Ride Complete"}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {currentBooking.status === "Confirmed" && !currentBooking.isStartOtpVerified && (
                  <Card sx={{ borderRadius: 5, border: "1px solid rgba(239,68,68,0.3)", bgcolor: "rgba(239,68,68,0.04)" }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Typography sx={{ fontWeight: 700, mb: 1.5, fontSize: 15, color: "#f87171" }}>⚠️ Cancel This Ride</Typography>
                      <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.5)", mb: 2.5 }}>Only cancel if absolutely necessary. This will free the rider to book again.</Typography>
                      <Box component="select" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                        sx={{ width: "100%", p: 1.5, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(239,68,68,0.3)", fontSize: 13, mb: 2.5 }}>
                        {CANCEL_REASONS.map((r) => <option key={r} value={r} style={{ background: "#1b2332" }}>{r}</option>)}
                      </Box>
                      <Button fullWidth variant="outlined" color="error" disabled={driverCancelling}
                        onClick={() => doAction(() => cancelAcceptedRide({ bookingId: currentBooking.bookingId, reason: cancelReason }).unwrap(), "Ride cancelled. You are now available for new requests.")}
                        sx={{ borderRadius: 3, py: 1.2, borderColor: "rgba(239,68,68,0.5)" }}>
                        {driverCancelling ? <CircularProgress size={18} color="error" /> : "Cancel Booking"}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            ) : (
              <Card sx={{ borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)" }}>
                <CardContent sx={{ py: 8, textAlign: "center" }}>
                  <Typography sx={{ fontSize: 48, mb: 2 }}>🚕</Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>No active booking.</Typography>
                  <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.35)", mt: 1 }}>Accept a ride from the Requests tab.</Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {tab === 2 && (
        <Grid container spacing={{ xs: 4, md: 6 }}>
          {[
            { value: `₹${history?.totalEarnings?.toFixed(0) ?? 0}`, label: "Total Earnings",  color: "#4ade80", bg: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.25)"  },
            { value: history?.completedTrips ?? 0,                  label: "Trips Completed", color: "#fbbf24", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.25)" },
          ].map(({ value, label, color, bg, border }) => (
            <Grid key={label} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ borderRadius: 5, background: `linear-gradient(135deg,${bg},transparent)`, border: `1px solid ${border}` }}>
                <CardContent sx={{ p: { xs: 3, md: 4 }, textAlign: "center" }}>
                  <Typography sx={{ fontSize: 36, fontWeight: 900, color }}>{value}</Typography>
                  <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.5)", mt: 1 }}>{label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          <Grid size={{ xs: 12 }}>
            <Typography sx={{ fontWeight: 700, mb: 3, fontSize: 18 }}>Recent Completed Rides</Typography>
            {(history?.recentCompletedRides ?? []).length === 0 ? (
              <Card sx={{ borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)" }}><CardContent sx={{ py: 6, textAlign: "center" }}><Typography color="text.secondary">No completed rides yet.</Typography></CardContent></Card>
            ) : (
              <Stack spacing={3}>
                {(history?.recentCompletedRides ?? []).map((r) => (
                  <Card key={r.bookingId} sx={{ borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)" }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                        <Box>
                          <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>📍 {r.pickupLocation}</Typography>
                          <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.6)", mb: 1 }}>🏁 {r.dropLocation}</Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" gap={0.8}>
                            <Chip label={r.cabType}     size="small" sx={{ fontSize: 12, bgcolor: "rgba(245,158,11,0.12)", color: "#fbbf24" }} />
                            <Chip label={r.paymentMode} size="small" sx={{ fontSize: 12 }} />
                            {r.riderRating && <Chip label={`${r.riderRating}⭐`} size="small" sx={{ fontSize: 12, bgcolor: "rgba(255,215,0,0.1)", color: "#fbbf24" }} />}
                          </Stack>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Typography sx={{ fontWeight: 800, color: "#4ade80", fontSize: 22 }}>₹{r.fare}</Typography>
                          <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.4)", mt: 0.5 }}>{new Date(r.bookedAt).toLocaleDateString("en-IN")}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Grid>
        </Grid>
      )}
    </DashboardLayout>
  );
}
