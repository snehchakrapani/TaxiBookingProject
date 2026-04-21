import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Divider, Grid, LinearProgress, Stack, Typography,
} from "@mui/material";
import StarIcon       from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import DashboardLayout  from "../components/DashboardLayout";
import LeafletTripMap   from "../components/LeafletTripMap";
import {
  useGetBookingStatusQuery, useCancelBookingMutation,
  useSetPaymentModeMutation, useRateDriverMutation,
} from "../features/booking/bookingApi";
import { CANCEL_REASONS, STATUS_COLOR, getApiError } from "../constants/ride";

const STATUS_STEPS = ["Pending", "Confirmed", "InProgress", "Completed"];
const STATUS_LABEL = { Pending: "Pending", Confirmed: "Confirmed", InProgress: "In Transit", Completed: "Done" };
const RATING_TEXT  = ["", "Poor 😞", "Fair 😐", "Good 🙂", "Great 😊", "Excellent 🌟"];
const NAV_LINKS    = [{ label: "Book", to: "/book" }, { label: "History", to: "/history" }];

function interpolatePoint(points, progress) {
  if (!points || points.length < 2) return null;
  const idx = Math.min(Math.floor(progress * (points.length - 1)), points.length - 2);
  const t  = (progress * (points.length - 1)) - idx;
  const p1 = points[idx], p2 = points[idx + 1];
  return { lat: p1.lat + (p2.lat - p1.lat) * t, lng: p1.lng + (p2.lng - p1.lng) * t };
}

export default function RideStatusPage() {
  const { bookingId: id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error: queryError } = useGetBookingStatusQuery(id, { pollingInterval: 8000 });
  const [cancelBooking,  { isLoading: cancelling     }] = useCancelBookingMutation();
  const [setPaymentMode, { isLoading: settingPayment }] = useSetPaymentModeMutation();
  const [rateDriver,     { isLoading: rating         }] = useRateDriverMutation();

  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [payMode,      setPayMode]      = useState("Cash");
  const [hoveredStar,  setHoveredStar]  = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [actionMsg,    setActionMsg]    = useState("");
  const [actionErr,    setActionErr]    = useState("");
  const [animProgress, setAnimProgress] = useState(0);
  const animRef = useRef(null);

  const mapData = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(`booking_map_${id}`) || "null"); }
    catch { return null; }
  }, [id]);

  const pickupPoint = useMemo(() => {
    const { pickupLatitude: lat, pickupLongitude: lng } = data ?? {};
    return Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0) ? { lat, lng } : mapData?.pickup ?? null;
  }, [data, mapData]);

  const dropPoint = useMemo(() => {
    const { dropLatitude: lat, dropLongitude: lng } = data ?? {};
    return Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0) ? { lat, lng } : mapData?.drop ?? null;
  }, [data, mapData]);

  const routePoints = mapData?.route ?? [];

  useEffect(() => {
    if (data?.status !== "InProgress") { setAnimProgress(0); return; }
    if (animRef.current) clearInterval(animRef.current);
    animRef.current = setInterval(() => setAnimProgress((p) => Math.min(p + 0.003, 0.98)), 1000);
    return () => clearInterval(animRef.current);
  }, [data?.status]);

  const driverPoint = useMemo(() => {
    if (data?.status === "InProgress" && routePoints.length >= 2) return interpolatePoint(routePoints, animProgress);
    const { driverLatitude: lat, driverLongitude: lng } = data ?? {};
    return Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0) ? { lat, lng } : null;
  }, [data, routePoints, animProgress]);

  const statusIndex = STATUS_STEPS.indexOf(data?.status ?? "");
  const progressPct = data?.status === "Cancelled" ? 0 : statusIndex >= 0 ? Math.round((statusIndex / (STATUS_STEPS.length - 1)) * 100) : 0;

  const doAction = async (fn, successMsg) => {
    setActionMsg(""); setActionErr("");
    try { await fn(); setActionMsg(successMsg); }
    catch (e) { setActionErr(getApiError(e, "Action failed.")); }
  };

  if (isLoading) return (
    <DashboardLayout title="Ride Status" links={NAV_LINKS}>
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box>
    </DashboardLayout>
  );

  const infoRows = data ? [
    ["📍 Pickup",  data.pickupLocation],
    ["🏁 Drop",    data.dropLocation],
    ["🚗 Driver",  data.driverName],
    ["📞 Phone",   data.driverPhone],
    ["⭐ Rating",  data.driverRating?.toFixed(1)],
    ["🚙 Vehicle", `${data.vehicleName} | ${data.vehicleNumber}`],
    ["🛋 Seats",   `${data.cabCapacity} seats`],
    ["⏱ ETA",     data.estimatedMinutes ? `${data.estimatedMinutes} min` : "—"],
    ["💰 Fare",    `₹${data.fare}`],
    ["💳 Payment", data.paymentMode],
  ] : [];

  return (
    <DashboardLayout title="Ride Status" subtitle={`Booking #${id}`} links={NAV_LINKS}>
      <Grid container spacing={{ xs: 4, md: 6 }}>
        <Grid size={{ xs: 12 }}>
          <Card sx={{ borderRadius: 5, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
            {pickupPoint && dropPoint ? (
              <LeafletTripMap pickup={pickupPoint} drop={dropPoint} routePoints={routePoints} driver={driverPoint} height={560} />
            ) : (
              <Box sx={{ height: 260, display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,0.03)" }}>
                <Typography color="text.secondary">Map unavailable</Typography>
              </Box>
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)" }}>
            <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
              {queryError && <Alert severity="error" sx={{ mb: 2.5 }}>Could not load booking data.</Alert>}
              {actionMsg  && <Alert severity="success" sx={{ mb: 2.5 }}>{actionMsg}</Alert>}
              {actionErr  && <Alert severity="error"   sx={{ mb: 2.5 }}>{actionErr}</Alert>}

              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                <Chip label={STATUS_LABEL[data?.status] ?? data?.status ?? "—"} color={STATUS_COLOR[data?.status] ?? "default"} size="small" sx={{ fontWeight: 700 }} />
                {data?.status === "InProgress" && (
                  <Chip label="🚕 On the way" size="small" sx={{ bgcolor: "rgba(245,158,11,0.2)", color: "#fbbf24", fontWeight: 600 }} />
                )}
              </Stack>

              {data?.status !== "Cancelled" && (
                <Box sx={{ mb: 4 }}>
                  <LinearProgress variant="determinate" value={progressPct}
                    sx={{ height: 8, borderRadius: 4, bgcolor: "rgba(255,255,255,0.1)", "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg,#f59e0b,#ef4444)", borderRadius: 4 } }} />
                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.8 }}>
                    {STATUS_STEPS.map((s, i) => (
                      <Typography key={s} sx={{ fontSize: 10, fontWeight: i <= statusIndex ? 700 : 400, color: i <= statusIndex ? "#f59e0b" : "rgba(255,255,255,0.3)", whiteSpace: "nowrap", flex: 1, textAlign: i === 0 ? "left" : i === STATUS_STEPS.length - 1 ? "right" : "center" }}>
                        {STATUS_LABEL[s] || s}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              )}

              <Stack spacing={2.5}>
                {infoRows.map(([label, val]) => (
                  <Stack key={label} direction="row" spacing={1}>
                    <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.55)", minWidth: 100 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{val}</Typography>
                  </Stack>
                ))}

                {data?.startOtp && !data.isStartOtpVerified && (
                  <Box sx={{ p: 3, borderRadius: 3, bgcolor: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", textAlign: "center", mt: 2 }}>
                    <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.6)", mb: 1 }}>Share this OTP with your driver to start the ride</Typography>
                    <Typography sx={{ fontSize: 36, fontWeight: 900, letterSpacing: 8, color: "#f59e0b" }}>{data.startOtp}</Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)" }}>
            <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, fontSize: 20 }}>Actions</Typography>
              <Stack spacing={3}>
                {(data?.status === "Pending" || data?.status === "Confirmed") && (
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 1, color: "rgba(255,255,255,0.6)" }}>CANCEL RIDE</Typography>
                    <Stack spacing={1}>
                      <Box component="select" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                        sx={{ width: "100%", p: 1.2, borderRadius: 2, bgcolor: "rgba(255,255,255,0.06)", color: "white", border: "1px solid rgba(255,255,255,0.15)", fontSize: 13 }}>
                        {CANCEL_REASONS.map((r) => <option key={r} value={r} style={{ background: "#1b2332" }}>{r}</option>)}
                      </Box>
                      <Button variant="outlined" color="error" disabled={cancelling} sx={{ borderRadius: 2 }}
                        onClick={() => doAction(() => cancelBooking({ bookingId: Number(id), cancelReason }).unwrap(), "Booking cancelled.")}>
                        {cancelling ? <CircularProgress size={18} /> : "Cancel Booking"}
                      </Button>
                    </Stack>
                  </Box>
                )}

                {data?.status === "Completed" && !data?.riderRating && (
                  <>
                    <Box>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 1, color: "rgba(255,255,255,0.6)" }}>PAYMENT MODE</Typography>
                      <Stack direction="row" spacing={1}>
                        {["Cash", "UPI"].map((m) => (
                          <Button key={m} variant={payMode === m ? "contained" : "outlined"} size="small" onClick={() => setPayMode(m)} sx={{ flex: 1, borderRadius: 2 }}>
                            {m === "Cash" ? "💵 Cash" : "📲 UPI"}
                          </Button>
                        ))}
                      </Stack>
                      <Button variant="contained" fullWidth sx={{ mt: 1.5, borderRadius: 2 }} disabled={settingPayment}
                        onClick={() => doAction(() => setPaymentMode({ bookingId: Number(id), paymentMode: payMode }).unwrap(), "Payment mode saved.")}>
                        {settingPayment ? <CircularProgress size={18} /> : "Set Payment"}
                      </Button>
                    </Box>

                    <Box>
                      <Divider sx={{ mb: 2 }} />
                      <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 1.5, color: "rgba(255,255,255,0.6)" }}>RATE YOUR DRIVER</Typography>
                      <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mb: 1.5 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Box key={star} onClick={() => setSelectedStar(star)}
                            onMouseEnter={() => setHoveredStar(star)} onMouseLeave={() => setHoveredStar(0)}
                            sx={{ cursor: "pointer", transition: "transform 0.15s", "&:hover": { transform: "scale(1.2)" } }}>
                            {star <= (hoveredStar || selectedStar)
                              ? <StarIcon       sx={{ fontSize: 40, color: "#f59e0b" }} />
                              : <StarBorderIcon sx={{ fontSize: 40, color: "rgba(255,255,255,0.3)" }} />}
                          </Box>
                        ))}
                      </Stack>
                      {selectedStar > 0 && (
                        <Typography sx={{ textAlign: "center", fontSize: 12, mb: 1.5, color: "rgba(255,255,255,0.5)" }}>
                          {RATING_TEXT[selectedStar]}
                        </Typography>
                      )}
                      <Button variant="contained" fullWidth disabled={!selectedStar || rating}
                        sx={{ borderRadius: 2, background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#0a0a1a", fontWeight: 700 }}
                        onClick={() => doAction(() => rateDriver({ bookingId: Number(id), rating: selectedStar }).unwrap(), "Thank you for rating!")}>
                        {rating ? <CircularProgress size={18} sx={{ color: "#0a0a1a" }} /> : "Submit Rating"}
                      </Button>
                    </Box>
                  </>
                )}

                {data?.riderRating && (
                  <Box sx={{ textAlign: "center", py: 1 }}>
                    <Typography sx={{ color: "#4ade80", fontWeight: 700 }}>✅ Rating submitted — {data.riderRating} ⭐</Typography>
                  </Box>
                )}

                {data?.status === "Completed" && (
                  <Button variant="outlined" fullWidth onClick={() => navigate("/book")} sx={{ borderRadius: 2, mt: 1 }}>
                    📍 Book Another Ride
                  </Button>
                )}

                {data?.status === "Cancelled" && (
                  <Alert severity="warning">
                    Booking cancelled{data.cancellationFee > 0 ? `. ₹${data.cancellationFee} cancellation fee applies.` : "."}
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
}
